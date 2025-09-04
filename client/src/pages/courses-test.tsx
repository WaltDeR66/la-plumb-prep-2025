import React from "react";
import { useQuery } from "@tanstack/react-query";

export default function CoursesTest() {
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["/api/courses"],
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  console.log("✅ Test page loaded successfully", { courses: courses.length, isLoading });

  if (isLoading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Courses Test Page</h1>
        <p>Loading courses...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Courses Test Page</h1>
      <p className="mb-4">✅ Page loaded successfully! Found {courses.length} courses.</p>
      <div className="space-y-2">
        {courses.map((course: any, index: number) => (
          <div key={course.id || index} className="p-3 bg-gray-100 rounded">
            <h3 className="font-semibold">{course.title}</h3>
            <p className="text-sm text-gray-600">{course.description}</p>
            <p className="text-sm font-medium">${course.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
}