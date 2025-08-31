import { useEffect } from "react";
import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  Clock,
  Star,
  Play,
  Lock,
  Headphones,
  MessageSquare,
  Bookmark,
  NotebookPen,
} from "lucide-react";
import type { Course, CourseContent } from "@shared/schema";

export default function CourseContentPage() {
  const { courseId } = useParams<{ courseId: string }>();

  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const { data: content = [], isLoading, error } = useQuery<CourseContent[]>({
    queryKey: [`/api/courses/${courseId}/content`],
    enabled: !!courseId,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const course = courses?.find(c => c.id === courseId);

  if (isLoading || !course) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1>Loading course content...</h1>
      </div>
    );
  }

  // Group content by section
  const contentBySection = content.reduce((acc, item) => {
    const sectionKey = item.section?.toString() || '101';
    if (!acc[sectionKey]) acc[sectionKey] = [];
    acc[sectionKey].push(item);
    return acc;
  }, {} as Record<string, CourseContent[]>);
  
  const sections = Object.keys(contentBySection).sort((a, b) => Number(a) - Number(b));

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Course Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Link href="/dashboard" className="text-primary hover:underline">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-muted-foreground">Course Content</span>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h1 className="text-3xl font-bold text-foreground mb-4" data-testid="course-title">
            {course.title}
          </h1>
          <p className="text-muted-foreground mb-6">{course.description}</p>
          
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            {course.duration && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{course.duration} hours</span>
              </div>
            )}
            {course.lessons && (
              <div className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                <span>{course.lessons} lessons</span>
              </div>
            )}
            {course.practiceQuestions && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4" />
                <span>{course.practiceQuestions} quizzes</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold mb-4" data-testid="lessons-header">
          Course Lessons
        </h2>
        

        {sections.map((section) => {
          const sectionItems = contentBySection[section];
          const contentCount = sectionItems.length;
          
          return (
            <Card key={section} className="hover:shadow-md transition-shadow" data-testid={`lesson-card-${section}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge className="bg-primary/10 text-primary" data-testid={`lesson-section-${section}`}>
                        Section {section}
                      </Badge>
                      <Badge variant="outline" data-testid={`lesson-content-count-${section}`}>
                        {contentCount} parts
                      </Badge>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-1" data-testid={`lesson-title-${section}`}>
                      Louisiana State Plumbing Code §{section}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3" data-testid={`lesson-description-${section}`}>
                      {section === '101' ? 'Administration and General Requirements' : 
                       section === '103' ? 'Definitions and Code Structure' :
                       section === '105' ? 'Permits and Compliance Procedures' : 
                       `Section ${section} Materials`}
                    </p>
                    
                    {/* Content Types Available */}
                    <div className="flex items-center space-x-3 text-xs text-muted-foreground flex-wrap mb-3">
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3" />
                        <span>Quiz Questions</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <NotebookPen className="w-3 h-3" />
                        <span>Study Notes</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Bookmark className="w-3 h-3" />
                        <span>Flashcards</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Headphones className="w-3 h-3" />
                        <span>Audio Content</span>
                      </div>
                    </div>

                    {/* Content Items List */}
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-600">Available Materials:</p>
                      {sectionItems.slice(0, 3).map((item, index) => (
                        <div key={item.id} className="text-xs text-gray-500">
                          • {item.title}
                        </div>
                      ))}
                      {sectionItems.length > 3 && (
                        <div className="text-xs text-gray-400">
                          + {sectionItems.length - 3} more items...
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    <Button 
                      asChild
                      data-testid={`button-start-lesson-${section}`}
                    >
                      <Link href={`/course/${course.id}/lesson/${section}`}>
                        <Play className="w-4 h-4 mr-2" />
                        Start
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}