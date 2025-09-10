import { useRoute, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ChevronRight, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import AIMentorChat from "@/components/ai-mentor-chat";

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

export default function LessonAIChat() {
  const [match, params] = useRoute("/course/:courseId/lesson/:section/ai-chat");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const courseId = params?.courseId;
  const section = params?.section;

  if (!courseId || !section) {
    return <div>Lesson not found</div>;
  }

  // Resolve friendly course ID to UUID for API calls
  const resolvedCourseId = getCourseUUID(courseId);

  // Track lesson step progress
  const trackProgress = async (completed = false) => {
    try {
      await apiRequest("POST", "/api/lesson-progress/track", {
        courseId: resolvedCourseId,
        section: parseInt(section),
        stepType: "ai_chat",
        stepIndex: 3,
        isCompleted: completed
      });
    } catch (error) {
      console.error("Failed to track progress:", error);
    }
  };

  const handleContinue = () => {
    trackProgress(true);
    navigate(`/lesson-study-notes/${courseId}/${section}`);
  };

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
            <MessageSquare className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold">Section {section} AI Mentor Chat</h1>
            <Badge variant="secondary">Step 4 of 6</Badge>
          </div>
        </div>

        {/* AI Chat Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-orange-600" />
              </div>
              AI Mentor Chat
            </CardTitle>
            <p className="text-muted-foreground">
              Get instant help with Louisiana plumbing code questions for Section {section}
            </p>
          </CardHeader>
          <CardContent>
            <AIMentorChat currentSection={section} />
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
          
          <Button onClick={handleContinue} data-testid="button-continue-study-notes">
            Continue to Study Notes
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}