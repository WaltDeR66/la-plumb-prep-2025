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
import { Upload, FileText, CheckCircle, AlertCircle, Clock, BookOpen } from "lucide-react";

export default function BulkStudyPlanImport() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCourse, setSelectedCourse] = useState("");
  const [studyPlanText, setStudyPlanText] = useState("");
  const [previewPlans, setPreviewPlans] = useState<any[]>([]);
  const [importStatus, setImportStatus] = useState<"idle" | "parsing" | "previewing" | "importing" | "success">("idle");

  // Fetch courses
  const { data: courses } = useQuery({
    queryKey: ["/api/courses"],
  });

  const bulkImportMutation = useMutation({
    mutationFn: async (data: any) => await apiRequest("POST", "/api/admin/study-plans/bulk-import", data),
    onSuccess: (result: any) => {
      const { imported, duplicatesSkipped, totalSubmitted } = result;
      
      if (duplicatesSkipped > 0) {
        toast({ 
          title: "Import completed with duplicates detected", 
          description: `Added ${imported} new study plans. Skipped ${duplicatesSkipped} duplicates out of ${totalSubmitted} total.`,
          variant: "default"
        });
      } else {
        toast({ 
          title: "All study plans imported successfully!", 
          description: `Added ${imported} new study plans to the course.`
        });
      }
      
      setImportStatus("success");
      setStudyPlanText("");
      setPreviewPlans([]);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/course-content"] });
    },
    onError: (error: any) => {
      toast({
        title: "Import failed",
        description: error.message || "Failed to import study plans",
        variant: "destructive"
      });
      setImportStatus("idle");
    }
  });

  const parseStudyPlans = () => {
    if (!studyPlanText.trim()) {
      toast({
        title: "No content",
        description: "Please enter study plans to parse",
        variant: "destructive"
      });
      return;
    }

    setImportStatus("parsing");

    try {
      const parsed = parseStudyPlansFromText(studyPlanText);
      if (parsed.length === 0) {
        throw new Error("No valid study plans found. Please check the format.");
      }
      
      setPreviewPlans(parsed);
      setImportStatus("previewing");
      toast({
        title: "Study plans parsed successfully!",
        description: `Found ${parsed.length} study plan sessions ready for import.`
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

  const importStudyPlans = () => {
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
      studyPlans: previewPlans
    });
  };

  const parseStudyPlansFromText = (text: string) => {
    const studyPlans: any[] = [];
    
    // Split by time duration headers (10 minutes, 15 minutes, etc.)
    const timeSections = text.split(/(?=\d+\s+minutes?\n)/i);
    
    timeSections.forEach((section, index) => {
      const lines = section.trim().split('\n').filter(line => line.trim());
      if (lines.length < 3) return;
      
      // Extract duration from first line
      const durationMatch = lines[0].match(/(\d+)\s+minutes?/i);
      if (!durationMatch) return;
      
      const duration = parseInt(durationMatch[1]);
      
      // Look for study plan content after the duration
      let planTitle = "";
      let planContent = "";
      let startIndex = 1;
      
      // Find the plan title (usually has "Study Plan" in it)
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].includes("Study Plan") || lines[i].includes("study plan")) {
          planTitle = lines[i].trim();
          startIndex = i + 1;
          break;
        }
      }
      
      // If no specific title found, create one
      if (!planTitle) {
        planTitle = `${duration}-Minute Study Plan`;
        startIndex = 1;
      }
      
      // Collect all content after the title
      planContent = lines.slice(startIndex).join('\n').trim();
      
      if (planTitle.length > 3 && planContent.length > 20) {
        studyPlans.push({
          id: crypto.randomUUID(),
          title: planTitle,
          content: planContent,
          duration: duration,
          type: 'study_plan',
          createdAt: new Date(),
        });
      }
    });
    
    // If no time-based sections found, try parsing by major headings
    if (studyPlans.length === 0) {
      const sections = text.split(/\n(?=[A-Z].*Study Plan)/);
      
      sections.forEach((section, index) => {
        const lines = section.trim().split('\n').filter(line => line.trim());
        if (lines.length < 2) return;
        
        const title = lines[0].trim();
        const content = lines.slice(1).join('\n').trim();
        
        // Try to extract duration from content
        const durationMatch = content.match(/(\d+)[-\s]*minute/i);
        const duration = durationMatch ? parseInt(durationMatch[1]) : 30; // Default 30 minutes
        
        if (title.length > 3 && content.length > 20) {
          studyPlans.push({
            id: crypto.randomUUID(),
            title: title,
            content: content,
            duration: duration,
            type: 'study_plan',
            createdAt: new Date(),
          });
        }
      });
    }
    
    return studyPlans;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Bulk Study Plan Import</h1>
          <p className="text-muted-foreground">
            Import adaptive study plans with time-based sessions and interactive content
          </p>
        </div>

        {/* Course Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Course</CardTitle>
            <CardDescription>Choose which course to add study plans to</CardDescription>
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
              <Clock className="h-5 w-5" />
              Louisiana Plumbing Code Study Plan Format
            </CardTitle>
            <CardDescription>Copy and paste adaptive study plans with time-based sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Your Format: Time-based study sessions with structured content</h4>
                <pre className="bg-muted p-3 rounded text-xs">
{`10 minutes

10-Minute Study Plan: LSPC Administration & Authority

Minutes 0-2: Core Adoption & Naming
Focus on how the Department of Health and Hospitals, Office of Public Health, adopts Part XIV (Plumbing) of the Sanitary Code...

Minutes 2-5: Source of Authority
Identify R.S. 36:258(B) as the first source of authority for the sanitary code...

15 minutes

15-Minute Study Plan: LSPC Administration & Authority

Minutes 0-2: Recap & Core Adoption
Quickly review that the Department of Health and Hospitals, Office of Public Health, adopts Part XIV...`}
                </pre>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Format requirements:</strong> Start with time duration (e.g., "10 minutes"), followed by study plan title and structured content with minute breakdowns.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>

        {/* Study Plan Input */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Paste Your Study Plans</CardTitle>
            <CardDescription>Copy and paste time-based study plans with structured learning sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="studyplans">Study Plans Content</Label>
                <Textarea
                  id="studyplans"
                  value={studyPlanText}
                  onChange={(e) => setStudyPlanText(e.target.value)}
                  rows={15}
                  placeholder={`Paste your study plans here...

Example:
10 minutes

10-Minute Study Plan: LSPC Administration & Authority

Minutes 0-2: Core Adoption & Naming
Focus on how the Department of Health and Hospitals, Office of Public Health, adopts Part XIV (Plumbing) of the Sanitary Code, State of Louisiana (LAC 51:XIV).
Understand that this is also known as the "Louisiana State Plumbing Code" (LSPC) and that these terms are interchangeable.

Minutes 2-5: Source of Authority
Identify R.S. 36:258(B) as the first source of authority for the sanitary code.
Note that more specific provisions are found in Chapters 1 and 4 of Title 40 of the Louisiana Revised Statutes.

15 minutes

15-Minute Study Plan: LSPC Administration & Authority

Minutes 0-2: Recap & Core Adoption
Quickly review that the Department of Health and Hospitals, Office of Public Health, adopts Part XIV...`}
                  className="font-mono text-sm"
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={parseStudyPlans}
                  disabled={!studyPlanText.trim() || importStatus === "parsing"}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  {importStatus === "parsing" ? "Parsing..." : "Parse Study Plans"}
                </Button>
                
                {previewPlans.length > 0 && (
                  <Button 
                    onClick={importStudyPlans}
                    disabled={!selectedCourse || importStatus === "importing"}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {importStatus === "importing" ? "Importing..." : `Import ${previewPlans.length} Study Plans`}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        {previewPlans.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Preview ({previewPlans.length} study plans found)
              </CardTitle>
              <CardDescription>Review the parsed study plans before importing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {previewPlans.map((plan, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-blue-600 mb-1">Study Plan Title</h4>
                          <p className="text-sm bg-blue-50 p-2 rounded font-medium">
                            {plan.title}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground bg-gray-100 px-2 py-1 rounded">
                          <Clock className="h-3 w-3" />
                          {plan.duration} min
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-green-600 mb-2">Content Preview</h4>
                        <div className="text-sm bg-green-50 p-3 rounded whitespace-pre-line max-h-32 overflow-y-auto">
                          {plan.content.substring(0, 500)}{plan.content.length > 500 ? "..." : ""}
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
              Study plans imported successfully! You can now view them in the Content Management section.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}