import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
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
  const [selectedChapter, setSelectedChapter] = useState("");
  const [selectedSection, setSelectedSection] = useState("");

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

  const isSectionValid = /^[1-9]\d{0,3}$/.test(selectedSection);

  const importQuestions = () => {
    if (!selectedCourse) {
      toast({
        title: "No course selected",
        description: "Please select a course first",
        variant: "destructive"
      });
      return;
    }

    if (!selectedChapter || !selectedSection) {
      toast({
        title: "Chapter and Section required",
        description: "Please select both chapter and section for organization",
        variant: "destructive"
      });
      return;
    }

    if (!isSectionValid) {
      toast({
        title: "Invalid section number",
        description: "Enter a valid section number (e.g., 101)",
        variant: "destructive"
      });
      return;
    }

    // Update questions with current chapter and section values to prevent stale data
    const payloadQuestions = previewQuestions.map(q => ({
      ...q,
      chapter: selectedChapter,
      category: selectedChapter,
      section: selectedSection,
      codeReference: `${selectedChapter} - Section ${selectedSection}`
    }));

    setImportStatus("importing");
    bulkImportMutation.mutate({
      courseId: selectedCourse,
      questions: payloadQuestions
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
          chapter: selectedChapter,
          section: selectedSection,
          category: selectedChapter,
          codeReference: `${selectedChapter} - ${selectedSection}`,
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <Label htmlFor="chapter">Chapter</Label>
                <Select value={selectedChapter} onValueChange={setSelectedChapter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select chapter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Chapter 1">Chapter 1 - Administration</SelectItem>
                    <SelectItem value="Chapter 2">Chapter 2 - Definitions</SelectItem>
                    <SelectItem value="Chapter 3">Chapter 3 - General Regulations</SelectItem>
                    <SelectItem value="Chapter 4">Chapter 4 - Fixtures, Faucets and Fittings</SelectItem>
                    <SelectItem value="Chapter 5">Chapter 5 - Water Heaters</SelectItem>
                    <SelectItem value="Chapter 6">Chapter 6 - Water Supply and Distribution</SelectItem>
                    <SelectItem value="Chapter 7">Chapter 7 - Sanitary Drainage</SelectItem>
                    <SelectItem value="Chapter 8">Chapter 8 - Indirect/Special Waste</SelectItem>
                    <SelectItem value="Chapter 9">Chapter 9 - Vents</SelectItem>
                    <SelectItem value="Chapter 10">Chapter 10 - Traps, Interceptors and Separators</SelectItem>
                    <SelectItem value="Chapter 11">Chapter 11 - Storm Drainage</SelectItem>
                    <SelectItem value="Chapter 12">Chapter 12 - Special Piping and Storage Systems</SelectItem>
                    <SelectItem value="Chapter 13">Chapter 13 - Referenced Standards</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="section">Section</Label>
                <Select value={selectedSection} onValueChange={setSelectedSection}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {/* Chapter 1 - Administration */}
                    <SelectItem value="101">§101 - Title and Adoption of Louisiana State Plumbing Code</SelectItem>
                    <SelectItem value="103">§103 - Availability</SelectItem>
                    <SelectItem value="105">§105 - Effective Date and Edition</SelectItem>
                    <SelectItem value="107">§107 - Purpose</SelectItem>
                    <SelectItem value="109">§109 - Code Remedial</SelectItem>
                    <SelectItem value="111">§111 - Scope</SelectItem>
                    <SelectItem value="113">§113 - Existing Buildings</SelectItem>
                    <SelectItem value="115">§115 - Special Historic Buildings</SelectItem>
                    <SelectItem value="117">§117 - Authority</SelectItem>
                    <SelectItem value="119">§119 - Right of Entry</SelectItem>
                    <SelectItem value="121">§121 - Enforcement</SelectItem>
                    <SelectItem value="123">§123 - Revocation of Permits or Approvals</SelectItem>
                    <SelectItem value="125">§125 - Unsafe Installations</SelectItem>
                    <SelectItem value="127">§127 - Requirements Not Covered By Code</SelectItem>
                    <SelectItem value="129">§129 - Alternate Materials and Methods</SelectItem>
                    <SelectItem value="131">§131 - Permits</SelectItem>
                    <SelectItem value="133">§133 - Tests</SelectItem>
                    <SelectItem value="135">§135 - Variances</SelectItem>
                    <SelectItem value="137">§137 - Violations and Penalties</SelectItem>
                    
                    {/* Chapter 2 - Definitions */}
                    <SelectItem value="201">§201 - General</SelectItem>
                    <SelectItem value="203">§203 - Definitions</SelectItem>
                    
                    {/* Chapter 3 - General Regulations */}
                    <SelectItem value="301">§301 - General Requirements</SelectItem>
                    <SelectItem value="303">§303 - Materials</SelectItem>
                    <SelectItem value="305">§305 - Protection of Pipes and Plumbing</SelectItem>
                    <SelectItem value="307">§307 - Workmanship</SelectItem>
                    <SelectItem value="309">§309 - Inspection and Tests</SelectItem>
                    <SelectItem value="311">§311 - Trenching, Excavation and Backfill</SelectItem>
                    <SelectItem value="313">§313 - Types of Joints</SelectItem>
                    <SelectItem value="315">§315 - Use of Joints</SelectItem>
                    <SelectItem value="317">§317 - Anchors, Hangers and Supports</SelectItem>
                    <SelectItem value="319">§319 - Tests of Plumbing Systems</SelectItem>
                    
                    {/* Chapter 4 - Fixtures, Faucets and Fittings */}
                    <SelectItem value="401">§401 - General</SelectItem>
                    <SelectItem value="403">§403 - Quality of Fixtures</SelectItem>
                    <SelectItem value="405">§405 - Water Connections to Fixtures</SelectItem>
                    <SelectItem value="407">§407 - Waste Connections to Fixtures</SelectItem>
                    <SelectItem value="409">§409 - Plumbing Fixtures</SelectItem>
                    <SelectItem value="411">§411 - Minimum Number of Fixtures</SelectItem>
                    <SelectItem value="413">§413 - Toilet and Bathing Room Requirements</SelectItem>
                    <SelectItem value="415">§415 - Special Fixtures and Equipment</SelectItem>
                    
                    {/* Chapter 5 - Water Heaters */}
                    <SelectItem value="501">§501 - General</SelectItem>
                    <SelectItem value="503">§503 - Installation</SelectItem>
                    <SelectItem value="505">§505 - Water Supply</SelectItem>
                    <SelectItem value="507">§507 - Required Pan</SelectItem>
                    <SelectItem value="509">§509 - Relief Valves</SelectItem>
                    <SelectItem value="511">§511 - Relief Valve Discharge</SelectItem>
                    <SelectItem value="513">§513 - Solar Water Heating Systems</SelectItem>
                    
                    {/* Chapter 6 - Water Supply and Distribution */}
                    <SelectItem value="601">§601 - General</SelectItem>
                    <SelectItem value="603">§603 - Materials</SelectItem>
                    <SelectItem value="605">§605 - Water Service Pipe</SelectItem>
                    <SelectItem value="607">§607 - Water Distribution</SelectItem>
                    <SelectItem value="609">§609 - Required Water Supply</SelectItem>
                    <SelectItem value="611">§611 - Water Supply System Design Criteria</SelectItem>
                    <SelectItem value="613">§613 - Disinfection of Water Systems</SelectItem>
                    <SelectItem value="615">§615 - Water System Tests</SelectItem>
                    <SelectItem value="617">§617 - Crossconnection Control</SelectItem>
                    <SelectItem value="619">§619 - Hot Water Supply System</SelectItem>
                    <SelectItem value="621">§621 - Joints and Connections</SelectItem>
                    <SelectItem value="623">§623 - Thermal Expansion Control</SelectItem>
                    
                    {/* Chapter 7 - Sanitary Drainage */}
                    <SelectItem value="701">§701 - General</SelectItem>
                    <SelectItem value="703">§703 - Materials</SelectItem>
                    <SelectItem value="705">§705 - Building Sewer</SelectItem>
                    <SelectItem value="707">§707 - Building Drain and Branches</SelectItem>
                    <SelectItem value="709">§709 - Joints and Connections</SelectItem>
                    <SelectItem value="711">§711 - Cleanouts</SelectItem>
                    <SelectItem value="713">§713 - Interceptors and Separators</SelectItem>
                    <SelectItem value="715">§715 - Manholes</SelectItem>
                    <SelectItem value="717">§717 - Backwater Valves</SelectItem>
                    <SelectItem value="719">§719 - Drainage System Installation</SelectItem>
                    <SelectItem value="721">§721 - Sizing of Drainage Piping</SelectItem>
                    <SelectItem value="723">§723 - Fixture Units</SelectItem>
                    <SelectItem value="725">§725 - Drainage System Sizing</SelectItem>
                    <SelectItem value="727">§727 - Sumps and Ejectors</SelectItem>
                    
                    {/* Chapter 8 - Indirect/Special Waste */}
                    <SelectItem value="801">§801 - General</SelectItem>
                    <SelectItem value="803">§803 - Indirect Waste Piping</SelectItem>
                    <SelectItem value="805">§805 - Waste Receptors</SelectItem>
                    <SelectItem value="807">§807 - Special Wastes</SelectItem>
                    
                    {/* Chapter 9 - Vents */}
                    <SelectItem value="901">§901 - General</SelectItem>
                    <SelectItem value="903">§903 - Vent Stacks and Stack Vents</SelectItem>
                    <SelectItem value="905">§905 - Vent Connections and Grades</SelectItem>
                    <SelectItem value="907">§907 - Vent Terminals</SelectItem>
                    <SelectItem value="909">§909 - Vent and Branch Vent Sizing</SelectItem>
                    <SelectItem value="911">§911 - Vent System Installation</SelectItem>
                    <SelectItem value="913">§913 - Combination Waste and Vent System</SelectItem>
                    <SelectItem value="915">§915 - Island Fixture Venting</SelectItem>
                    <SelectItem value="917">§917 - Wet Venting</SelectItem>
                    <SelectItem value="919">§919 - Circuit and Loop Venting</SelectItem>
                    <SelectItem value="921">§921 - Individual Vent</SelectItem>
                    <SelectItem value="923">§923 - Common Vent</SelectItem>
                    <SelectItem value="925">§925 - Stack Venting</SelectItem>
                    <SelectItem value="927">§927 - Waste Stack Vent</SelectItem>
                    <SelectItem value="929">§929 - Vent Headers</SelectItem>
                    <SelectItem value="931">§931 - Relief Vents</SelectItem>
                    
                    {/* Chapter 10 - Traps, Interceptors and Separators */}
                    <SelectItem value="1001">§1001 - Fixture Traps</SelectItem>
                    <SelectItem value="1003">§1003 - Trap Seals</SelectItem>
                    <SelectItem value="1005">§1005 - Trap Installation</SelectItem>
                    <SelectItem value="1007">§1007 - Building Traps</SelectItem>
                    <SelectItem value="1009">§1009 - Interceptors and Separators</SelectItem>
                    
                    {/* Chapter 11 - Storm Drainage */}
                    <SelectItem value="1101">§1101 - General</SelectItem>
                    <SelectItem value="1103">§1103 - Materials</SelectItem>
                    <SelectItem value="1105">§1105 - Roof Drains</SelectItem>
                    <SelectItem value="1107">§1107 - Controlled Flow Roof Drains</SelectItem>
                    <SelectItem value="1109">§1109 - Sizing of Storm Drainage Systems</SelectItem>
                    <SelectItem value="1111">§1111 - Secondary Drainage</SelectItem>
                    <SelectItem value="1113">§1113 - Subsoil Drains</SelectItem>
                    <SelectItem value="1115">§1115 - Disposal</SelectItem>
                    
                    {/* Chapter 12 - Special Piping and Storage Systems */}
                    <SelectItem value="1201">§1201 - General</SelectItem>
                    <SelectItem value="1203">§1203 - Medical Gas and Medical Vacuum Systems</SelectItem>
                    <SelectItem value="1205">§1205 - Fuel Oil Piping</SelectItem>
                    <SelectItem value="1207">§1207 - Oxygen Systems</SelectItem>
                    <SelectItem value="1209">§1209 - Nonflammable Medical Gas</SelectItem>
                    <SelectItem value="1211">§1211 - Vacuum Systems</SelectItem>
                    <SelectItem value="1213">§1213 - Laboratory Waste Systems</SelectItem>
                    
                    {/* Chapter 13 - Referenced Standards */}
                    <SelectItem value="1301">§1301 - General</SelectItem>
                    <SelectItem value="1303">§1303 - Standards</SelectItem>
                    <SelectItem value="1305">§1305 - References</SelectItem>
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
                    disabled={!selectedCourse || !selectedChapter || !isSectionValid || importStatus === "importing"}
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
              <CardDescription>
                Review the parsed questions before importing. Questions will be organized under {selectedChapter} - Section {selectedSection || '—'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 max-h-96 overflow-y-auto">
                {previewQuestions.map((question, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold">
                        Question {index + 1}: {question.questionText}
                      </h3>
                      <div className="flex gap-2 text-xs">
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">{selectedChapter}</span>
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">Section {selectedSection}</span>
                        <span className={`px-2 py-1 rounded ${
                          question.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                          question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          question.difficulty === 'hard' ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {question.difficulty}
                        </span>
                      </div>
                    </div>
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