import React from "react";
import { useQuery } from "@tanstack/react-query";

export default function Courses() {
  console.log("✅ Courses page loaded successfully");

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["/api/courses"],
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white p-8">
        <h1 className="text-3xl font-bold mb-8">Louisiana Plumbing Courses</h1>
        <p className="text-lg">Loading courses...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <h1 className="text-3xl font-bold mb-8">Louisiana Plumbing Courses</h1>
      <p className="text-lg mb-6">✅ Found {courses.length} courses available</p>
      
      <div className="space-y-6">
        {courses.map((course: any, index: number) => (
          <div key={course.id || index} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
            <h2 className="text-xl font-semibold mb-2">{course.title}</h2>
            <p className="text-gray-600 mb-4">{course.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-blue-600">${course.price}</span>
              <span className="text-sm text-gray-500">
                {course.duration} hours • {course.lessons} lessons
              </span>
            </div>
            {!course.isActive && (
              <div className="mt-2">
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
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