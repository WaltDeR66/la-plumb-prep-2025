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
import { PLUMBING_CODE_SECTIONS } from "@/lib/plumbing-code-sections";

export default function BulkFlashcardImport() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedChapter, setSelectedChapter] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("medium");
  const [flashcardsText, setFlashcardsText] = useState("");
  const [previewFlashcards, setPreviewFlashcards] = useState<any[]>([]);
  const [importStatus, setImportStatus] = useState<"idle" | "parsing" | "previewing" | "importing" | "success">("idle");


  // Fetch courses
  const { data: courses } = useQuery({
    queryKey: ["/api/courses"],
  });

  const bulkImportMutation = useMutation({
    mutationFn: async (data: any) => await apiRequest("POST", "/api/admin/flashcards/bulk-import", data),
    onSuccess: (result: any) => {
      const { imported, duplicatesSkipped, totalSubmitted } = result;
      
      if (duplicatesSkipped > 0) {
        toast({ 
          title: "Import completed with duplicates detected", 
          description: `Added ${imported} new flashcards. Skipped ${duplicatesSkipped} duplicates out of ${totalSubmitted} total.`,
          variant: "default"
        });
      } else {
        toast({ 
          title: "All flashcards imported successfully!", 
          description: `Added ${imported} new flashcards to the course.`
        });
      }
      
      setImportStatus("success");
      setFlashcardsText("");
      setPreviewFlashcards([]);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/course-content"] });
    },
    onError: (error: any) => {
      toast({
        title: "Import failed",
        description: error.message || "Failed to import flashcards",
        variant: "destructive"
      });
      setImportStatus("idle");
    }
  });

  const parseFlashcards = () => {
    if (!flashcardsText.trim()) {
      toast({
        title: "No content",
        description: "Please enter flashcards to parse",
        variant: "destructive"
      });
      return;
    }

    setImportStatus("parsing");

    try {
      const parsed = parseFlashcardsFromText(flashcardsText);
      if (parsed.length === 0) {
        throw new Error("No valid flashcards found. Please check the format.");
      }
      
      setPreviewFlashcards(parsed);
      setImportStatus("previewing");
      toast({
        title: "Flashcards parsed successfully!",
        description: `Found ${parsed.length} flashcards ready for import.`
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

  const importFlashcards = () => {
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

    // Update flashcards with current chapter and section values to prevent stale data
    const payloadFlashcards = previewFlashcards.map(fc => ({
      ...fc,
      chapter: selectedChapter,
      category: selectedChapter,
      section: selectedSection,
      codeReference: `${selectedChapter} - Section ${selectedSection}`,
      difficulty: selectedDifficulty
    }));

    setImportStatus("importing");
    bulkImportMutation.mutate({
      courseId: selectedCourse,
      flashcards: payloadFlashcards
    });
  };

  const parseFlashcardsFromText = (text: string) => {
    const flashcards: any[] = [];
    
    // Clean and normalize the text
    const cleanText = text.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // Split by double blank lines (exactly what user is using)
    const cardBlocks = cleanText.split(/\n\n\n+/).filter(block => block.trim());
    
    // If no double blank lines found, try splitting by single blank lines and pair them
    let finalBlocks = cardBlocks;
    if (cardBlocks.length === 1) {
      const singleBlocks = cleanText.split(/\n\n/).filter(block => block.trim());
      finalBlocks = [];
      // Group every two blocks together (term, definition)
      for (let i = 0; i < singleBlocks.length; i += 2) {
        if (singleBlocks[i] && singleBlocks[i + 1]) {
          finalBlocks.push(`${singleBlocks[i]}\n\n${singleBlocks[i + 1]}`);
        }
      }
    }
    
    finalBlocks.forEach((block, index) => {
      const trimmedBlock = block.trim();
      
      // Split each block by single blank line to separate term from definition
      const parts = trimmedBlock.split(/\n\n/);
      
      if (parts.length >= 2) {
        const term = parts[0]?.trim();
        const definition = parts.slice(1).join('\n\n').trim();
        
        // Validate term and definition
        if (term && definition && term.length > 2 && definition.length > 10) {
          // Make sure term looks like a title (not too long, not multiple paragraphs)
          const termLines = term.split('\n').filter(line => line.trim());
          if (termLines.length <= 2 && term.length < 200) {
            flashcards.push({
              id: crypto.randomUUID(),
              front: term,
              back: definition,
              createdAt: new Date(),
            });
          }
        }
      }
    });
    
    return flashcards;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Bulk Flashcard Import</h1>
          <p className="text-muted-foreground">
            Import multiple flashcards at once by copying and pasting terms and definitions
          </p>
        </div>

        {/* Course and Chapter/Section Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Course & Louisiana Plumbing Code Organization</CardTitle>
            <CardDescription>Choose course, chapter, section and difficulty level for all flashcards in this batch</CardDescription>
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
              <FileText className="h-5 w-5" />
              Louisiana Plumbing Code Flashcard Format
            </CardTitle>
            <CardDescription>Copy and paste flashcards in your exact format</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Your Format: Term, Blank Line, Definition</h4>
                <pre className="bg-muted p-3 rounded text-xs">
{`Louisiana State Plumbing Code (LSPC)

The official title for the plumbing regulations adopted by the Department of Health and Hospitals, Office of Public Health in Louisiana, also referred to as "this code" or "this Part."


Part XIV (Plumbing) of the Sanitary Code, State of Louisiana (LAC 51:XIV)

The specific section of the Sanitary Code that deals with plumbing, adopted by the Department of Health and Hospitals, Office of Public Health.


Department of Health and Hospitals, Office of Public Health

The agency responsible for adopting and promulgating the Louisiana State Plumbing Code.`}
                </pre>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Format requirements:</strong> Term on first line, blank line, then definition. Separate each flashcard with double blank lines.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>

        {/* Flashcard Input */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Paste Your Flashcards</CardTitle>
            <CardDescription>Copy and paste multiple flashcards with terms and definitions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="flashcards">Flashcards Content</Label>
                <Textarea
                  id="flashcards"
                  value={flashcardsText}
                  onChange={(e) => setFlashcardsText(e.target.value)}
                  rows={15}
                  placeholder={`Paste your flashcards here...

Example:
Louisiana State Plumbing Code (LSPC)

The official title for the plumbing regulations adopted by the Department of Health and Hospitals, Office of Public Health in Louisiana.


Part XIV (Plumbing) of the Sanitary Code

The specific section of the Sanitary Code that deals with plumbing, adopted by the Department of Health and Hospitals, Office of Public Health.


R.S. 36:258(B)

The primary legal document that grants the authority for the Sanitary Code's promulgation.`}
                  className="font-mono text-sm"
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={parseFlashcards}
                  disabled={!flashcardsText.trim() || importStatus === "parsing"}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  {importStatus === "parsing" ? "Parsing..." : "Parse Flashcards"}
                </Button>
                
                {previewFlashcards.length > 0 && (
                  <Button 
                    onClick={importFlashcards}
                    disabled={!selectedCourse || importStatus === "importing"}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {importStatus === "importing" ? "Importing..." : `Import ${previewFlashcards.length} Flashcards`}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        {previewFlashcards.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Preview ({previewFlashcards.length} flashcards found)
              </CardTitle>
              <CardDescription>Review the parsed flashcards before importing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {previewFlashcards.map((card, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-blue-600 mb-2">Front (Term)</h4>
                        <p className="text-sm bg-blue-50 p-3 rounded">
                          {card.front}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-green-600 mb-2">Back (Definition)</h4>
                        <p className="text-sm bg-green-50 p-3 rounded">
                          {card.back}
                        </p>
                      </div>
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
              Flashcards imported successfully! You can now view them in the Content Management section.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}