import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Star, Clock, BookOpen, Users, Award } from "lucide-react";
import { Link } from "wouter";

export default function LouisianaJourneymanPrepPricing() {
  const [isAnnual, setIsAnnual] = useState(false);

  useEffect(() => {
    document.title = "Louisiana Journeyman Prep - LA Plumb Prep";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Comprehensive Louisiana Journeyman Plumber certification preparation. Master the Louisiana Plumbing Code with our expert-led course, practice exams, and AI tools.');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600/10 to-indigo-600/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-6">
            <Badge className="bg-blue-100 text-blue-800 px-6 py-2 text-lg">
              Most Popular Course
            </Badge>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Louisiana Journeyman Prep
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            Comprehensive preparation for the Louisiana Journeyman Plumber License exam. Covers all aspects of the Louisiana Plumbing Code, practical applications, and exam strategies.
          </p>
          
          {/* Course Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto mb-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">120</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Lessons</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">4-5</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Years Course</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">95%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Pass Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">24/7</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* What You'll Learn */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            What You'll Master
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Louisiana Plumbing Code</h3>
              <p className="text-gray-600 dark:text-gray-400">Complete coverage of all 17 chapters with real-world applications</p>
            </div>
            <div className="text-center p-6">
              <Award className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Exam Preparation</h3>
              <p className="text-gray-600 dark:text-gray-400">Practice tests and exam strategies proven to increase pass rates</p>
            </div>
            <div className="text-center p-6">
              <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Expert Mentoring</h3>
              <p className="text-gray-600 dark:text-gray-400">AI-powered mentor available 24/7 for technical questions</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-4">
            Get Started Today
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-12">
            Choose a subscription plan that works for you. Cancel anytime.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-xl">Basic</CardTitle>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  $37.49
                  <span className="text-sm font-normal text-gray-600">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <span>Journeyman Prep Course</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <span>Basic Calculator Tools</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <span>Practice Tests</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <span>Email Support</span>
                  </li>
                </ul>
                <Link href="/checkout?plan=basic">
                  <Button className="w-full" variant="outline">
                    Get Started
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-blue-500 relative">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Badge className="bg-blue-600 text-white">Most Popular</Badge>
              </div>
              <CardHeader className="text-center">
                <CardTitle className="text-xl">Professional</CardTitle>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  $59.99
                  <span className="text-sm font-normal text-gray-600">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <span>Everything in Basic</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <span>AI Photo Analysis</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <span>Plan Analysis Tools</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <span>Priority Support</span>
                  </li>
                </ul>
                <Link href="/checkout?plan=professional">
                  <Button className="w-full">
                    Get Started
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-xl">Master</CardTitle>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  $74.99
                  <span className="text-sm font-normal text-gray-600">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <span>Everything in Professional</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <span>All Future Courses</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <span>1-on-1 Mentoring</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <span>White-Glove Support</span>
                  </li>
                </ul>
                <Link href="/checkout?plan=master">
                  <Button className="w-full" variant="outline">
                    Get Started
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}