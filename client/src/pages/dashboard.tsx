import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User, Course, CourseEnrollment, MentorConversation, JobApplication } from "@/../../shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  BookOpen, 
  Trophy, 
  Clock, 
  Target, 
  TrendingUp, 
  Calendar, 
  MessageCircle, 
  FileText,
  Download,
  Star,
  CreditCard,
  Check,
  X,
  Crown,
  Zap,
  DollarSign,
  Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import AIMentorChat from "@/components/ai-mentor-chat";
import { ReferralInviter, ContactSupport } from "@/components/referral-inviter";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

  const { data: enrollments } = useQuery<CourseEnrollment[]>({
    queryKey: ["/api/enrollments"],
  });

  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const { data: conversations } = useQuery<MentorConversation[]>({
    queryKey: ["/api/mentor/conversations"],
  });

  const { data: applications } = useQuery<JobApplication[]>({
    queryKey: ["/api/job-applications"],
  });

  const getCompletedCourses = () => {
    return enrollments?.filter((e) => e.isCompleted).length || 0;
  };

  const getAverageProgress = () => {
    if (!enrollments?.length) return 0;
    const total = enrollments.reduce((sum: number, e) => sum + parseFloat(e.progress || '0'), 0);
    return Math.round(total / enrollments.length);
  };

  const getOverallGrade = () => {
    // Calculate based on test scores and progress
    return "A-"; // Placeholder
  };

  const getRecentActivity = () => {
    return [
      { type: "course", action: "Completed lesson", item: "Pipe Sizing Fundamentals", time: "2 hours ago" },
      { type: "test", action: "Passed practice test", item: "Backflow Prevention", time: "1 day ago" },
      { type: "mentor", action: "Asked AI mentor", item: "Pressure testing procedures", time: "2 days ago" },
      { type: "job", action: "Applied to job", item: "Journeyman Plumber at Gulf South", time: "3 days ago" },
    ];
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-r from-primary/10 to-accent/10 py-8" data-testid="dashboard-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground" data-testid="welcome-message">
                Welcome back, {user?.firstName || user?.username}!
              </h1>
              <p className="text-muted-foreground mt-1">
                Continue your plumbing education journey
              </p>
            </div>
            <div className="text-right">
              <Badge variant="secondary" className="mb-2" data-testid="subscription-tier">
                {user?.subscriptionTier || 'Basic'} Plan
              </Badge>
              <p className="text-sm text-muted-foreground">
                Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="courses" data-testid="tab-courses">My Courses</TabsTrigger>
            <TabsTrigger value="progress" data-testid="tab-progress">Progress</TabsTrigger>
            <TabsTrigger value="mentor" data-testid="tab-mentor">AI Mentor</TabsTrigger>
            <TabsTrigger value="subscription" data-testid="tab-subscription">Subscription</TabsTrigger>
            <TabsTrigger value="jobs" data-testid="tab-jobs">Job Applications</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6" data-testid="quick-stats">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-8 h-8 text-primary" />
                    <div>
                      <p className="text-2xl font-bold" data-testid="stat-courses">{enrollments?.length || 0}</p>
                      <p className="text-sm text-muted-foreground">Enrolled Courses</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Trophy className="w-8 h-8 text-accent" />
                    <div>
                      <p className="text-2xl font-bold" data-testid="stat-completed">{getCompletedCourses()}</p>
                      <p className="text-sm text-muted-foreground">Completed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Target className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold" data-testid="stat-progress">{getAverageProgress()}%</p>
                      <p className="text-sm text-muted-foreground">Avg Progress</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Star className="w-8 h-8 text-yellow-500" />
                    <div>
                      <p className="text-2xl font-bold" data-testid="stat-grade">{getOverallGrade()}</p>
                      <p className="text-sm text-muted-foreground">Overall Grade</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recent Activity */}
              <Card className="lg:col-span-2" data-testid="recent-activity">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {getRecentActivity().map((activity, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-medium">{activity.action}</span> {activity.item}
                          </p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card data-testid="quick-actions">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/courses">
                    <Button className="w-full justify-start" variant="outline" data-testid="action-browse-courses">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Browse Courses
                    </Button>
                  </Link>
                  <Link href="/tools">
                    <Button className="w-full justify-start" variant="outline" data-testid="action-calculators">
                      <Target className="w-4 h-4 mr-2" />
                      Use Calculators
                    </Button>
                  </Link>
                  <Link href="/jobs">
                    <Button className="w-full justify-start" variant="outline" data-testid="action-find-jobs">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Find Jobs
                    </Button>
                  </Link>
                  <Button className="w-full justify-start" variant="outline" data-testid="action-download-certificate">
                    <Download className="w-4 h-4 mr-2" />
                    Download Certificate
                  </Button>
                  <Link href="/referrals">
                    <Button className="w-full justify-start" variant="outline" data-testid="action-referral-program">
                      <DollarSign className="w-4 h-4 mr-2" />
                      Referral Program
                    </Button>
                  </Link>
                  {user && (user.email?.includes('admin') || user.subscriptionTier === 'master') && (
                    <Link href="/admin">
                      <Button className="w-full justify-start" variant="outline" data-testid="action-admin-panel">
                        <Settings className="w-4 h-4 mr-2" />
                        Admin Panel
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Referral and Support Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ReferralInviter />
              <ContactSupport />
            </div>
          </TabsContent>

          <TabsContent value="courses" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="enrolled-courses">
              {enrollments && enrollments.length > 0 ? enrollments.map((enrollment) => {
                const course = courses?.find((c) => c.id === enrollment.courseId);
                if (!course) return null;

                return (
                  <Card key={enrollment.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold text-lg" data-testid={`course-title-${course.id}`}>
                            {course.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">{course.description}</p>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{enrollment.progress}%</span>
                          </div>
                          <Progress value={parseFloat(enrollment.progress || '0')} className="h-2" />
                        </div>

                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>{enrollment.completedLessons} / {course.lessons} lessons</span>
                          {enrollment.isCompleted && (
                            <Badge className="bg-green-100 text-green-800">Completed</Badge>
                          )}
                        </div>

                        <Button className="w-full" asChild data-testid={`continue-course-${course.id}`}>
                          <Link href={`/course/${course.id}`}>
                            {enrollment.isCompleted ? 'Review' : 'Continue'}
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              }) : (
                <div className="col-span-full text-center py-12" data-testid="no-enrolled-courses">
                  <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No enrolled courses</h3>
                  <p className="text-muted-foreground mb-4">Start learning by enrolling in a course</p>
                  <Link href="/courses">
                    <Button data-testid="browse-all-courses">Browse Courses</Button>
                  </Link>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="progress" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Progress Chart */}
              <Card data-testid="progress-chart">
                <CardHeader>
                  <CardTitle>Learning Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {enrollments?.map((enrollment) => {
                      const course = courses?.find((c) => c.id === enrollment.courseId);
                      if (!course) return null;

                      return (
                        <div key={enrollment.id} className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">{course.title}</span>
                            <span className="text-sm text-muted-foreground">{enrollment.progress}%</span>
                          </div>
                          <Progress value={parseFloat(enrollment.progress || '0')} className="h-3" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Test Scores */}
              <Card data-testid="test-scores">
                <CardHeader>
                  <CardTitle>Recent Test Scores</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {enrollments?.filter((e) => e.testScores && Array.isArray(e.testScores) && e.testScores.length > 0).map((enrollment) => {
                      const course = courses?.find((c) => c.id === enrollment.courseId);
                      const latestScore = Array.isArray(enrollment.testScores) ? enrollment.testScores[enrollment.testScores.length - 1] : null;
                      
                      return (
                        <div key={enrollment.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <p className="font-medium">{course?.title}</p>
                            <p className="text-sm text-muted-foreground">Practice Test</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">{latestScore ? (latestScore as any).score : 'N/A'}%</p>
                            <p className="text-xs text-muted-foreground">
                              {latestScore ? new Date((latestScore as any).date).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="mentor" className="space-y-8">
            <AIMentorChat />
          </TabsContent>

          <TabsContent value="subscription" className="space-y-8">
            <SubscriptionManagement />
          </TabsContent>

          <TabsContent value="jobs" className="space-y-8">
            <Card data-testid="job-applications">
              <CardHeader>
                <CardTitle>My Job Applications</CardTitle>
              </CardHeader>
              <CardContent>
                {applications && applications.length > 0 ? (
                  <div className="space-y-4">
                    {applications.map((application) => (
                      <div key={application.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">Job Title</h3>
                            <p className="text-sm text-muted-foreground">Company Name</p>
                          </div>
                          <Badge variant={application.status === 'pending' ? 'secondary' : 'default'}>
                            {application.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          Applied {application.appliedAt ? new Date(application.appliedAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No job applications</h3>
                    <p className="text-muted-foreground mb-4">Start applying to jobs to track your applications here</p>
                    <Link href="/jobs">
                      <Button>Browse Jobs</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Subscription Management Component
function SubscriptionManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

  const { data: subscriptionStatus } = useQuery({
    queryKey: ['/api/subscription-status'],
    retry: false,
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/cancel-subscription");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription will be cancelled at the end of the current billing period.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/subscription-status'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      });
    },
  });

  const pricingPlans = [
    {
      id: "basic",
      name: "Basic",
      price: "$49",
      priceId: "price_basic_monthly",
      tier: "basic",
      description: "Perfect for getting started",
      features: [
        "1 Certification Track",
        "Basic Calculator Tools", 
        "Practice Tests",
        "Job Board Access",
        "Email Support"
      ]
    },
    {
      id: "professional",
      name: "Professional",
      price: "$79",
      priceId: "price_professional_monthly",
      tier: "professional",
      description: "For serious professionals",
      popular: true,
      features: [
        "3 Certification Tracks",
        "Complete Calculator Suite",
        "Photo Code Checker",
        "AI Mentor Support",
        "Resume Builder",
        "Priority Support"
      ]
    },
    {
      id: "master",
      name: "Master",
      price: "$99",
      priceId: "price_master_monthly",
      tier: "master",
      description: "Complete mastery package",
      features: [
        "All 5 Certification Tracks",
        "Plan Analysis Tools",
        "Material List Generator",
        "Referral Commissions",
        "Book Store Access",
        "White-Glove Support"
      ]
    }
  ];

  const currentPlan = pricingPlans.find(plan => plan.tier === user?.subscriptionTier) || pricingPlans[0];
  const hasActiveSubscription = subscriptionStatus?.hasActiveSubscription;

  return (
    <div className="space-y-8">
      {/* Current Subscription Status */}
      <Card data-testid="current-subscription">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5" />
            <span>Current Subscription</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start justify-between">
            <div className="space-y-4">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-xl font-semibold">{currentPlan.name} Plan</h3>
                  {currentPlan.popular && <Crown className="w-5 h-5 text-yellow-500" />}
                  <Badge variant={hasActiveSubscription ? "default" : "secondary"}>
                    {hasActiveSubscription ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-primary">{currentPlan.price}/month</p>
                <p className="text-muted-foreground">{currentPlan.description}</p>
              </div>

              {subscriptionStatus?.currentPeriodEnd && (
                <p className="text-sm text-muted-foreground">
                  {hasActiveSubscription ? "Renews" : "Expires"} on{" "}
                  {new Date(subscriptionStatus.currentPeriodEnd * 1000).toLocaleDateString()}
                </p>
              )}

              <div className="space-y-2">
                <h4 className="font-medium">Included Features:</h4>
                <ul className="space-y-1">
                  {currentPlan.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-2 text-sm">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-2">
              {hasActiveSubscription && user?.subscriptionTier !== 'basic' && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => cancelMutation.mutate()}
                  disabled={cancelMutation.isPending}
                  data-testid="cancel-subscription"
                >
                  {cancelMutation.isPending ? "Cancelling..." : "Cancel Subscription"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Options */}
      {(!hasActiveSubscription || user?.subscriptionTier === 'basic') && (
        <Card data-testid="upgrade-options">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="w-5 h-5" />
              <span>Upgrade Your Plan</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pricingPlans.filter(plan => plan.tier !== user?.subscriptionTier).map((plan) => (
                <Card key={plan.id} className={`relative ${plan.popular ? 'border-primary' : ''}`}>
                  {plan.popular && (
                    <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      Most Popular
                    </Badge>
                  )}
                  <CardContent className="p-6">
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-semibold">{plan.name}</h3>
                      <p className="text-2xl font-bold text-primary">{plan.price}/month</p>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </div>
                    
                    <ul className="space-y-2 mb-6">
                      {plan.features.slice(0, 4).map((feature, index) => (
                        <li key={index} className="flex items-center space-x-2 text-sm">
                          <Check className="w-4 h-4 text-green-600" />
                          <span>{feature}</span>
                        </li>
                      ))}
                      {plan.features.length > 4 && (
                        <li className="text-sm text-muted-foreground">
                          +{plan.features.length - 4} more features
                        </li>
                      )}
                    </ul>
                    
                    <Link href={`/subscribe?plan=${plan.id}&priceId=${plan.priceId}&tier=${plan.tier}`}>
                      <Button className="w-full" size="sm">
                        Upgrade to {plan.name}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing Information */}
      <Card data-testid="billing-info">
        <CardHeader>
          <CardTitle>Billing Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">Payment Method</p>
                <p className="text-sm text-muted-foreground">Managed by Stripe</p>
              </div>
              <Button variant="outline" size="sm">
                Update Payment
              </Button>
            </div>

            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                For billing questions or to update your payment method, please contact our support team.
                All billing is processed securely through Stripe.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
