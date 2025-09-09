import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Star, Clock, BookOpen, Users, Award } from "lucide-react";
import { Link } from "wouter";

export default function BackflowPreventionPricing() {
  useEffect(() => {
    document.title = "Backflow Prevention Training - LA Plumb Prep";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Comprehensive training course covering backflow prevention testing, repairs, and field report completion. Learn proper testing procedures and regulatory compliance.');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-green-600/10 to-teal-600/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-6">
            <Badge className="bg-yellow-100 text-yellow-800 px-6 py-2 text-lg">
              Coming Soon
            </Badge>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Backflow Prevention Training
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            Comprehensive training course covering backflow prevention testing, repairs, and field report completion. Learn proper testing procedures, equipment maintenance, and regulatory compliance for backflow prevention assemblies.
          </p>
          
          {/* Course Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto mb-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">16</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Lessons</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">6-8</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Weeks</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">Inter</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Level</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">24/7</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* What You'll Learn */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Master Backflow Prevention
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <BookOpen className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Testing Procedures</h3>
              <p className="text-gray-600 dark:text-gray-400">Learn proper testing techniques for all backflow device types</p>
            </div>
            <div className="text-center p-6">
              <Award className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Repair Techniques</h3>
              <p className="text-gray-600 dark:text-gray-400">Hands-on training for repairing and maintaining assemblies</p>
            </div>
            <div className="text-center p-6">
              <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Field Reports</h3>
              <p className="text-gray-600 dark:text-gray-400">Complete field report completion and regulatory compliance</p>
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
            This specialized training course is in development. Join our waitlist for early access!
          </p>
          
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Get Notified</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Be the first to access this specialized training with early bird pricing.
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