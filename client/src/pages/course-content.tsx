import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  Play, 
  Clock, 
  Star, 
  CheckCircle, 
  ExternalLink,
  Headphones,
  MessageSquare,
  Bookmark,
  NotebookPen
} from "lucide-react";
import { Link } from "wouter";

interface CourseContent {
  id: string;
  title: string;
  type: string;
  chapter: number;
  section: string;
  content: any;
  quizgeckoUrl?: string;
  duration?: number;
  isActive: boolean;
  sortOrder: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  duration?: number;
  lessons?: number;
  practiceQuestions?: number;
}

export default function CourseContent() {
  const [match, params] = useRoute("/course/:courseId");
  const courseId = params?.courseId;

  if (!courseId) {
    return <div>Course not found</div>;
  }

  const { data: course } = useQuery<Course>({
    queryKey: ["/api/courses", courseId],
  });

  const { data: content, isLoading } = useQuery<CourseContent[]>({
    queryKey: [`/api/courses/${courseId}/content`],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!course || !content) {
    return <div>Course not found</div>;
  }

  // Group content by type
  const contentByType = content.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {} as Record<string, CourseContent[]>);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'lesson': return BookOpen;
      case 'quiz': return Star;
      case 'podcast': return Headphones;
      case 'chat': return MessageSquare;
      case 'flashcards': return Bookmark;
      case 'study-notes': return NotebookPen;
      default: return BookOpen;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'lesson': return 'Introduction';
      case 'quiz': return 'Questions & Answers';
      case 'podcast': return 'Podcast';
      case 'chat': return 'Teach Me/Chat';
      case 'flashcards': return 'Flashcards';
      case 'study-notes': return 'Study Notes';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'lesson': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'quiz': return 'bg-green-100 text-green-800 border-green-200';
      case 'podcast': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'chat': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'flashcards': return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'study-notes': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

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

      {/* Content Sections */}
      <div className="space-y-8">
        {Object.entries(contentByType).map(([type, items]) => {
          const IconComponent = getTypeIcon(type);
          const typeLabel = getTypeLabel(type);
          
          return (
            <Card key={type} className="overflow-hidden">
              <CardHeader className="bg-muted/20">
                <CardTitle className="flex items-center gap-2">
                  <IconComponent className="w-5 h-5" />
                  {typeLabel}
                  <Badge variant="secondary" className="ml-auto">
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {items
                    .sort((a, b) => (a.chapter - b.chapter) || (parseInt(a.section) - parseInt(b.section)))
                    .map((item) => (
                    <div key={item.id} className="p-6 hover:bg-muted/10 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0 mr-4">
                          <h3 className="font-medium text-foreground mb-1" data-testid={`content-title-${item.id}`}>
                            {item.title}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Chapter {item.chapter}</span>
                            <span>•</span>
                            <span>Section {item.section}</span>
                            {item.duration && (
                              <>
                                <span>•</span>
                                <span>{item.duration}h</span>
                              </>
                            )}
                          </div>
                          <Badge className={`mt-2 ${getTypeColor(item.type)}`}>
                            {typeLabel}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {item.quizgeckoUrl && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              asChild
                              data-testid={`study-button-${item.id}`}
                            >
                              <a 
                                href={item.quizgeckoUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-1"
                              >
                                <ExternalLink className="w-3 h-3" />
                                Study
                              </a>
                            </Button>
                          )}
                          <Button 
                            variant="default" 
                            size="sm"
                            disabled={!item.quizgeckoUrl}
                            data-testid={`start-button-${item.id}`}
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Start
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {content.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Content Available</h3>
            <p className="text-muted-foreground">
              Course content is being prepared. Check back soon!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}