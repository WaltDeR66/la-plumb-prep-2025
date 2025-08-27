import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, BookOpen, Clock, Users, Star } from "lucide-react";
import CourseCard from "@/components/course-card";
import { useToast } from "@/hooks/use-toast";

export default function Courses() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const { toast } = useToast();

  const { data: courses, isLoading } = useQuery({
    queryKey: ["/api/courses"],
  });

  const { data: enrollments } = useQuery({
    queryKey: ["/api/enrollments"],
    retry: false,
  });

  const categories = [
    { value: "all", label: "All Courses" },
    { value: "journeyman", label: "Journeyman" },
    { value: "backflow", label: "Backflow Prevention" },
    { value: "natural_gas", label: "Natural Gas" },
    { value: "medical_gas", label: "Medical Gas" },
    { value: "master", label: "Master Plumber" },
  ];

  const filteredCourses = courses?.filter((course: any) => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || course.type === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  const isEnrolled = (courseId: string) => {
    return enrollments?.some((enrollment: any) => enrollment.courseId === courseId);
  };

  const getEnrollmentProgress = (courseId: string) => {
    const enrollment = enrollments?.find((e: any) => e.courseId === courseId);
    return enrollment ? parseFloat(enrollment.progress) : 0;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="gradient-hero text-white py-16" data-testid="courses-hero">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6" data-testid="courses-title">
              Louisiana Plumbing Certification Courses
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8" data-testid="courses-description">
              Master your plumbing skills with our comprehensive certification prep courses. 
              All courses are Louisiana State Board approved and designed by industry experts.
            </p>
            <div className="flex items-center justify-center space-x-8 text-blue-100">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5" />
                <span>5 Certification Tracks</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>2,847+ Students</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5" />
                <span>State Approved</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="py-8 bg-white border-b" data-testid="courses-filters">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-courses"
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48" data-testid="filter-category">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-36" data-testid="sort-courses">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Grid */}
      <section className="py-16" data-testid="courses-grid">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="all" data-testid="tab-all-courses">All Courses</TabsTrigger>
              <TabsTrigger value="enrolled" data-testid="tab-my-courses">My Courses</TabsTrigger>
              <TabsTrigger value="completed" data-testid="tab-completed">Completed</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-8">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="p-6">
                      <div className="animate-pulse space-y-4">
                        <div className="w-12 h-12 bg-muted rounded-lg"></div>
                        <div className="h-6 bg-muted rounded"></div>
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-8 bg-muted rounded"></div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : filteredCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredCourses.map((course: any) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      isEnrolled={isEnrolled(course.id)}
                      progress={getEnrollmentProgress(course.id)}
                      data-testid={`course-card-${course.id}`}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16" data-testid="no-courses">
                  <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No courses found</h3>
                  <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="enrolled" className="space-y-8">
              {enrollments && enrollments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {enrollments.map((enrollment: any) => {
                    const course = courses?.find((c: any) => c.id === enrollment.courseId);
                    if (!course) return null;
                    
                    return (
                      <CourseCard
                        key={course.id}
                        course={course}
                        isEnrolled={true}
                        progress={parseFloat(enrollment.progress)}
                        data-testid={`enrolled-course-${course.id}`}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16" data-testid="no-enrolled-courses">
                  <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No enrolled courses</h3>
                  <p className="text-muted-foreground mb-4">Start your learning journey by enrolling in a course.</p>
                  <Button onClick={() => document.getElementById('all')?.click()} data-testid="browse-courses">
                    Browse Courses
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-8">
              {enrollments?.filter((e: any) => e.isCompleted).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {enrollments
                    .filter((enrollment: any) => enrollment.isCompleted)
                    .map((enrollment: any) => {
                      const course = courses?.find((c: any) => c.id === enrollment.courseId);
                      if (!course) return null;
                      
                      return (
                        <CourseCard
                          key={course.id}
                          course={course}
                          isEnrolled={true}
                          progress={100}
                          isCompleted={true}
                          data-testid={`completed-course-${course.id}`}
                        />
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-16" data-testid="no-completed-courses">
                  <Star className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No completed courses</h3>
                  <p className="text-muted-foreground">Complete your enrolled courses to see them here.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 bg-muted/50" data-testid="course-stats">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">2,847</div>
              <div className="text-muted-foreground">Students Enrolled</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">94%</div>
              <div className="text-muted-foreground">Pass Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">4.8/5</div>
              <div className="text-muted-foreground">Student Rating</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">24/7</div>
              <div className="text-muted-foreground">AI Support</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
