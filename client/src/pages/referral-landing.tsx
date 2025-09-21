import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { 
  Users, 
  DollarSign, 
  GraduationCap, 
  Award, 
  CheckCircle, 
  ArrowRight,
  Gift,
  Star,
  TrendingUp
} from "lucide-react";

export default function ReferralLanding() {
  const [, params] = useRoute("/ref/:referralCode");
  const [, setLocation] = useLocation();
  const referralCode = params?.referralCode;

  // Fetch referral details if needed
  const { data: referralData } = useQuery({
    queryKey: ["/api/referrals/info", referralCode],
    enabled: !!referralCode,
  });

  const handleGetStarted = () => {
    setLocation(`/pricing?ref=${referralCode}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-primary rounded-full p-4">
              <Gift className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            You've Been Invited!
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join Louisiana's premier plumbing certification platform and save money with this exclusive referral
          </p>
          {referralCode && (
            <Badge variant="secondary" className="mt-4 text-lg px-4 py-2">
              Referral Code: {referralCode}
            </Badge>
          )}
        </div>

        {/* Main Benefits Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <Card className="border-2 border-primary/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <TrendingUp className="h-6 w-6 text-green-600" />
                Your Exclusive Benefits
              </CardTitle>
              <CardDescription>
                Special perks just for being referred by a trusted friend
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold">Beta Pricing Discount</h4>
                  <p className="text-sm text-muted-foreground">
                    Get up to 60% off regular pricing as a beta user
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold">Priority Support</h4>
                  <p className="text-sm text-muted-foreground">
                    Direct access to our expert team for any questions
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold">Referral Rewards</h4>
                  <p className="text-sm text-muted-foreground">
                    Earn commissions when you refer others too
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold">Lifetime Updates</h4>
                  <p className="text-sm text-muted-foreground">
                    Get all future course updates and new features
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <GraduationCap className="h-6 w-6 text-blue-600" />
                LA Plumb Prep Platform
              </CardTitle>
              <CardDescription>
                Everything you need to pass your Louisiana plumbing certification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Award className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Louisiana Journeyman Prep Course</span>
              </div>
              <div className="flex items-center gap-3">
                <Award className="h-5 w-5 text-blue-600" />
                <span className="font-medium">AI-Powered Study Tools</span>
              </div>
              <div className="flex items-center gap-3">
                <Award className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Practice Exams & Quizzes</span>
              </div>
              <div className="flex items-center gap-3">
                <Award className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Expert Mentoring</span>
              </div>
              <div className="flex items-center gap-3">
                <Award className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Job Placement Assistance</span>
              </div>
              <div className="flex items-center gap-3">
                <Award className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Professional Tools & Resources</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pricing Comparison */}
        <Card className="mb-12 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-2 border-green-200 dark:border-green-700">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <DollarSign className="h-6 w-6 text-green-600" />
              Special Beta Pricing
            </CardTitle>
            <CardDescription className="text-lg">
              Limited time pricing for our beta launch participants
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border">
                <h3 className="font-bold text-lg mb-2">Basic</h3>
                <div className="mb-2">
                  <span className="text-2xl font-bold text-green-600">$19.99</span>
                  <span className="text-sm text-muted-foreground line-through ml-2">$49.99</span>
                </div>
                <p className="text-sm text-green-600 font-medium">60% OFF</p>
              </div>
              <div className="text-center p-4 bg-primary text-primary-foreground rounded-lg border-2 border-primary transform scale-105">
                <h3 className="font-bold text-lg mb-2">Professional</h3>
                <div className="mb-2">
                  <span className="text-2xl font-bold">$29.99</span>
                  <span className="text-sm opacity-75 line-through ml-2">$79.99</span>
                </div>
                <p className="text-sm font-medium">62% OFF</p>
                <Badge variant="secondary" className="mt-2">Most Popular</Badge>
              </div>
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border">
                <h3 className="font-bold text-lg mb-2">Master</h3>
                <div className="mb-2">
                  <span className="text-2xl font-bold text-blue-600">$49.99</span>
                  <span className="text-sm text-muted-foreground line-through ml-2">$99.99</span>
                </div>
                <p className="text-sm text-blue-600 font-medium">50% OFF</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social Proof */}
        <Card className="mb-12">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <Star className="h-6 w-6 text-yellow-500" />
              Trusted by Louisiana Plumbers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-primary mb-2">95%</div>
                <p className="text-sm text-muted-foreground">Pass Rate</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-2">1,000+</div>
                <p className="text-sm text-muted-foreground">Certified Plumbers</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-2">4.9★</div>
                <p className="text-sm text-muted-foreground">Average Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center">
          <Button 
            onClick={handleGetStarted}
            size="lg" 
            className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            data-testid="button-get-started"
          >
            Get Started Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Your referral discount will be automatically applied
          </p>
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 text-center">
          <div className="flex justify-center items-center gap-6 flex-wrap text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Louisiana State Approved</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>30-Day Money Back</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Instant Access</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}