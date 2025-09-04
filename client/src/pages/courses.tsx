import { useQuery } from "@tanstack/react-query";

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
  const { data: courses = [], isLoading, error } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Louisiana Plumbing Courses</h1>
        <p className="text-red-600">Error loading courses. Please try again later.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Louisiana Plumbing Courses</h1>
        <p>Loading courses...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Louisiana Plumbing Courses</h1>
      <p className="text-lg mb-8">Found {courses.length} courses</p>
      
      <div className="grid gap-6">
        {courses.map((course) => (
          <div key={course.id} className="border rounded-lg p-6 bg-white shadow-sm">
            <h2 className="text-xl font-semibold mb-2">{course.title}</h2>
            <p className="text-gray-600 mb-4">{course.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold text-blue-600">${course.price}</span>
              <div className="text-sm text-gray-500">
                {course.duration} hours • {course.lessons} lessons
              </div>
            </div>
            {!course.isActive && (
              <div className="mt-3">
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                  Coming Soon
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}