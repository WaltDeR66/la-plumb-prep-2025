import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Clock, Users, Star, CheckCircle, Play } from "lucide-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface CourseCardProps {
  course: {
    id: string;
    title: string;
    description: string;
    type: string;
    price: string;
    duration?: number;
    lessons?: number;
    practiceQuestions?: number;
    isActive?: boolean;
  };
  isEnrolled?: boolean;
  progress?: number;
  isCompleted?: boolean;
}

export default function CourseCard({ course, isEnrolled = false, progress = 0, isCompleted = false }: CourseCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check user's subscription status
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const enrollMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/courses/${course.id}/enroll`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
      toast({
        title: "Enrollment Successful",
        description: `You have been enrolled in ${course.title}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Enrollment Failed",
        description: error.message || "Failed to enroll in course",
        variant: "destructive",
      });
    },
  });

  const getCourseIcon = () => {
    switch (course.type) {
      case "journeyman":
        return BookOpen;
      case "backflow":
        return Star;
      case "natural_gas":
        return BookOpen;
      case "medical_gas":
        return BookOpen;
      case "master":
        return Star;
      default:
        return BookOpen;
    }
  };

  const getCourseColor = () => {
    switch (course.type) {
      case "journeyman":
        return "bg-primary";
      case "backflow":
        return "bg-accent";
      case "natural_gas":
        return "bg-orange-500";
      case "medical_gas":
        return "bg-red-500";
      case "master":
        return "bg-purple-600";
      default:
        return "bg-primary";
    }
  };

  const handleEnroll = () => {
    enrollMutation.mutate();
  };

  // Check if user has active subscription for course access
  const hasActiveSubscription = () => {
    if (!user) return false;
    const validTiers = ['basic', 'professional', 'master'];
    return validTiers.includes((user as any)?.subscriptionTier?.toLowerCase());
  };

  const IconComponent = getCourseIcon();
  const colorClass = getCourseColor();

  return (
    <Card className={`hover:shadow-lg transition-shadow ${isCompleted ? 'border-green-200' : ''}`} data-testid={`course-card-${course.id}`}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className={`w-12 h-12 ${colorClass} rounded-lg flex items-center justify-center${course.isActive === false ? ' opacity-50' : ''}`}>
              <IconComponent className="w-6 h-6 text-white" />
            </div>
            <div className="flex gap-2">
              {course.isActive === false && (
                <Badge className="bg-yellow-100 text-yellow-800" data-testid="coming-soon-badge">
                  Coming Soon
                </Badge>
              )}
              {isCompleted && (
                <Badge className="bg-green-100 text-green-800" data-testid="completed-badge">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Completed
                </Badge>
              )}
            </div>
          </div>

          {/* Course Info */}
          <div>
            <h3 className="text-xl font-semibold text-card-foreground mb-2" data-testid={`course-title-${course.id}`}>
              {course.title}
            </h3>
            <p className="text-muted-foreground text-sm line-clamp-3" data-testid={`course-description-${course.id}`}>
              {course.description}
            </p>
          </div>

          {/* Course Stats */}
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            {course.duration && (
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{course.duration}h</span>
              </div>
            )}
            {course.lessons && (
              <div className="flex items-center space-x-1">
                <BookOpen className="w-4 h-4" />
                <span>{course.lessons} lessons</span>
              </div>
            )}
            {course.practiceQuestions && (
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4" />
                <span>{course.practiceQuestions} quizzes</span>
              </div>
            )}
          </div>

          {/* Progress Bar (for enrolled courses) */}
          {isEnrolled && (
            <div className="space-y-2" data-testid={`course-progress-${course.id}`}>
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Features */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>State Approved Curriculum</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Practice Tests Included</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Certificate Upon Completion</span>
            </div>
          </div>

          {/* Action */}
          <div className="flex items-center justify-between pt-4 border-t">
            {!isEnrolled ? (
              <>
                <div className="text-sm text-muted-foreground">
                  {course.isActive === false ? "Coming soon" : "Professional certification prep"}
                </div>
                {course.isActive === false ? (
                  <Button 
                    disabled
                    data-testid={`button-coming-soon-${course.id}`}
                  >
                    Coming Soon
                  </Button>
                ) : !user ? (
                  // User is not logged in - redirect to registration
                  <Button 
                    asChild
                    data-testid={`button-start-${course.id}`}
                  >
                    <Link href="/register">
                      Start Course
                    </Link>
                  </Button>
                ) : hasActiveSubscription() ? (
                  // User is logged in and has subscription - enroll directly
                  <Button 
                    onClick={handleEnroll}
                    disabled={enrollMutation.isPending}
                    data-testid={`button-start-${course.id}`}
                  >
                    {enrollMutation.isPending ? "Enrolling..." : "Start Course"}
                  </Button>
                ) : (
                  // User is logged in but doesn't have subscription - go to pricing
                  <Button 
                    asChild
                    data-testid={`button-start-${course.id}`}
                  >
                    <Link href="/pricing">
                      Start Course
                    </Link>
                  </Button>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>Enrolled</span>
                </div>
                <Button 
                  variant={isCompleted ? "outline" : "default"}
                  asChild
                  data-testid={`button-continue-${course.id}`}
                >
                  <Link href={`/course/${course.id}`}>
                    <Play className="w-4 h-4 mr-2" />
                    {isCompleted ? "Review" : "Continue"}
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
