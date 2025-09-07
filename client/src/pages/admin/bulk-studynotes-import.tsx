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
import { Upload, FileText, CheckCircle, AlertCircle, BookOpen } from "lucide-react";
import { PLUMBING_CODE_SECTIONS } from "@/lib/plumbing-code-sections";

export default function BulkStudyNotesImport() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedChapter, setSelectedChapter] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("medium");
  const [studyNotesText, setStudyNotesText] = useState("");
  const [previewNotes, setPreviewNotes] = useState<any[]>([]);
  const [importStatus, setImportStatus] = useState<"idle" | "parsing" | "previewing" | "importing" | "success">("idle");


  // Fetch courses
  const { data: courses } = useQuery({
    queryKey: ["/api/courses"],
  });

  const bulkImportMutation = useMutation({
    mutationFn: async (data: any) => await apiRequest("POST", "/api/admin/study-notes/bulk-import", data),
    onSuccess: (result: any) => {
      const { imported, duplicatesSkipped, totalSubmitted } = result;
      
      if (duplicatesSkipped > 0) {
        toast({ 
          title: "Import completed with duplicates detected", 
          description: `Added ${imported} new study notes. Skipped ${duplicatesSkipped} duplicates out of ${totalSubmitted} total.`,
          variant: "default"
        });
      } else {
        toast({ 
          title: "All study notes imported successfully!", 
          description: `Added ${imported} new study notes to the course.`
        });
      }
      
      setImportStatus("success");
      setStudyNotesText("");
      setPreviewNotes([]);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/course-content"] });
    },
    onError: (error: any) => {
      toast({
        title: "Import failed",
        description: error.message || "Failed to import study notes",
        variant: "destructive"
      });
      setImportStatus("idle");
    }
  });

  const parseStudyNotes = () => {
    if (!studyNotesText.trim()) {
      toast({
        title: "No content",
        description: "Please enter study notes to parse",
        variant: "destructive"
      });
      return;
    }

    setImportStatus("parsing");

    try {
      const parsed = parseStudyNotesFromText(studyNotesText);
      if (parsed.length === 0) {
        throw new Error("No valid study notes found. Please check the format.");
      }
      
      setPreviewNotes(parsed);
      setImportStatus("previewing");
      toast({
        title: "Study notes parsed successfully!",
        description: `Found ${parsed.length} study note sections ready for import.`
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

  const importStudyNotes = () => {
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

    // Update study notes with current chapter and section values to prevent stale data
    // Extract chapter number from "Chapter 1" format to integer
    const chapterNumber = parseInt(selectedChapter.replace('Chapter ', ''));
    const sectionNumber = parseInt(selectedSection);
    
    const payloadNotes = previewNotes.map(note => ({
      ...note,
      chapter: chapterNumber,
      category: selectedChapter,
      section: sectionNumber,
      codeReference: `${selectedChapter} - Section ${selectedSection}`,
      difficulty: selectedDifficulty
    }));

    setImportStatus("importing");
    bulkImportMutation.mutate({
      courseId: selectedCourse,
      studyNotes: payloadNotes
    });
  };

  const parseStudyNotesFromText = (text: string) => {
    const studyNotes: any[] = [];
    
    // Split by sections (identified by main headings)
    const sections = text.split(/\n(?=[A-Z][a-zA-Z\s]+\n)/);
    
    sections.forEach((section, index) => {
      const lines = section.trim().split('\n').filter(line => line.trim());
      if (lines.length < 2) return;
      
      // First line is typically the main heading
      const title = lines[0].trim();
      if (!title || title.length < 3) return;
      
      // Collect content (everything after the title)
      const contentLines = lines.slice(1);
      const content = contentLines.join('\n').trim();
      
      if (content.length > 10) {
        studyNotes.push({
          id: crypto.randomUUID(),
          title: title,
          content: content,
          type: 'study_notes',
          createdAt: new Date(),
        });
      }
    });
    
    // If no clear sections found, try parsing by paragraph structure
    if (studyNotes.length === 0) {
      const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
      
      paragraphs.forEach((paragraph, index) => {
        const lines = paragraph.trim().split('\n');
        if (lines.length < 2) return;
        
        // Use first line as title, rest as content
        const title = lines[0].trim();
        const content = lines.slice(1).join('\n').trim();
        
        if (title.length > 3 && content.length > 10) {
          studyNotes.push({
            id: crypto.randomUUID(),
            title: title,
            content: content,
            type: 'study_notes',
            createdAt: new Date(),
          });
        }
      });
    }
    
    return studyNotes;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Bulk Study Notes Import</h1>
          <p className="text-muted-foreground">
            Import structured study notes with headings and content sections
          </p>
        </div>

        {/* Course and Chapter/Section Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Course & Louisiana Plumbing Code Organization</CardTitle>
            <CardDescription>Choose course, chapter, section and difficulty level for all study notes in this batch</CardDescription>
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
              <BookOpen className="h-5 w-5" />
              Louisiana Plumbing Code Study Notes Format
            </CardTitle>
            <CardDescription>Copy and paste structured study notes with headings and content</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Your Format: Heading followed by content paragraphs</h4>
                <pre className="bg-muted p-3 rounded text-xs">
{`Louisiana State Plumbing Code (LSPC) Adoption
The Louisiana State Plumbing Code (LSPC) is established under Chapter 1, Subchapter A, General, §101 of administrative regulations.
The Department of Health and Hospitals, Office of Public Health, formally adopts Part XIV (Plumbing) of the Sanitary Code for the state of Louisiana.
"Part XIV (Plumbing) of the Sanitary Code, State of Louisiana" can be referred to as the "Louisiana State Plumbing Code," "this code," or "this Part."

Authority and Promulgation
The primary legal authority for establishing the sanitary code is R.S. 36:258(B).
Additional provisions concerning the code are detailed in Chapters 1 and 4 of Title 40 of the Louisiana Revised Statutes.
This Part of the code is promulgated following R.S. 40:4(A)(7) and R.S. 40:5(2)(3)(7)(9)(16)(17)(20).`}
                </pre>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Format requirements:</strong> Heading line followed by content paragraphs. Separate sections with blank lines.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>

        {/* Study Notes Input */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Paste Your Study Notes</CardTitle>
            <CardDescription>Copy and paste structured study notes with headings and content</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="studynotes">Study Notes Content</Label>
                <Textarea
                  id="studynotes"
                  value={studyNotesText}
                  onChange={(e) => setStudyNotesText(e.target.value)}
                  rows={15}
                  placeholder={`Paste your study notes here...

Example:
Louisiana State Plumbing Code (LSPC) Adoption
The Louisiana State Plumbing Code (LSPC) is established under Chapter 1, Subchapter A, General, §101 of administrative regulations.
The Department of Health and Hospitals, Office of Public Health, formally adopts Part XIV (Plumbing) of the Sanitary Code for the state of Louisiana.

Authority and Promulgation
The primary legal authority for establishing the sanitary code is R.S. 36:258(B).
Additional provisions concerning the code are detailed in Chapters 1 and 4 of Title 40 of the Louisiana Revised Statutes.

Legal Framework
This Part of the code is promulgated following R.S. 40:4(A)(7) and R.S. 40:5(2)(3)(7)(9)(16)(17)(20).
The Department of Health and Hospitals, Office of Public Health, initially promulgated this code in June 2002.`}
                  className="font-mono text-sm"
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={parseStudyNotes}
                  disabled={!studyNotesText.trim() || importStatus === "parsing"}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  {importStatus === "parsing" ? "Parsing..." : "Parse Study Notes"}
                </Button>
                
                {previewNotes.length > 0 && (
                  <Button 
                    onClick={importStudyNotes}
                    disabled={!selectedCourse || importStatus === "importing"}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {importStatus === "importing" ? "Importing..." : `Import ${previewNotes.length} Sections`}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        {previewNotes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Preview ({previewNotes.length} study note sections found)
              </CardTitle>
              <CardDescription>Review the parsed study notes before importing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {previewNotes.map((note, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-blue-600 mb-2">Title</h4>
                        <p className="text-sm bg-blue-50 p-3 rounded font-medium">
                          {note.title}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-green-600 mb-2">Content</h4>
                        <div className="text-sm bg-green-50 p-3 rounded whitespace-pre-line">
                          {note.content}
                        </div>
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
              Study notes imported successfully! You can now view them in the Content Management section.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}