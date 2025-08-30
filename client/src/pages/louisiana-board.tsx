import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowLeft, ExternalLink, Building, FileText, Calendar, Users } from "lucide-react";

export default function LouisianaBoard() {
  return (
    <div className="min-h-screen bg-background py-12" data-testid="louisiana-board-page">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4" data-testid="back-button">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-foreground mb-4" data-testid="board-title">
            Louisiana State Board of Examiners of Plumbers
          </h1>
          <p className="text-muted-foreground text-lg" data-testid="board-subtitle">
            Official information and resources from the Louisiana State Plumbing Board
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="w-5 h-5 text-primary" />
                <span>Board Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Official Website</h4>
                  <a 
                    href="https://www.lsbep.org" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-primary hover:underline"
                    data-testid="board-website-link"
                  >
                    <span>www.lsbep.org</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Contact Information</h4>
                  <div className="text-muted-foreground space-y-1">
                    <p>Louisiana State Board of Examiners of Plumbers</p>
                    <p>9800 Airline Highway, Suite 104</p>
                    <p>Baton Rouge, LA 70815</p>
                    <p>Phone: (225) 925-6291</p>
                    <p>Fax: (225) 925-6292</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-primary" />
                <span>Licensing Requirements</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Apprentice Plumber</h4>
                  <ul className="text-muted-foreground text-sm space-y-1 list-disc list-inside">
                    <li>Must be 18 years or older</li>
                    <li>High school diploma or equivalent</li>
                    <li>Pass written examination</li>
                    <li>Register with licensed master plumber</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Journeyman Plumber</h4>
                  <ul className="text-muted-foreground text-sm space-y-1 list-disc list-inside">
                    <li>4 years apprentice experience</li>
                    <li>Pass written and practical examination</li>
                    <li>Complete required training hours</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Master Plumber</h4>
                  <ul className="text-muted-foreground text-sm space-y-1 list-disc list-inside">
                    <li>2 years journeyman experience</li>
                    <li>Pass comprehensive examination</li>
                    <li>Business and law requirements</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-primary" />
                <span>Examination Schedule</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Plumbing examinations are held regularly throughout the year.
              </p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Written Exams:</span>
                  <span className="font-medium">Monthly</span>
                </div>
                <div className="flex justify-between">
                  <span>Practical Exams:</span>
                  <span className="font-medium">Quarterly</span>
                </div>
                <div className="flex justify-between">
                  <span>Application Deadline:</span>
                  <span className="font-medium">30 days prior</span>
                </div>
              </div>
              <a 
                href="https://www.lsbep.org/examinations" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-primary hover:underline mt-4"
                data-testid="exam-schedule-link"
              >
                <span>View Current Schedule</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-primary" />
                <span>Continuing Education</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Louisiana requires continuing education to maintain your license.
              </p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Journeyman:</span>
                  <span className="font-medium">8 hours/year</span>
                </div>
                <div className="flex justify-between">
                  <span>Master:</span>
                  <span className="font-medium">8 hours/year</span>
                </div>
                <div className="flex justify-between">
                  <span>Renewal:</span>
                  <span className="font-medium">Annually</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                * LA Plumb Prep courses can count toward continuing education requirements
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle>Important Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Official Forms & Applications</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a 
                      href="https://www.lsbep.org/forms" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center space-x-1"
                    >
                      <span>License Applications</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                  <li>
                    <a 
                      href="https://www.lsbep.org/renewals" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center space-x-1"
                    >
                      <span>License Renewals</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Code & Regulations</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a 
                      href="https://www.lsbep.org/codes" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center space-x-1"
                    >
                      <span>Louisiana Plumbing Code</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                  <li>
                    <a 
                      href="https://www.lsbep.org/regulations" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center space-x-1"
                    >
                      <span>Board Regulations</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                <strong>Disclaimer:</strong> This information is provided for reference only. 
                Always verify current requirements and procedures with the official Louisiana State Board website.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}