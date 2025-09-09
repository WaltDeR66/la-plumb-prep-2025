import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Star, Clock, BookOpen, Users, Award } from "lucide-react";
import { Link } from "wouter";

export default function NaturalGasCertificationPricing() {
  useEffect(() => {
    document.title = "Natural Gas Certification - LA Plumb Prep";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Complete preparation for Louisiana natural gas certification covering safety protocols, installation procedures, and state regulations for natural gas systems.');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-orange-600/10 to-red-600/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-6">
            <Badge className="bg-yellow-100 text-yellow-800 px-6 py-2 text-lg">
              Coming Soon
            </Badge>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Natural Gas Certification
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            Complete preparation for Louisiana natural gas certification covering safety protocols, installation procedures, and state regulations for natural gas systems.
          </p>
          
          {/* Course Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto mb-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">24</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Lessons</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">3-4</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Months</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">Inter</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Level</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">24/7</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* What You'll Learn */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Master Natural Gas Systems
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <BookOpen className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Safety Protocols</h3>
              <p className="text-gray-600 dark:text-gray-400">Critical safety procedures for natural gas installation and maintenance</p>
            </div>
            <div className="text-center p-6">
              <Award className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Installation Procedures</h3>
              <p className="text-gray-600 dark:text-gray-400">Proper techniques for residential and commercial gas line installation</p>
            </div>
            <div className="text-center p-6">
              <Users className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">State Regulations</h3>
              <p className="text-gray-600 dark:text-gray-400">Louisiana-specific codes and compliance requirements</p>
            </div>
          </div>
        </div>
      </section>

      {/* Coming Soon */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Coming Soon
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            This essential certification course is currently in development. Reserve your spot today!
          </p>
          
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Get Notified</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Be among the first to access this critical safety training course.
              </p>
              <Link href="/pricing">
                <Button className="w-full">
                  Join Waitlist
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}