import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BookOpen, 
  Play, 
  Clock, 
  ExternalLink,
  Headphones,
  MessageSquare,
  Bookmark,
  NotebookPen,
  HelpCircle,
  ChevronRight,
  ArrowLeft,
  Lock
} from "lucide-react";

// Map friendly course identifiers to database UUIDs
function getCourseUUID(courseSlug: string): string {
  const courseMapping: { [key: string]: string } = {
    'journeyman-prep': '5f02238b-afb2-4e7f-a488-96fb471fee56',
    'backflow-prevention': 'b1f02238b-afb2-4e7f-a488-96fb471fee57',
    'natural-gas': 'c2f02238b-afb2-4e7f-a488-96fb471fee58',
    'medical-gas': 'd3f02238b-afb2-4e7f-a488-96fb471fee59',
    'master-plumber': 'e4f02238b-afb2-4e7f-a488-96fb471fee60'
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
  quizgeckoUrl?: string;
  duration?: number;
  isActive: boolean;
  sortOrder: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
}

export default function Lesson() {
  const [match, params] = useRoute("/course/:courseId/lesson/:section");
  const courseId = params?.courseId;
  const section = params?.section;

  if (!courseId || !section) {
    return <div>Lesson not found</div>;
  }

  // Resolve friendly course ID to UUID for API calls
  const resolvedCourseId = getCourseUUID(courseId);

  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });
  
  const course = courses?.find(c => c.id === resolvedCourseId);

  const { data: allContent, isLoading } = useQuery<CourseContent[]>({
    queryKey: [`/api/courses/${resolvedCourseId}/content`],
  });

  const { data: sectionProgress } = useQuery<Array<{section: number, isUnlocked: boolean, isAdmin: boolean}>>({
    queryKey: [`/api/section-progress/${resolvedCourseId}`],
    enabled: !!resolvedCourseId,
  });

  // Fetch study plans for this course
  const { data: studyPlans } = useQuery<Array<{id: string, title: string, content: string, duration: number}>>({
    queryKey: [`/api/courses/${resolvedCourseId}/study-plans`],
    enabled: !!resolvedCourseId,
  });

  // Filter content for this specific section and sort by the desired order
  const sectionContent = allContent?.filter(item => {
    const itemSection = item.section?.toString();
    const urlSection = section?.toString();
    return itemSection === urlSection;
  });
  
  // Define the correct content order
  const contentOrder = ['lesson', 'podcast', 'chat', 'flashcards', 'study-notes', 'quiz'];
  
  // Sort content by the defined order
  const sortedContent = sectionContent?.sort((a, b) => {
    const aIndex = contentOrder.indexOf(a.type);
    const bIndex = contentOrder.indexOf(b.type);
    return aIndex - bIndex;
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!course || !sortedContent || sortedContent.length === 0) {
    return <div>Lesson not found</div>;
  }

  // Check if this section is unlocked
  const sectionNum = Number(section);
  const sectionStatus = sectionProgress?.find(s => s.section === sectionNum);
  const isUnlocked = sectionStatus?.isUnlocked ?? false;
  const isAdmin = sectionStatus?.isAdmin ?? false;

  // For demo purposes, don't show locked message for admin users
  if (!isUnlocked && !isAdmin && sectionProgress) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md mx-auto">
            <Lock className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-800 mb-2">Section Locked</h2>
            <p className="text-red-600 mb-4">
              You need to complete the previous section's quiz with {sortedContent[0]?.title?.toLowerCase().includes('chapter review') ? '80%' : '70%'} or higher to unlock this section.
            </p>
            <Button asChild variant="outline">
              <Link href={`/course/${courseId}`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Course
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'lesson': return BookOpen;
      case 'quiz': return HelpCircle;
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
      case 'quiz': return 'Quiz';
      case 'podcast': return 'Podcast';
      case 'chat': return 'Teach Me Chat';
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

  // Calculate lesson progress (placeholder)
  const progress = 45;
  const completed = Math.floor(sortedContent.length * (progress / 100));

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Navigation */}
      <div className="mb-6">
        <Button variant="ghost" asChild data-testid="button-back-course">
          <Link href={`/course/${courseId}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Course
          </Link>
        </Button>
      </div>

      {/* Lesson Header */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <Badge className="mb-2" data-testid={`lesson-section-${section}`}>
              Section {section}
            </Badge>
            <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="lesson-title">
              Louisiana State Plumbing Code §{section}
            </h1>
            <p className="text-muted-foreground" data-testid="lesson-description">
              {sortedContent[0]?.title.split(' - ')[0] || `Section ${section} Content`}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary" data-testid="lesson-progress">
              {progress}%
            </div>
            <div className="text-sm text-muted-foreground">
              {completed} of {sortedContent.length} completed
            </div>
          </div>
        </div>
        
        <Progress value={progress} className="h-2" data-testid="lesson-progress-bar" />
      </div>

      {/* Tabbed Interface with Study Plans */}
      <Tabs defaultValue="lesson-flow" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="lesson-flow" className="flex items-center gap-2" data-testid="tab-lesson-flow">
            <BookOpen className="h-4 w-4" />
            Lesson Content
          </TabsTrigger>
          <TabsTrigger value="study-plans" className="flex items-center gap-2" data-testid="tab-study-plans">
            <Clock className="h-4 w-4" />
            Timed Study Plans
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lesson-flow" className="space-y-4">
          <h2 className="text-xl font-semibold mb-4" data-testid="lesson-content-header">
            Lesson Flow
          </h2>
          
          {sortedContent?.map((item, index) => {
            const IconComponent = getTypeIcon(item.type);
            const isCompleted = index < completed;
            const isCurrent = index === completed;
          
          return (
            <Card 
              key={item.id} 
              className={`transition-all ${isCurrent ? 'ring-2 ring-primary' : ''} ${isCompleted ? 'bg-green-50 border-green-200' : ''}`}
              data-testid={`content-card-${item.type}-${index}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Step Number */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      isCompleted 
                        ? 'bg-green-100 text-green-800 border-2 border-green-300' 
                        : isCurrent 
                          ? 'bg-primary text-primary-foreground border-2 border-primary' 
                          : 'bg-gray-100 text-gray-600 border-2 border-gray-200'
                    }`} data-testid={`step-number-${index + 1}`}>
                      {isCompleted ? '✓' : index + 1}
                    </div>
                    
                    {/* Content Info */}
                    <div>
                      <div className="flex items-center space-x-2">
                        <IconComponent className="w-5 h-5 text-muted-foreground" />
                        <Badge variant="outline" className={getTypeColor(item.type)} data-testid={`content-type-${item.type}`}>
                          {getTypeLabel(item.type)}
                        </Badge>
                      </div>
                      <h3 className="font-medium text-foreground mt-1" data-testid={`content-title-${index}`}>
                        {getTypeLabel(item.type)}
                      </h3>
                      {item.duration && (
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground mt-1">
                          <Clock className="w-3 h-3" />
                          <span>{item.duration}h</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Action Button */}
                  <div className="flex items-center space-x-2">
                    {isCompleted && (
                      <Badge className="bg-green-100 text-green-800" data-testid={`completed-badge-${index}`}>
                        Completed
                      </Badge>
                    )}
                    
                    <Button 
                      variant={isCurrent ? "default" : isCompleted ? "outline" : "ghost"}
                      disabled={!isCurrent && !isCompleted && index > completed}
                      asChild
                      data-testid={`button-study-${item.type}-${index}`}
                    >
                      <Link href={`/course/${courseId}/${item.type === 'podcast' ? 'podcast' : 'content'}/${item.id}${item.type === 'podcast' && isCompleted ? '?autostart=true' : ''}`}>
                        <Play className="w-4 h-4 mr-2" />
                        {isCompleted ? "Review" : isCurrent ? "Continue" : "Start"}
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="study-plans" className="space-y-4">
          <div className="text-center py-8">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Timed Study Sessions</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Choose your study duration and start a structured, timed learning session.
              </p>
              <div className="space-y-4">
                <Select onValueChange={(duration) => window.location.href = `/study-plans/${courseId}/${duration}/0`}>
                  <SelectTrigger className="w-full" data-testid="study-plan-duration-select">
                    <SelectValue placeholder="Select study duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15" data-testid="option-15-min">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        15 Minutes - Quick Review
                      </div>
                    </SelectItem>
                    <SelectItem value="30" data-testid="option-30-min">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        30 Minutes - Comprehensive Study
                      </div>
                    </SelectItem>
                    <SelectItem value="60" data-testid="option-60-min">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        1 Hour - Deep Dive Learning
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Structured content with timed sections and automatic progression
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Navigation */}
      <div className="flex justify-between mt-8 pt-6 border-t">
        <Button variant="outline" asChild data-testid="button-previous-lesson">
          <Link href={`/course/${courseId}`}>
            ← All Lessons
          </Link>
        </Button>
        
        <Button asChild data-testid="button-next-lesson">
          <Link href={`/course/${courseId}`}>
            Next Lesson →
          </Link>
        </Button>
      </div>
    </div>
  );
}