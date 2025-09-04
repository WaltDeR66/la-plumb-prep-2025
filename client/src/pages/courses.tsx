import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Users, BookOpen, CheckCircle } from "lucide-react";

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

  const { data: courses = [], isLoading, error } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

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
                  
                  {/* Course Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="w-4 h-4 mr-2">⏱️</span>
                      {course.duration} weeks
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="w-4 h-4 mr-2">📚</span>
                      {course.lessons} lessons
                    </div>
                  </div>
                  
                  {/* Features */}
                  <div className="space-y-1 mb-4">
                    <div className="flex items-center text-sm text-green-600">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      State Approved Curriculum
                    </div>
                    <div className="flex items-center text-sm text-green-600">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Practice Tests Included
                    </div>
                  </div>
                  
                  {/* Coming Soon Badge or Price */}
                  {!course.isActive ? (
                    <div className="mb-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                        Coming Soon
                      </span>
                    </div>
                  ) : (
                    <div className="text-2xl font-bold text-indigo-600 mb-4">
                      ${course.price}
                    </div>
                  )}
                  
                  {/* Action Button */}
                  <button
                    disabled={!course.isActive}
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                      course.isActive
                        ? "bg-indigo-600 text-white hover:bg-indigo-700"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {course.isActive ? "Enroll Now" : "Coming Soon"}
                  </button>
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