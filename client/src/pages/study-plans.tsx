import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, ArrowLeft, BookOpen, Play } from "lucide-react";

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

interface Course {
  id: string;
  title: string;
  description: string;
}

interface StudyPlan {
  id: string;
  title: string;
  content: string;
  duration: number;
}

export default function StudyPlans() {
  const [match, params] = useRoute("/study-plans/:courseId");
  const courseId = params?.courseId;

  if (!courseId) {
    return <div>Course not found</div>;
  }

  // Resolve friendly course ID to UUID for API calls
  const resolvedCourseId = getCourseUUID(courseId);

  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });
  
  const course = courses?.find(c => c.id === resolvedCourseId);

  const { data: studyPlans, isLoading } = useQuery<StudyPlan[]>({
    queryKey: [`/api/courses/${resolvedCourseId}/study-plans`],
    enabled: !!resolvedCourseId,
  });

  // Group study plans by duration
  const studyPlansByDuration = studyPlans?.reduce((acc, plan) => {
    if (!acc[plan.duration]) acc[plan.duration] = [];
    acc[plan.duration].push(plan);
    return acc;
  }, {} as Record<number, StudyPlan[]>) || {};

  // Define the available durations we want to show
  const availableDurations = [15, 30, 60]; // 15min, 30min, 1 hour

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return <div>Course not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" asChild data-testid="back-to-course">
          <Link href={`/course/${courseId}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Course
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="study-plans-title">
            Study Plans
          </h1>
          <p className="text-muted-foreground mt-1" data-testid="course-title">
            {course.title}
          </p>
        </div>
      </div>

      {/* Study Plan Duration Options */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Choose Your Study Time</h2>
          <p className="text-muted-foreground">
            Select how much time you have available for focused study today
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {availableDurations.map(duration => {
            const plansForDuration = studyPlansByDuration[duration];
            const planExists = plansForDuration && plansForDuration.length > 0;
            const durationLabel = duration === 60 ? '1 Hour' : `${duration} Minutes`;
            
            return (
              <Card 
                key={duration}
                className={`hover:shadow-lg transition-all duration-200 ${
                  planExists ? 'cursor-pointer border-primary/20 hover:border-primary/40' : 'opacity-60'
                }`}
                data-testid={`study-plan-${duration}`}
              >
                <CardHeader className="text-center pb-4">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Clock className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <CardTitle className="text-xl" data-testid={`duration-title-${duration}`}>
                    {durationLabel}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {duration === 15 && "Quick focused review"}
                    {duration === 30 && "Comprehensive study session"}  
                    {duration === 60 && "Deep dive learning"}
                  </p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {planExists ? (
                      <>
                        <div className="text-center space-y-2">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <BookOpen className="w-3 h-3 mr-1" />
                            Study Plan Available
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            Structured content with timed sections
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Button 
                            asChild
                            className="w-full"
                            size="lg"
                            data-testid={`start-${duration}-min-plan`}
                          >
                            <Link href={`/study-plans/${courseId}/${duration}/0`}>
                              <Play className="h-4 w-4 mr-2" />
                              Start {durationLabel} Study
                            </Link>
                          </Button>
                          
                          <Button 
                            asChild
                            variant="outline"
                            className="w-full"
                            size="sm"
                            data-testid={`review-${duration}-min-plan`}
                          >
                            <Link href={`/study-plans/${courseId}/${duration}/0?review=true`}>
                              <BookOpen className="h-4 w-4 mr-2" />
                              Review Previous Sessions
                            </Link>
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-center space-y-2">
                          <Badge variant="outline" className="bg-gray-50 text-gray-600">
                            Coming Soon
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            Study plan for this duration is being prepared
                          </p>
                        </div>
                        <Button 
                          disabled
                          className="w-full"
                          size="lg"
                          variant="secondary"
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          {durationLabel} Plan
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Study Tips */}
        <div className="max-w-2xl mx-auto mt-12">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-3 flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-primary" />
                Study Plan Features
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span>Timed sections with automatic progression</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span>Focused content tailored to your available time</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span>Step-by-step progression through study materials</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span>Track your progress and completion status</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}