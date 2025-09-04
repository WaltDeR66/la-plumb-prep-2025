import { useQuery } from "@tanstack/react-query";

interface Course {
  id: string;
  title: string;
  description: string;
  price: string;
  duration: number;
  lessons: number;
  isActive: boolean;
}

export default function Courses() {
  const { data: courses = [], isLoading, error } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
    retry: 3,
    retryDelay: 1000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen p-8">
        <h1 className="text-3xl font-bold mb-6">Louisiana Plumbing Courses</h1>
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8">
        <h1 className="text-3xl font-bold mb-6">Louisiana Plumbing Courses</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800">Unable to load courses at this time. Please try again later.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-6">Louisiana Plumbing Courses</h1>
      <p className="text-lg text-gray-600 mb-8">
        {courses.length > 0 ? `${courses.length} courses available` : "No courses found"}
      </p>
      
      <div className="grid gap-6 max-w-4xl">
        {courses.map((course) => (
          <div key={course.id} className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold text-gray-900">{course.title}</h2>
              {!course.isActive && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full font-medium">
                  Coming Soon
                </span>
              )}
            </div>
            
            <p className="text-gray-600 mb-4 leading-relaxed">{course.description}</p>
            
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold text-blue-600">
                ${course.price}
              </div>
              <div className="text-sm text-gray-500">
                {course.duration} hours • {course.lessons} lessons
              </div>
            </div>

            {course.isActive && (
              <div className="mt-4">
                <button className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                  Get Started
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {courses.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-500">No courses are currently available.</p>
        </div>
      )}
    </div>
  );
}