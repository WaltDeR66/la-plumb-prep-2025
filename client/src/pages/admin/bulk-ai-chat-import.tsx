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
import { Upload, FileText, CheckCircle, AlertCircle, Brain } from "lucide-react";
import { PLUMBING_CODE_SECTIONS } from "@/lib/plumbing-code-sections";

export default function BulkAIChatImport() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedChapter, setSelectedChapter] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("medium");
  const [chatContentText, setChatContentText] = useState("");
  const [previewContent, setPreviewContent] = useState<any[]>([]);
  const [importStatus, setImportStatus] = useState<"idle" | "parsing" | "previewing" | "importing" | "success">("idle");


  // Fetch courses
  const { data: courses } = useQuery({
    queryKey: ["/api/courses"],
  });

  const bulkImportMutation = useMutation({
    mutationFn: async (data: any) => await apiRequest("POST", "/api/admin/ai-chat/bulk-import", data),
    onSuccess: (result: any) => {
      const { imported, duplicatesSkipped, totalSubmitted } = result;
      
      if (duplicatesSkipped > 0) {
        toast({ 
          title: "Import completed with duplicates detected", 
          description: `Added ${imported} new AI chat content. Skipped ${duplicatesSkipped} duplicates out of ${totalSubmitted} total.`,
          variant: "default"
        });
      } else {
        toast({ 
          title: "All AI chat content imported successfully!", 
          description: `Added ${imported} new content pieces to the AI mentor system.`
        });
      }
      
      setImportStatus("success");
      setChatContentText("");
      setPreviewContent([]);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/course-content"] });
    },
    onError: (error: any) => {
      toast({
        title: "Import failed",
        description: error.message || "Failed to import AI chat content",
        variant: "destructive"
      });
      setImportStatus("idle");
    }
  });

  const parseAIChatContent = () => {
    if (!chatContentText.trim()) {
      toast({
        title: "No content",
        description: "Please enter AI chat content to parse",
        variant: "destructive"
      });
      return;
    }

    setImportStatus("parsing");

    try {
      const parsed = parseAIChatFromText(chatContentText);
      if (parsed.length === 0) {
        throw new Error("No valid AI chat content found. Please check the format.");
      }
      
      setPreviewContent(parsed);
      setImportStatus("previewing");
      toast({
        title: "AI chat content parsed successfully!",
        description: `Found ${parsed.length} content pieces ready for import.`
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

  const isSectionValid = selectedSection && selectedSection.trim().length > 0;

  const importAIChatContent = () => {
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

    // Update content with current chapter and section values to prevent stale data
    const payloadContent = previewContent.map(content => ({
      ...content,
      chapter: selectedChapter,
      category: selectedChapter,
      section: selectedSection,
      codeReference: `${selectedChapter} - Section ${selectedSection}`,
      difficulty: selectedDifficulty
    }));

    setImportStatus("importing");
    bulkImportMutation.mutate({
      courseId: selectedCourse,
      chatContent: payloadContent
    });
  };

  const parseAIChatFromText = (text: string) => {
    const content: any[] = [];
    
    // Split by Q&A patterns (Q:, A:, Question:, Answer:)
    const qaSections = text.split(/(?=Q:|Question:|QUESTION:)/i);
    
    qaSections.forEach((section, index) => {
      const lines = section.trim().split('\n').filter(line => line.trim());
      if (lines.length < 2) return;
      
      // Extract question
      const questionLine = lines[0];
      const questionMatch = questionLine.match(/^(?:Q:|Question:|QUESTION:)\s*(.+)/i);
      if (!questionMatch) return;
      
      const question = questionMatch[1].trim();
      
      // Find answer
      let answerStartIndex = -1;
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].match(/^(?:A:|Answer:|ANSWER:)/i)) {
          answerStartIndex = i;
          break;
        }
      }
      
      if (answerStartIndex === -1) {
        // If no explicit answer marker, treat remaining lines as answer
        answerStartIndex = 1;
      }
      
      // Extract answer text
      const answerLines = lines.slice(answerStartIndex);
      const answerText = answerLines.join('\n')
        .replace(/^(?:A:|Answer:|ANSWER:)\s*/i, '') // Remove answer prefix
        .trim();
      
      if (question.length > 5 && answerText.length > 20) {
        content.push({
          id: crypto.randomUUID(),
          question: question,
          answer: answerText,
          type: 'ai_chat_qa',
          context: 'Louisiana State Plumbing Code',
          tags: extractTags(question + ' ' + answerText),
          createdAt: new Date(),
        });
      }
    });
    
    // If no Q&A pattern found, try parsing by educational topics
    if (content.length === 0) {
      const topics = text.split(/\n\s*\n/).filter(p => p.trim());
      
      topics.forEach((topic, index) => {
        const lines = topic.trim().split('\n');
        if (lines.length < 2) return;
        
        // Use first line as topic, rest as explanation
        const topicTitle = lines[0].trim();
        const explanation = lines.slice(1).join('\n').trim();
        
        if (topicTitle.length > 5 && explanation.length > 20) {
          content.push({
            id: crypto.randomUUID(),
            question: `What about ${topicTitle}?`,
            answer: explanation,
            type: 'ai_chat_topic',
            context: 'Louisiana State Plumbing Code',
            tags: extractTags(topicTitle + ' ' + explanation),
            createdAt: new Date(),
          });
        }
      });
    }
    
    return content;
  };

  const extractTags = (text: string) => {
    const commonTerms = [
      'LSPC', 'Louisiana State Plumbing Code', 'plumbing', 'code', 'regulation',
      'administration', 'approval', 'installation', 'inspection', 'testing',
      'fixtures', 'water heaters', 'drainage', 'vents', 'pipes', 'fittings',
      'health', 'safety', 'compliance', 'authority', 'department'
    ];
    
    const foundTerms = commonTerms.filter(term => 
      text.toLowerCase().includes(term.toLowerCase())
    );
    
    return foundTerms.slice(0, 5); // Limit to 5 tags
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Bulk AI Chat Content Import</h1>
          <p className="text-muted-foreground">
            Import educational content for the AI mentor chat system with Q&A format
          </p>
        </div>

        {/* Course and Chapter/Section Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Course & Louisiana Plumbing Code Organization</CardTitle>
            <CardDescription>Choose course, chapter, section and difficulty level for all AI chat content in this batch</CardDescription>
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
                    <SelectItem value="Chapter 13">Chapter 13 - Health Care Facilities and Other Special Occupancies</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="section">Section</Label>
                <Input
                  id="section"
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  placeholder="Enter section number (e.g., 101, 103, 105...)"
                  disabled={!selectedChapter}
                />
              </div>
              <div>
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy - Basic recall</SelectItem>
                    <SelectItem value="medium">Medium - Application</SelectItem>
                    <SelectItem value="hard">Hard - Analysis</SelectItem>
                    <SelectItem value="very_hard">Very Hard - Synthesis</SelectItem>
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
              <Brain className="h-5 w-5" />
              Louisiana Plumbing Code AI Chat Format
            </CardTitle>
            <CardDescription>Copy and paste Q&A content or educational topics for the AI mentor</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Your Format: Questions and answers for AI mentor training</h4>
                <pre className="bg-muted p-3 rounded text-xs">
{`This section, §101, deals with the general administration of the Louisiana State Plumbing Code (LSPC). Essentially, it explains that the Department of Health and Hospitals has officially adopted Part XIV of the Sanitary Code, which is referred to as the Louisiana State Plumbing Code.

🧠 Key Concept: Louisiana State Plumbing Code (LSPC)
This is the official set of rules and regulations governing plumbing work in Louisiana, adopted by the state's Department of Health and Hospitals.

Who enforces the LSPC?

The Department of Health and Hospitals, Office of Public Health, is responsible for adopting the Louisiana State Plumbing Code.

🧠 Key Concept: Enforcement Authority
The "Department of Health and Hospitals, Office of Public Health" is the agency that adopts and oversees the Louisiana State Plumbing Code.

What is the legal basis for the LSPC?

The legal foundation for the Louisiana State Plumbing Code (LSPC) stems from specific Louisiana Revised Statutes (R.S.).

💡 Key Information: Code History
Promulgated: June 2002
Amended: November 2012`}
                </pre>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Format requirements:</strong> Educational content with 🧠 Key Concepts, 💡 Key Information, and Q&A sections. Supports both structured lessons and simple Q&A format.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>

        {/* AI Chat Content Input */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Paste Your AI Chat Content</CardTitle>
            <CardDescription>Copy and paste Q&A content or educational material for AI mentor training</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="chatcontent">AI Chat Content</Label>
                <Textarea
                  id="chatcontent"
                  value={chatContentText}
                  onChange={(e) => setChatContentText(e.target.value)}
                  rows={15}
                  placeholder={`Paste your AI chat content here...

Example:
This section, §101, deals with the general administration of the Louisiana State Plumbing Code (LSPC).

🧠 Key Concept: Louisiana State Plumbing Code (LSPC)
This is the official set of rules and regulations governing plumbing work in Louisiana.

Who enforces the LSPC?

The Department of Health and Hospitals, Office of Public Health, is responsible for adopting the code.

🧠 Key Concept: Enforcement Authority
The "Department of Health and Hospitals, Office of Public Health" is the agency that adopts and oversees the Louisiana State Plumbing Code.

💡 Key Information: Code History
Promulgated: June 2002
Amended: November 2012`}
                  className="font-mono text-sm"
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={parseAIChatContent}
                  disabled={!chatContentText.trim() || importStatus === "parsing"}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  {importStatus === "parsing" ? "Parsing..." : "Parse Content"}
                </Button>
                
                {previewContent.length > 0 && (
                  <Button 
                    onClick={importAIChatContent}
                    disabled={!selectedCourse || importStatus === "importing"}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {importStatus === "importing" ? "Importing..." : `Import ${previewContent.length} Items`}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        {previewContent.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Preview ({previewContent.length} AI chat items found)
              </CardTitle>
              <CardDescription>Review the parsed content before importing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {previewContent.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-blue-600 mb-2">Question</h4>
                        <p className="text-sm bg-blue-50 p-3 rounded">
                          {item.question}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-green-600 mb-2">Answer</h4>
                        <div className="text-sm bg-green-50 p-3 rounded whitespace-pre-line">
                          {item.answer.substring(0, 300)}{item.answer.length > 300 ? "..." : ""}
                        </div>
                      </div>
                      {item.tags && item.tags.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-purple-600 mb-2">Tags</h4>
                          <div className="flex flex-wrap gap-1">
                            {item.tags.map((tag: string, i: number) => (
                              <span key={i} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
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
              AI chat content imported successfully! The AI mentor system now has new training data.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}