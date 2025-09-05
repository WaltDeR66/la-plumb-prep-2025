import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";

export default function BulkQuestionImport() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCourse, setSelectedCourse] = useState("");
  const [questionsText, setQuestionsText] = useState("");
  const [previewQuestions, setPreviewQuestions] = useState<any[]>([]);
  const [importStatus, setImportStatus] = useState<"idle" | "parsing" | "previewing" | "importing" | "success">("idle");
  const [selectedDifficulty, setSelectedDifficulty] = useState("medium");

  // Fetch courses
  const { data: courses } = useQuery({
    queryKey: ["/api/courses"],
  });

  const bulkImportMutation = useMutation({
    mutationFn: async (data: any) => await apiRequest("POST", "/api/admin/questions/bulk-import", data),
    onSuccess: (result: any) => {
      const { imported, duplicatesSkipped, totalSubmitted } = result;
      
      if (duplicatesSkipped > 0) {
        toast({ 
          title: "Import completed with duplicates detected", 
          description: `Added ${imported} new questions. Skipped ${duplicatesSkipped} duplicates out of ${totalSubmitted} total.`,
          variant: "default"
        });
      } else {
        toast({ 
          title: "All questions imported successfully!", 
          description: `Added ${imported} new questions to the course.`
        });
      }
      
      setImportStatus("success");
      setQuestionsText("");
      setPreviewQuestions([]);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/course-content"] });
    },
    onError: (error: any) => {
      toast({
        title: "Import failed",
        description: error.message || "Failed to import questions",
        variant: "destructive"
      });
      setImportStatus("idle");
    }
  });

  const parseQuestions = () => {
    if (!questionsText.trim()) {
      toast({
        title: "No content",
        description: "Please enter questions to parse",
        variant: "destructive"
      });
      return;
    }

    setImportStatus("parsing");

    try {
      // Parse the text input into structured questions
      const parsed = parseQuestionsFromText(questionsText);
      if (parsed.length === 0) {
        throw new Error("No valid questions found. Please check the format.");
      }
      
      setPreviewQuestions(parsed);
      setImportStatus("previewing");
      toast({
        title: "Questions parsed successfully!",
        description: `Found ${parsed.length} questions ready for import.`
      });
    } catch (error: any) {
      toast({
        title: "Parse error",
        description: error.message,
        variant: "destructive"
      });
      setImportStatus("idle");
    }
  };

  const importQuestions = () => {
    if (!selectedCourse) {
      toast({
        title: "No course selected",
        description: "Please select a course first",
        variant: "destructive"
      });
      return;
    }

    setImportStatus("importing");
    bulkImportMutation.mutate({
      courseId: selectedCourse,
      questions: previewQuestions
    });
  };

  const parseQuestionsFromText = (text: string) => {
    const questions: any[] = [];
    
    // Split by double newlines to separate questions
    const questionBlocks = text.split(/\n\s*\n/).filter(block => block.trim());
    
    questionBlocks.forEach((block, index) => {
      const lines = block.trim().split('\n').filter(line => line.trim());
      if (lines.length < 6) return; // Need question + 4 options + answer line
      
      // Extract question text (first line)
      const questionText = lines[0].trim();
      if (!questionText) return;
      
      // Extract options (A., B., C., D.)
      const options: string[] = [];
      let answerLine = '';
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Check if this is the ANSWER line
        if (line.startsWith('ANSWER:')) {
          answerLine = line;
          break;
        }
        
        // Match option patterns: A., B., C., D.
        const optionMatch = line.match(/^([A-D])\. (.+)$/i);
        
        if (optionMatch) {
          const optionText = optionMatch[2].trim();
          options.push(optionText);
        }
      }
      
      // Extract correct answer from ANSWER line
      let correctAnswer = 0;
      if (answerLine) {
        const answerMatch = answerLine.match(/ANSWER:\s*([A-D])/i);
        if (answerMatch) {
          const answerLetter = answerMatch[1].toUpperCase();
          correctAnswer = answerLetter.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
        }
      }
      
      // Only add if we have exactly 4 options
      if (options.length === 4 && answerLine) {
        questions.push({
          questionText,
          options,
          correctAnswer,
          difficulty: selectedDifficulty,
          explanation: `Explanation for question ${index + 1}`
        });
      }
    });
    
    return questions;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Bulk Question Import</h1>
          <p className="text-muted-foreground">
            Import multiple questions at once by copying and pasting
          </p>
        </div>

        {/* Course and Difficulty Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Course & Difficulty Settings</CardTitle>
            <CardDescription>Choose course and set difficulty level for all questions in this batch</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="course">Select Course</Label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {(courses as any[])?.map((course: any) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="difficulty">Question Difficulty</Label>
                <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                    <SelectItem value="very_hard">Very Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Format Instructions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Supported Formats
            </CardTitle>
            <CardDescription>Copy and paste questions in any of these formats</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Your Format: Louisiana Plumbing Code Style</h4>
                <pre className="bg-muted p-3 rounded text-xs">
{`Which specific statutory provision grants the primary authority for the promulgation of the Louisiana State Plumbing Code as outlined in the text?
A. LAC 51:XIV
B. R.S. 40:5(2)(3)(7)(9)(16)(17)(20)
C. R.S. 36:258(B)
D. R.S. 40:4(A)(7)
ANSWER: C

Under what precise regulatory nomenclature is the Louisiana State Plumbing Code initially adopted?
A. Chapters 1 and 4 of Title 40 of the Louisiana Revised Statutes
B. Louisiana Revised Statutes Title 40
C. Part XIV (Plumbing) of the Sanitary Code, State of Louisiana (LAC 51:XIV)
D. Louisiana State Plumbing Code (LSPC)
ANSWER: C`}
                </pre>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Required format:</strong> Each question must end with "ANSWER: [letter]" (e.g., "ANSWER: C")
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>

        {/* Question Input */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Paste Your Questions</CardTitle>
            <CardDescription>Copy and paste multiple questions with their answer choices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="questions">Questions and Answers</Label>
                <Textarea
                  id="questions"
                  value={questionsText}
                  onChange={(e) => setQuestionsText(e.target.value)}
                  rows={15}
                  placeholder="Paste your questions here...

Example:
Which specific statutory provision grants the primary authority?
A. LAC 51:XIV
B. R.S. 40:5(2)(3)(7)(9)(16)(17)(20)
C. R.S. 36:258(B)
D. R.S. 40:4(A)(7)
ANSWER: C

Under what precise regulatory nomenclature is the code adopted?
A. Chapters 1 and 4 of Title 40
B. Louisiana Revised Statutes Title 40
C. Part XIV (Plumbing) of the Sanitary Code
D. Louisiana State Plumbing Code (LSPC)
ANSWER: C"
                  className="font-mono text-sm"
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={parseQuestions}
                  disabled={!questionsText.trim() || importStatus === "parsing"}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  {importStatus === "parsing" ? "Parsing..." : "Parse Questions"}
                </Button>
                
                {previewQuestions.length > 0 && (
                  <Button 
                    onClick={importQuestions}
                    disabled={!selectedCourse || importStatus === "importing"}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {importStatus === "importing" ? "Importing..." : `Import ${previewQuestions.length} Questions`}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        {previewQuestions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Preview ({previewQuestions.length} questions found)
              </CardTitle>
              <CardDescription>Review the parsed questions before importing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 max-h-96 overflow-y-auto">
                {previewQuestions.map((question, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">
                      Question {index + 1}: {question.questionText}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {question.options.map((option: string, optIndex: number) => (
                        <div
                          key={optIndex}
                          className={`p-2 rounded text-sm ${
                            optIndex === question.correctAnswer
                              ? 'bg-green-100 text-green-800 font-semibold'
                              : 'bg-muted'
                          }`}
                        >
                          {String.fromCharCode(65 + optIndex)}. {option}
                          {optIndex === question.correctAnswer && ' ✓'}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {importStatus === "success" && (
          <Alert className="mt-6">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Questions imported successfully! You can now view them in the Content Management section.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}