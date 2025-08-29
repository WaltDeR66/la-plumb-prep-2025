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
  NotebookPen,
  Lock
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

  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });
  
  const course = courses?.find(c => c.id === courseId);

  const { data: content, isLoading } = useQuery<CourseContent[]>({
    queryKey: [`/api/courses/${courseId}/content`],
  });

  const { data: sectionProgress } = useQuery<Array<{section: number, isUnlocked: boolean, isAdmin: boolean}>>({
    queryKey: [`/api/section-progress/${courseId}`],
    enabled: !!courseId,
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

  // Group content by section
  const contentBySection = content.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, CourseContent[]>);
  
  // Get unique sections sorted
  const sections = Object.keys(contentBySection).sort((a, b) => Number(a) - Number(b));

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

      {/* Course Lessons by Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold mb-4" data-testid="lessons-header">
          Course Lessons
        </h2>
        
        {sections.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Lessons Available</h3>
              <p className="text-muted-foreground">
                This course doesn't have any lessons yet. Check back later!
              </p>
            </CardContent>
          </Card>
        ) : (
          sections.map((section) => {
            const sectionItems = contentBySection[section];
            const sectionTitle = sectionItems[0]?.title.split(' - ')[0] || `Section ${section}`;
            
            // Calculate lesson progress (placeholder for now)
            const progress = 0;
            const contentCount = sectionItems.length;
            
            // Check if this section is unlocked
            const sectionNum = Number(section);
            const sectionStatus = sectionProgress?.find(s => s.section === sectionNum);
            const isUnlocked = sectionStatus?.isUnlocked ?? false;
            const isAdmin = sectionStatus?.isAdmin ?? false;
            
            return (
              <Card key={section} className={`hover:shadow-md transition-shadow ${!isUnlocked ? 'opacity-60' : ''}`} data-testid={`lesson-card-${section}`}>
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
                        {!isUnlocked && (
                          <Badge variant="secondary" className="bg-red-100 text-red-800">
                            <Lock className="w-3 h-3 mr-1" />
                            Locked
                          </Badge>
                        )}
                        {isAdmin && (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            Admin Access
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-1" data-testid={`lesson-title-${section}`}>
                        Louisiana State Plumbing Code §{section}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3" data-testid={`lesson-description-${section}`}>
                        {sectionTitle}
                      </p>
                      
                      {/* Progress bar for enrolled users */}
                      {progress > 0 && (
                        <div className="space-y-1 mb-3">
                          <div className="flex justify-between text-xs">
                            <span>Progress</span>
                            <span>{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-1.5" data-testid={`lesson-progress-${section}`} />
                        </div>
                      )}
                      
                      {/* Content overview */}
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <BookOpen className="w-3 h-3" />
                          <span>Introduction</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Headphones className="w-3 h-3" />
                          <span>Podcast</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageSquare className="w-3 h-3" />
                          <span>Chat</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3" />
                          <span>Quiz</span>
                        </div>
                      </div>
                      
                      {!isUnlocked && !isAdmin && (
                        <p className="text-xs text-red-600 mt-2">
                          🔒 Complete the previous section's quiz with {sectionTitle.toLowerCase().includes('chapter review') ? '80%' : '70%'}+ to unlock
                        </p>
                      )}
                    </div>
                    
                    <div className="ml-4">
                      {isUnlocked ? (
                        <Button 
                          asChild
                          data-testid={`button-start-lesson-${section}`}
                        >
                          <Link href={`/course/${course.id}/lesson/${section}`}>
                            <Play className="w-4 h-4 mr-2" />
                            {progress > 0 ? "Continue" : "Start"}
                          </Link>
                        </Button>
                      ) : (
                        <Button 
                          disabled
                          variant="secondary"
                          className="opacity-50"
                          data-testid={`button-locked-lesson-${section}`}
                        >
                          <Lock className="w-4 h-4 mr-2" />
                          Locked
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
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