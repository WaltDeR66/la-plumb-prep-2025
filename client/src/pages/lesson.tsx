import { useQuery } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import AIMentorChat from "@/components/ai-mentor-chat";
import { AuthService } from "@/lib/auth";
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
  Lock,
  Brain,
  Plus
} from "lucide-react";

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

// Component for Continue Where You Left Off button
function ContinueWhereLeftOffButton({ courseId, section, navigate }: { 
  courseId: string; 
  section: string; 
  navigate: (path: string) => void; 
}) {
  const { data: currentStep, isLoading } = useQuery<{stepType?: string}>({
    queryKey: [`/api/lesson-progress/${courseId}/${section}/current`],
    enabled: !!courseId && !!section,
  });

  // Map step types to their proper routes
  const getStepRoute = (stepType: string): string => {
    switch (stepType) {
      case 'introduction':
        return `/course/${courseId}/lesson/${section}/introduction`;
      case 'podcast':
        return `/course/${courseId}/lesson/${section}/podcast`;
      case 'flashcards':
        return `/course/${courseId}/lesson/${section}/flashcards`;
      case 'ai-chat':
        return `/course/${courseId}/lesson/${section}/ai-chat`;
      case 'study-notes':
        return `/course/${courseId}/lesson/${section}/study-notes`;
      case 'quiz':
        return `/course/${courseId}/lesson/${section}/quiz`;
      default:
        return `/course/${courseId}/lesson/${section}/introduction`;
    }
  };

  const handleContinue = () => {
    if (currentStep?.stepType) {
      const route = getStepRoute(currentStep.stepType);
      navigate(route);
    } else {
      // Default to introduction if no progress found
      navigate(`/course/${courseId}/lesson/${section}/introduction`);
    }
  };

  if (isLoading) {
    return (
      <Button variant="outline" disabled data-testid="continue-where-left-off-loading">
        <Clock className="w-4 h-4 mr-2 animate-spin" />
        Loading...
      </Button>
    );
  }

  return (
    <Button 
      onClick={handleContinue} 
      className="flex items-center gap-2"
      data-testid="continue-where-left-off-button"
    >
      <Play className="w-4 h-4" />
      {currentStep?.stepType ? `Continue ${currentStep.stepType}` : 'Start Lesson'}
    </Button>
  );
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
  const [, navigate] = useLocation();
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

  // Check user authentication and subscription access
  const { data: currentUser } = useQuery<any>({
    queryKey: ["/api/auth/me"],
  });


  // Helper functions to handle study plan filtering
  const normalizeType = (type: string) => type?.toLowerCase().replace(/_/g, '-').trim();
  const isStudyPlanType = (item: CourseContent) => {
    const normalizedType = normalizeType(item.type);
    return /^study[- ]?plans?($|-[0-9]+$)/i.test(normalizedType) || 
           /study\s*plan/i.test(item.title || '');
  };

  // Filter content for this specific section and remove all study plan variants
  const sectionContent = allContent?.filter(item => {
    const itemSection = item.section?.toString();
    const urlSection = section?.toString();
    return itemSection === urlSection && !isStudyPlanType(item);
  });
  
  // Define the correct lesson flow order based on user requirements  
  // AI intro → Podcast → Flashcards → AI chat → Study notes → Quiz (20 questions, 70% pass)
  const contentOrder = ['lesson', 'podcast', 'flashcards', 'chat', 'study-notes', 'quiz'];
  
  // Remove duplicates by type - keep only the first occurrence of each type
  const uniqueContent = sectionContent?.reduce((acc: CourseContent[], current) => {
    const normalizedType = normalizeType(current.type);
    const existingType = acc.find(item => normalizeType(item.type) === normalizedType);
    if (!existingType) {
      acc.push(current);
    }
    return acc;
  }, []);

  // Filter out AI Study Assistant (chat) if user doesn't have proper subscription
  const hasAIMentorAccess = AuthService.hasFeatureAccess(currentUser, 'ai_mentor');
  const accessibleContent = uniqueContent?.filter(item => {
    // Hide AI Study Assistant if user doesn't have Professional or Master subscription
    if (normalizeType(item.type) === 'chat' && !hasAIMentorAccess) {
      return false;
    }
    return true;
  });
  
  // Sort content by the defined order
  const sortedContent = accessibleContent?.sort((a, b) => {
    const aIndex = contentOrder.indexOf(normalizeType(a.type));
    const bIndex = contentOrder.indexOf(normalizeType(b.type));
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
      case 'study-plan': return Clock;
      default: return BookOpen;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'lesson': return 'AI Introduction';
      case 'quiz': return 'Section Quiz (20 Questions)';
      case 'podcast': return 'Audio Lesson';
      case 'chat': return 'AI Study Assistant';
      case 'flashcards': return 'Flashcard Review';
      case 'study-notes': return 'Study Notes';
      case 'study-plan': return 'Choose Study Plan (Optional)';
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
      case 'study-plan': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeDescription = (type: string) => {
    switch (type) {
      case 'lesson': return 'AI-generated introduction to key concepts and regulations';
      case 'quiz': return '20 questions, no time limit, 70% required to pass. Wrong answers reviewed with AI';
      case 'podcast': return 'Audio lesson covering practical applications and examples';
      case 'chat': return 'Interactive AI assistant for questions and clarifications';
      case 'flashcards': return 'Quick review of key terms and concepts';
      case 'study-notes': return 'Comprehensive notes and reference materials';
      case 'study-plan': return 'Optional: Generate a timed study plan or proceed with lesson flow';
      default: return '';
    }
  };

  // Remove progress tracking - user doesn't want completion status
  // const progress = 45;
  // const completed = Math.floor(sortedContent.length * (progress / 100));

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
            <div className="text-lg font-medium text-primary">
              Section {section}
            </div>
            <div className="text-sm text-muted-foreground">
              {sortedContent.length} learning activities
            </div>
          </div>
        </div>
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold" data-testid="lesson-content-header">
              Lesson Flow
            </h2>
            <ContinueWhereLeftOffButton 
              courseId={resolvedCourseId} 
              section={section} 
              navigate={navigate}
            />
          </div>
          
          {sortedContent?.map((item, index) => {
            const IconComponent = getTypeIcon(item.type);
            // Remove completion tracking - user doesn't want this
            // const isCompleted = index < completed;
            // const isCurrent = index === completed;

            // Regular handling for other content types
            return (
              <Card 
                key={item.id} 
                className="transition-all hover:shadow-md"
                data-testid={`content-card-${item.type}-${index}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Step Number */}
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold bg-primary text-primary-foreground border-2 border-primary" data-testid={`step-number-${index + 1}`}>
                        {index + 1}
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
                        <p className="text-sm text-muted-foreground mt-1">
                          {getTypeDescription(item.type)}
                        </p>
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
                      {item.type === 'chat' ? (
                        hasAIMentorAccess ? (
                          <Button 
                            variant="default"
                            onClick={() => {
                              setTimeout(() => {
                                const chatElement = document.querySelector('[data-testid="ai-mentor-chat"]');
                                if (chatElement) {
                                  chatElement.scrollIntoView({ behavior: 'smooth' });
                                }
                              }, 100);
                            }}
                            data-testid={`button-study-${item.type}-${index}`}
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Start Chat
                          </Button>
                        ) : (
                          <Button 
                            variant="outline"
                            asChild
                            data-testid={`button-upgrade-${item.type}-${index}`}
                          >
                            <Link href="/pricing">
                              <Lock className="w-4 h-4 mr-2" />
                              Upgrade to Pro
                            </Link>
                          </Button>
                        )
                      ) : (
                        <Button 
                          variant="default"
                          asChild
                          data-testid={`button-study-${item.type}-${index}`}
                        >
                          <Link href={`/course/${courseId}/${item.type === 'podcast' ? 'podcast' : 'content'}/${item.id}`}>
                            <Play className="w-4 h-4 mr-2" />
                            Start
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="study-plans" className="space-y-6">
          {/* AI Study Plan Generation */}
          <StudentAIStudyPlanGenerator 
            courseId={resolvedCourseId} 
            sectionNumber={section} 
          />
        </TabsContent>
      </Tabs>

      {/* AI Mentor Chat Section */}
      <div className="mt-12 pt-8 border-t" data-testid="ai-mentor-chat">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">AI Mentor Chat</h2>
            <p className="text-muted-foreground">Get instant help with Louisiana plumbing code questions</p>
          </div>
        </div>
        <AIMentorChat currentSection={section} />
      </div>

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

function StudentAIStudyPlanGenerator({ 
  courseId, 
  sectionNumber 
}: { 
  courseId: string; 
  sectionNumber: string; 
}) {
  const { toast } = useToast();
  const [duration, setDuration] = useState("45");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);
  const [showPlan, setShowPlan] = useState(false);

  const generateStudyPlan = async () => {
    if (!courseId || !sectionNumber) {
      toast({
        title: "Missing information",
        description: "Unable to generate study plan for this section",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedPlan(null);

    try {
      const response = await apiRequest("POST", `/api/generate-study-plan/${sectionNumber}`, {
        courseId,
        duration: parseInt(duration)
      });

      setGeneratedPlan(response);
      setShowPlan(true);
      toast({
        title: "AI Study Plan Generated!",
        description: `Your personalized ${duration}-minute study plan is ready`,
        variant: "default"
      });
    } catch (error: any) {
      console.error("Study plan generation error:", error);
      if (error.status === 402) {
        toast({
          title: "Subscription Required",
          description: "Upgrade your plan to generate personalized AI study plans",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Generation Failed",
          description: error.message || "Failed to generate study plan. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const startStudyPlan = () => {
    if (generatedPlan) {
      // Scroll to top and show the plan
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Study Plan Header */}
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
          <Brain className="h-8 w-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold mb-2">AI-Generated Study Plan</h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
          Generate a personalized study plan based on this section's content using AI
        </p>
      </div>

      {/* Configuration */}
      <Card className="max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="duration" className="text-sm font-medium">
                Study Duration
              </Label>
              <Select value={duration} onValueChange={setDuration} disabled={isGenerating}>
                <SelectTrigger className="w-full mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="90">90 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={generateStudyPlan}
              disabled={isGenerating}
              className="w-full"
              data-testid="button-generate-ai-study-plan"
            >
              {isGenerating ? (
                <>
                  <Brain className="h-4 w-4 mr-2 animate-spin" />
                  Generating Your Plan...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Generate AI Study Plan
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generated Study Plan Display */}
      {generatedPlan && showPlan && (
        <Card className="max-w-4xl mx-auto border-2 border-green-200 bg-green-50/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-green-800 flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  {generatedPlan.studyPlan.title}
                </CardTitle>
                <p className="text-green-700 text-sm mt-2">
                  Duration: {generatedPlan.studyPlan.estimatedDuration} minutes • 
                  Based on: {generatedPlan.basedOnLesson}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowPlan(false)}>
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-white rounded-lg p-4 max-h-96 overflow-y-auto mb-4">
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {generatedPlan.studyPlan.content}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 justify-center">
              <Button onClick={startStudyPlan} className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Start Study Session
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setGeneratedPlan(null);
                  setShowPlan(false);
                }}
              >
                Generate New Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}