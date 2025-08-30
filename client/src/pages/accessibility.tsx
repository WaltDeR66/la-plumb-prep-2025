import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Accessibility() {
  return (
    <div className="min-h-screen bg-background py-12" data-testid="accessibility-page">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4" data-testid="back-button">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-foreground mb-4" data-testid="accessibility-title">
            Accessibility Statement
          </h1>
          <p className="text-muted-foreground text-lg" data-testid="accessibility-subtitle">
            Last updated: January 2024
          </p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Our Commitment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                LA Plumb Prep is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.
              </p>
              <p>
                We strive to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 AA standards to ensure our platform is accessible to all users.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Accessibility Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Our platform includes the following accessibility features:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Keyboard navigation support throughout the platform</li>
                <li>Screen reader compatibility with proper ARIA labels</li>
                <li>High contrast color schemes for better visibility</li>
                <li>Resizable text that scales up to 200% without loss of functionality</li>
                <li>Alternative text for all images and visual content</li>
                <li>Captions and transcripts for video content</li>
                <li>Clear and consistent navigation structure</li>
                <li>Form labels and error messages that are clearly associated</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assistive Technologies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Our platform is designed to work with:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Screen readers (JAWS, NVDA, VoiceOver, TalkBack)</li>
                <li>Voice recognition software</li>
                <li>Keyboard-only navigation</li>
                <li>Switch navigation devices</li>
                <li>Magnification software</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Known Limitations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                While we strive for full accessibility, we acknowledge that some areas may still need improvement:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Some third-party embedded content may not meet accessibility standards</li>
                <li>Complex interactive tools may require additional keyboard shortcuts</li>
                <li>PDF documents are being updated to meet accessibility requirements</li>
              </ul>
              <p>
                We are actively working to address these limitations in future updates.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Feedback and Support</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                We welcome your feedback on the accessibility of LA Plumb Prep. Please let us know if you encounter accessibility barriers:
              </p>
              <div className="mt-4">
                <p><strong>Email:</strong> support@laplumbprep.com</p>
                <p><strong>Response Time:</strong> We aim to respond within 2 business days</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Accessibility Training</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Our development team regularly receives training on accessibility best practices to ensure we continue to improve our platform for all users.
              </p>
              <p>
                We also conduct regular accessibility audits and user testing with people with disabilities to identify and address potential barriers.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alternative Formats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                If you need course materials or other content in an alternative format, please contact us. We can provide:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Large print materials</li>
                <li>Audio recordings of written content</li>
                <li>Braille versions upon request</li>
                <li>Plain text versions of complex documents</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                For accessibility concerns or requests for assistance:
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