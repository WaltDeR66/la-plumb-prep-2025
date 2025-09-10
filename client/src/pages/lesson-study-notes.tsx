import { useQuery } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ChevronRight, NotebookPen, Download, Bookmark } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Map friendly course identifiers to database UUIDs
function getCourseUUID(courseSlug: string): string {
  const courseMapping: { [key: string]: string } = {
    'journeyman-prep': 'b83c6ebe-f5bd-4787-8fd5-e3b177d9e79b',
    'backflow-prevention': 'b06e5cc6-3cec-4fe6-81ae-5f7cf5ade62e',
    'natural-gas': 'ce9dfb3e-f6ef-40ed-b578-25bff53eb2dc',
    'medical-gas': '547ca2fb-e3b3-46c7-a3ef-9e082401b510',
    'master-plumber': '2b8778aa-c3ec-43cd-887a-77ca0824a294'
  };
  return courseMapping[courseSlug] || courseSlug;
}

interface CourseContent {
  id: string;
  title: string;
  type: string;
  chapter: number;
  section: string;
  content: any;
  duration?: number;
  isActive: boolean;
  sortOrder: number;
}

export default function LessonStudyNotes() {
  const [match, params] = useRoute("/lesson-study-notes/:courseId/:section");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const courseId = params?.courseId;
  const section = params?.section;

  if (!courseId || !section) {
    return <div>Lesson not found</div>;
  }

  // Resolve friendly course ID to UUID for API calls
  const resolvedCourseId = getCourseUUID(courseId);

  // Fetch course content for this section
  const { data: content, isLoading: isContentLoading } = useQuery({
    queryKey: [`/api/courses/${resolvedCourseId}/content`],
    enabled: !!resolvedCourseId,
  });

  // Find study notes content for this section
  const studyNotesContent = Array.isArray(content) ? content.find((item: CourseContent) => 
    item.section === parseInt(section) && 
    (item.type === 'study-notes' || item.title?.toLowerCase().includes('study notes'))
  ) : undefined;

  // Track lesson step progress
  const trackProgress = async (completed = false) => {
    try {
      await apiRequest("POST", "/api/lesson-progress/track", {
        courseId: resolvedCourseId,
        section: parseInt(section),
        stepType: "study_notes",
        stepIndex: 4,
        isCompleted: completed
      });
    } catch (error) {
      console.error("Failed to track progress:", error);
    }
  };

  const handleContinue = () => {
    trackProgress(true);
    navigate(`/lesson-quiz/${courseId}/${section}`);
  };

  const handleDownloadNotes = () => {
    // Implementation for downloading study notes as PDF
    toast({
      title: "Download Started",
      description: "Your study notes are being prepared for download.",
    });
  };

  if (isContentLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href={`/course/${courseId}/lesson/${section}`}>
            <Button variant="ghost" size="sm" data-testid="button-back-lesson-flow">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Lesson Flow
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <NotebookPen className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold">Section {section} Study Notes</h1>
            <Badge variant="secondary">Step 5 of 6</Badge>
          </div>
        </div>

        {/* Content */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <NotebookPen className="h-5 w-5 text-yellow-600" />
                </div>
                {studyNotesContent?.title || `Section ${section} Study Notes`}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadNotes}
                  data-testid="button-download-notes"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  data-testid="button-bookmark-notes"
                >
                  <Bookmark className="h-4 w-4 mr-2" />
                  Bookmark
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {studyNotesContent?.content?.notes || studyNotesContent?.content?.text ? (
              <div className="space-y-6">
                {/* Key Points Summary */}
                <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-r-lg">
                  <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <Bookmark className="h-4 w-4" />
                    Key Points Summary
                  </h3>
                  <div className="text-blue-800 space-y-2">
                    {studyNotesContent.content.keyPoints?.map((point: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="font-bold text-blue-600">•</span>
                        <span>{point}</span>
                      </div>
                    )) || (
                      <p>Key points for Section {section} are being prepared.</p>
                    )}
                  </div>
                </div>

                {/* Detailed Notes */}
                <div className="prose max-w-none text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-em:text-foreground prose-blockquote:text-muted-foreground prose-code:text-foreground">
                  <div 
                    className="prose max-w-none text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-em:text-foreground prose-blockquote:text-muted-foreground prose-code:text-foreground"
                    dangerouslySetInnerHTML={{ __html: studyNotesContent.content.notes || studyNotesContent.content.text || 'Study notes are being prepared.' }}
                  />
                </div>

                {/* Code References */}
                {studyNotesContent.content.codeReferences && (
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">Code References</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {studyNotesContent.content.codeReferences.map((ref: any, index: number) => (
                        <div key={index} className="bg-white p-3 rounded border">
                          <div className="font-medium text-sm text-gray-600">{ref.section}</div>
                          <div className="text-gray-800">{ref.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Study Tips */}
                <div className="bg-green-50 border-l-4 border-green-400 p-6 rounded-r-lg">
                  <h3 className="font-semibold text-green-900 mb-3">Study Tips</h3>
                  <div className="text-green-800 space-y-2">
                    <p>• Review these notes before taking the section quiz</p>
                    <p>• Focus on understanding concepts rather than memorizing</p>
                    <p>• Use the AI mentor chat if you need clarification on any topic</p>
                    <p>• Practice with flashcards to reinforce key terms and definitions</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <NotebookPen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Study notes for Section {section} are being prepared.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Link href={`/course/${courseId}/lesson/${section}`}>
            <Button variant="outline" data-testid="button-back-lesson-flow-bottom">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Lesson Flow
            </Button>
          </Link>
          
          <Button onClick={handleContinue} data-testid="button-continue-quiz">
            Continue to Quiz
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}