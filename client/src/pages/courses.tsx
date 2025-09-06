import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Search, Users, BookOpen, CheckCircle, HelpCircle, Upload, Clock, Mic, Brain } from "lucide-react";
import { useLocation } from "wouter";
import { AuthService, User } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Map database UUIDs to friendly course identifiers
function getCourseSlug(courseId: string): string {
  const courseMapping: { [key: string]: string } = {
    '5f02238b-afb2-4e7f-a488-96fb471fee56': 'journeyman-prep',
    'b1f02238b-afb2-4e7f-a488-96fb471fee57': 'backflow-prevention',
    'c2f02238b-afb2-4e7f-a488-96fb471fee58': 'natural-gas',
    'd3f02238b-afb2-4e7f-a488-96fb471fee59': 'medical-gas',
    'e4f02238b-afb2-4e7f-a488-96fb471fee60': 'master-plumber'
  };
  return courseMapping[courseId] || courseId;
}
import { useToast } from "@/hooks/use-toast";

interface Course {
  id: number;
  title: string;
  description: string;
  price: number;
  duration: number;
  lessons: number;
  isActive: boolean;
}

export default function Courses() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Courses");
  const [selectedFilter, setSelectedFilter] = useState("Most Popular");
  const [user, setUser] = useState<User | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: courses = [], isLoading, error } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ["/api/enrollments"],
    enabled: !!user,
  });

  // Fetch content stats for each course using public endpoint
  const { data: contentStats } = useQuery({
    queryKey: ["/api/courses", "all-stats"],
    queryFn: async () => {
      const stats: any = {};
      for (const course of courses) {
        try {
          const courseStats = await apiRequest("GET", `/api/courses/${course.id}/stats`);
          stats[course.id] = courseStats || { 
            questions: 0, flashcards: 0, studyNotes: 0, 
            studyPlans: 0, podcasts: 0, aiChat: 0 
          };
        } catch (error) {
          stats[course.id] = { 
            questions: 0, flashcards: 0, studyNotes: 0, 
            studyPlans: 0, podcasts: 0, aiChat: 0 
          };
        }
      }
      return stats;
    },
    enabled: courses.length > 0,
  });

  // Get current user
  useEffect(() => {
    AuthService.getCurrentUser().then(setUser);
  }, []);

  // Check if user has active subscription
  const hasActiveSubscription = () => {
    if (!user) return false;
    const validTiers = ['basic', 'professional', 'master'];
    return validTiers.includes(user.subscriptionTier?.toLowerCase());
  };

  // Check if user is enrolled in a course
  const isEnrolledIn = (courseId: number) => {
    if (!Array.isArray(enrollments)) return false;
    return enrollments.some((enrollment: any) => enrollment.courseId === courseId.toString());
  };

  // Enrollment mutation
  const enrollMutation = useMutation({
    mutationFn: (courseId: number) => apiRequest("POST", `/api/courses/${courseId}/enroll`),
    onSuccess: (_, courseId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments"] });
      const course = courses.find(c => c.id === courseId);
      toast({
        title: "Enrollment Successful",
        description: `You have been enrolled in ${course?.title}`,
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

  // Handle enrollment button click
  const handleEnrollClick = (course: Course) => {
    if (!user) {
      setLocation("/pricing");
      return;
    }

    if (isEnrolledIn(course.id)) {
      setLocation(`/course/${getCourseSlug(course.id)}`);
      return;
    }

    if (!hasActiveSubscription()) {
      setLocation("/pricing");
      return;
    }

    enrollMutation.mutate(course.id);
  };

  // Get button text and state
  const getButtonState = (course: Course) => {
    if (!course.isActive) {
      return { text: "Coming Soon", disabled: true, variant: "disabled" };
    }

    if (!user) {
      return { text: "Start Course", disabled: false, variant: "primary" };
    }

    if (isEnrolledIn(course.id)) {
      return { text: "Continue Course", disabled: false, variant: "success" };
    }

    if (!hasActiveSubscription()) {
      return { text: "Upgrade to Enroll", disabled: false, variant: "primary" };
    }

    return { 
      text: enrollMutation.isPending ? "Enrolling..." : "Enroll Now", 
      disabled: enrollMutation.isPending, 
      variant: "primary" 
    };
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-4">Louisiana Plumbing Courses</h1>
          <p className="text-red-600">Error loading courses. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16 px-8">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Louisiana Plumbing Certification Courses
          </h1>
          <p className="text-xl mb-8 opacity-90">
            Master your plumbing skills with our comprehensive certification prep courses. All
            courses are Louisiana State Board approved and designed by industry experts.
          </p>
          
          <div className="flex flex-wrap justify-center gap-8 mt-8">
            <div className="flex items-center gap-2">
              <BookOpen className="w-6 h-6" />
              <span className="text-lg font-semibold">5 Certification Tracks</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-6 h-6" />
              <span className="text-lg font-semibold">2,847+ Students</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6" />
              <span className="text-lg font-semibold">State Approved</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-8 py-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex gap-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="All Courses">All Courses</option>
                <option value="Certification">Certification</option>
                <option value="Training">Training</option>
              </select>
              
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Most Popular">Most Popular</option>
                <option value="Newest">Newest</option>
                <option value="Price: Low to High">Price: Low to High</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Course Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-8">
          <div className="flex space-x-8">
            <button className="py-4 px-2 border-b-2 border-indigo-500 text-indigo-600 font-medium">
              All Courses
            </button>
            <button className="py-4 px-2 text-gray-500 hover:text-gray-700">
              My Courses
            </button>
            <button className="py-4 px-2 text-gray-500 hover:text-gray-700">
              Completed
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="max-w-6xl mx-auto px-8 py-12">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading courses...</p>
          </div>
        </div>
      )}

      {/* Courses Grid */}
      {!isLoading && (
        <div className="max-w-6xl mx-auto px-8 py-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course) => (
              <div key={course.id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6">
                  {/* Course Icon */}
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                    <BookOpen className="w-6 h-6 text-indigo-600" />
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-3 text-gray-900">
                    {course.title}
                  </h3>
                  
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {course.description}
                  </p>
                  
                  {/* Content Statistics */}
                  <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                    <div className="flex items-center text-gray-600">
                      <HelpCircle className="w-3 h-3 mr-1" />
                      {contentStats?.[course.id]?.questions || 0} Questions
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Upload className="w-3 h-3 mr-1" />
                      {contentStats?.[course.id]?.flashcards || 0} Flashcards
                    </div>
                    <div className="flex items-center text-gray-600">
                      <BookOpen className="w-3 h-3 mr-1" />
                      {contentStats?.[course.id]?.studyNotes || 0} Study Notes
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-3 h-3 mr-1" />
                      {contentStats?.[course.id]?.studyPlans || 0} Study Plans
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Mic className="w-3 h-3 mr-1" />
                      {contentStats?.[course.id]?.podcasts || 0} Podcasts
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Brain className="w-3 h-3 mr-1" />
                      {contentStats?.[course.id]?.aiChat || 0} AI Chat
                    </div>
                  </div>
                  
                  {/* Features */}
                  <div className="space-y-1 mb-4">
                    <div className="flex items-center text-sm text-green-600">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Comprehensive Curriculum
                    </div>
                    <div className="flex items-center text-sm text-green-600">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Practice Tests Included
                    </div>
                  </div>
                  
                  {/* Coming Soon Badge */}
                  {!course.isActive && (
                    <div className="mb-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                        Coming Soon
                      </span>
                    </div>
                  )}
                  
                  {/* Action Button */}
                  {(() => {
                    const buttonState = getButtonState(course);
                    return (
                      <button
                        onClick={() => handleEnrollClick(course)}
                        disabled={buttonState.disabled}
                        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                          buttonState.variant === "disabled"
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : buttonState.variant === "success"
                            ? "bg-green-600 text-white hover:bg-green-700"
                            : "bg-indigo-600 text-white hover:bg-indigo-700"
                        }`}
                        data-testid={`button-enroll-${course.id}`}
                      >
                        {buttonState.text}
                      </button>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
          
          {filteredCourses.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <p className="text-gray-500">No courses found matching your search.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}