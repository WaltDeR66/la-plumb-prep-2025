import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background py-12" data-testid="terms-page">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4" data-testid="back-button">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-foreground mb-4" data-testid="terms-title">
            Terms of Service
          </h1>
          <p className="text-muted-foreground text-lg" data-testid="terms-subtitle">
            Last updated: January 2024
          </p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Acceptance of Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                By accessing and using LA Plumb Prep's services, you accept and agree to be bound by the terms and provision of this agreement. These Terms of Service govern your use of our platform, including all courses, tools, and services provided.
              </p>
              <p>
                If you do not agree to abide by the above, please do not use this service.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Description of Service</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>LA Plumb Prep provides:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Louisiana plumbing certification preparation courses</li>
                <li>Professional tools including calculators and AI analysis</li>
                <li>Job board services for plumbing professionals</li>
                <li>AI-powered mentoring and support</li>
                <li>Photo analysis for code compliance</li>
                <li>Career advancement resources</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Accounts and Responsibilities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>To access certain features, you must create an account. You agree to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain the security of your password and account</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized use</li>
                <li>Use the service only for lawful purposes</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>For paid services:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Subscription fees are billed in advance on a monthly or annual basis</li>
                <li>You may cancel your subscription at any time</li>
                <li>Pro-rated refunds are provided for unused time when you cancel</li>
                <li>All payments are processed securely through Stripe</li>
                <li>Prices may change with 30 days advance notice</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Intellectual Property</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                All content, features, and functionality on LA Plumb Prep are owned by us, our licensors, or other providers and are protected by copyright, trademark, and other intellectual property laws.
              </p>
              <p>You may not:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Reproduce, distribute, or create derivative works</li>
                <li>Reverse engineer or attempt to extract source code</li>
                <li>Share your account credentials with others</li>
                <li>Use the service for commercial purposes without permission</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Job Board Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>For job board services:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Employers must provide accurate job postings</li>
                <li>Job seekers must provide truthful information</li>
                <li>We are not responsible for employment decisions or outcomes</li>
                <li>All interactions between employers and candidates are at their own risk</li>
                <li>We reserve the right to remove inappropriate postings</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                LA Plumb Prep shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
              </p>
              <p>
                Our total liability shall not exceed the amount paid by you for the service during the twelve months preceding the claim.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Termination</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                We may terminate or suspend your account immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.
              </p>
              <p>
                Upon termination, your right to use the service will cease immediately.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Questions about the Terms of Service should be sent to:
              </p>
              <div className="mt-4">
                <p><strong>Email:</strong> support@laplumbprep.com</p>
                <p><strong>Address:</strong> LA Plumb Prep, Louisiana, USA</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}