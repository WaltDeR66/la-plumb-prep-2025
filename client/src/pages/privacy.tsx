import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background py-12" data-testid="privacy-page">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4" data-testid="back-button">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-foreground mb-4" data-testid="privacy-title">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground text-lg" data-testid="privacy-subtitle">
            Last updated: January 2024
          </p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Information We Collect</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                At LA Plumb Prep, we collect information that you provide directly to us, such as when you:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Create an account or enroll in our courses</li>
                <li>Contact us for support or information</li>
                <li>Subscribe to our newsletters or updates</li>
                <li>Use our AI mentor and photo analysis tools</li>
                <li>Apply for jobs through our job board</li>
              </ul>
              <p>
                This information may include your name, email address, phone number, professional certifications, and payment information.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How We Use Your Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide and improve our educational services</li>
                <li>Process payments and manage subscriptions</li>
                <li>Send course updates and important notifications</li>
                <li>Provide customer support</li>
                <li>Personalize your learning experience</li>
                <li>Connect job seekers with employers through our job board</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Information Sharing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>With service providers who assist in operating our platform</li>
                <li>When required by law or to protect our rights</li>
                <li>With employers when you apply for jobs (with your explicit consent)</li>
                <li>In connection with a business transfer or acquisition</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Encryption of sensitive data in transit and at rest</li>
                <li>Regular security audits and updates</li>
                <li>Limited access to personal information on a need-to-know basis</li>
                <li>Secure payment processing through trusted providers</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Rights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access and update your personal information</li>
                <li>Delete your account and associated data</li>
                <li>Opt out of marketing communications</li>
                <li>Request a copy of your data</li>
                <li>Withdraw consent for data processing</li>
              </ul>
              <p>
                To exercise these rights, please contact us at{" "}
                <a href="mailto:privacy@laplumbprep.com" className="text-primary hover:underline">
                  privacy@laplumbprep.com
                </a>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                If you have questions about this Privacy Policy, please contact us at:
              </p>
              <div className="mt-4">
                <p><strong>Email:</strong> privacy@laplumbprep.com</p>
                <p><strong>Address:</strong> LA Plumb Prep, Louisiana, USA</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}