import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import ContentViewer from "@/components/content-viewer";
import { useQuery } from "@tanstack/react-query";

interface Course {
  id: string;
  title: string;
  description: string;
}

interface ContentData {
  id: string;
  title: string;
  type: string;
  section?: number;
  content?: any;
}

export default function ContentView() {
  const [match, params] = useRoute("/course/:courseId/content/:contentId");
  const courseId = params?.courseId;
  const contentId = params?.contentId;

  // Debug logging
  console.log('ContentView params:', { match, params, courseId, contentId });

  if (!courseId || !contentId) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Content not found</h1>
            <p className="text-gray-600 mb-4">
              Debug: courseId={courseId}, contentId={contentId}, match={String(match)}
            </p>
            <Button asChild data-testid="button-back-courses">
              <Link href="/courses">Back to Courses</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });
  
  const course = courses?.find(c => c.id === courseId);

  const { data: content } = useQuery<ContentData>({
    queryKey: [`/api/content/${contentId}/display`],
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Back Navigation */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" asChild data-testid="button-back-lesson">
            <Link href={`/course/${courseId}/lesson/${content?.section?.toString() || ''}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Lesson
            </Link>
          </Button>
        </div>
      </div>

      {/* Content Viewer */}
      <div className="container mx-auto px-4 py-8">
        {contentId ? (
          <ContentViewer
            contentId={contentId}
            contentType={content?.type || 'lesson'}
            title={content?.title || ''}
            courseId={courseId || ''}
            sectionId={content?.section?.toString() || ''}
            onComplete={() => {
              console.log('Content completed');
            }}
          />
        ) : (
          <div className="text-center py-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}