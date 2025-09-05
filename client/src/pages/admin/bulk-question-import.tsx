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

  // Fetch courses
  const { data: courses } = useQuery({
    queryKey: ["/api/courses"],
  });

  const bulkImportMutation = useMutation({
    mutationFn: async (data: any) => await apiRequest("POST", "/api/admin/questions/bulk-import", data),
    onSuccess: (result) => {
      toast({ 
        title: "Questions imported successfully!", 
        description: `Added ${result.count} questions to the course.`
      });
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
    
    // Split by question numbers (1., 2., etc.) or double newlines
    const questionBlocks = text.split(/(?=\d+\.|^\d+\))/gm).filter(block => block.trim());
    
    questionBlocks.forEach((block, index) => {
      const lines = block.trim().split('\n').filter(line => line.trim());
      if (lines.length < 5) return; // Need at least question + 4 options
      
      // Extract question text (first line, remove number)
      const questionText = lines[0].replace(/^\d+[\.\)]\s*/, '').trim();
      if (!questionText) return;
      
      // Extract options (A., B., C., D. or similar)
      const options: string[] = [];
      let correctAnswer = 0;
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Match option patterns: A., A), (A), etc.
        const optionMatch = line.match(/^[A-D][\.\)]\s*(.+)$/i) || 
                           line.match(/^\([A-D]\)\s*(.+)$/i);
        
        if (optionMatch) {
          const optionLetter = optionMatch[0].charAt(optionMatch[0].search(/[A-D]/i)).toUpperCase();
          const optionText = optionMatch[1].trim();
          
          // Check for correct answer indicators (✓, *, CORRECT, etc.)
          if (optionText.includes('✓') || optionText.includes('*') || 
              optionText.toUpperCase().includes('CORRECT') ||
              line.includes('✓') || line.includes('*')) {
            correctAnswer = options.length;
          }
          
          // Clean the option text
          options.push(optionText.replace(/[✓\*]/g, '').replace(/\s*\(?\s*correct\s*\)?\s*/gi, '').trim());
        }
      }
      
      // Only add if we have 4 options
      if (options.length >= 4) {
        questions.push({
          questionText,
          options: options.slice(0, 4), // Take first 4 options
          correctAnswer,
          difficulty: "medium",
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

        {/* Course Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Course</CardTitle>
            <CardDescription>Choose which course to add questions to</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="w-full max-w-md">
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
                <h4 className="font-semibold mb-2">Format 1: Numbered with letters</h4>
                <pre className="bg-muted p-3 rounded text-xs">
{`1. What is the primary purpose of a P-trap?
A. To prevent sewer gases from entering the building ✓
B. To increase water pressure
C. To filter water
D. To reduce noise

2. The minimum trap seal depth is:
A. 1 inch
B. 2 inches ✓
C. 3 inches
D. 4 inches`}
                </pre>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Format 2: With parentheses</h4>
                <pre className="bg-muted p-3 rounded text-xs">
{`1) Which pipe material is NOT approved for DWV systems?
(A) PVC
(B) Cast Iron
(C) Galvanized Steel * CORRECT
(D) ABS`}
                </pre>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Mark correct answers with:</strong> ✓, *, "CORRECT", or similar indicators
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
1. What is the standard pipe size for a residential main drain?
A. 2 inches
B. 3 inches  
C. 4 inches ✓
D. 6 inches

2. The maximum length for a fixture drain is:
A. 5 feet
B. 8 feet ✓
C. 10 feet
D. 12 feet"
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