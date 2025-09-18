import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, HelpCircle } from "lucide-react";
import InteractiveQuiz from "@/components/interactive-quiz";

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

export default function LessonQuiz() {
  const [match, params] = useRoute("/course/:courseId/lesson/:section/quiz");
  const courseId = params?.courseId;
  const section = params?.section;

  if (!courseId || !section) {
    return <div>Lesson not found</div>;
  }

  // Resolve friendly course ID to UUID for API calls
  const resolvedCourseId = getCourseUUID(courseId);

  // Fetch course content to get the quiz content ID
  const { data: content, isLoading: isContentLoading } = useQuery({
    queryKey: [`/api/courses/${resolvedCourseId}/content`],
    enabled: !!resolvedCourseId,
  });

  // Find quiz content for this section
  const quizContent = Array.isArray(content) ? content.find((item: CourseContent) => 
    String(item.section) === section && 
    (item.type === 'quiz' || item.title?.toLowerCase().includes('quiz'))
  ) : undefined;

  // Loading state
  if (isContentLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 dark:from-gray-900 dark:to-gray-800 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading quiz...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <Link to={`/course/${courseId}/lesson/${section}`}>
            <Button variant="outline" className="gap-2" data-testid="button-back-lesson">
              <ArrowLeft className="h-4 w-4" />
              Back to Lesson Flow
            </Button>
          </Link>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <HelpCircle className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Section {section} Quiz
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Step 6 of 6 • Test your knowledge of this section
          </p>
        </div>

        {/* Use InteractiveQuiz component which properly handles questions from the API */}
        <InteractiveQuiz
          section={section}
          contentId={quizContent?.id || `section-${section}-quiz`}
          title={`Section ${section} Quiz`}
          onComplete={() => {
            // Navigate back to lesson flow after completion
            window.location.href = `/course/${courseId}/lesson/${section}`;
          }}
        />
      </div>
    </div>
  );
}