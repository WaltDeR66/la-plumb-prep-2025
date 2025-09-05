import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Users, MessageSquare, BarChart3, Settings, BookOpen } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your LA Plumb Prep platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Content Management
              </CardTitle>
              <CardDescription>
                Create and manage course lessons, chapters, and practice questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/content">
                <Button className="w-full">
                  Manage Content
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Beta Feedback Dashboard
              </CardTitle>
              <CardDescription>
                Monitor beta tester feedback, satisfaction scores, and system alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/beta-feedback">
                <Button className="w-full">
                  View Feedback Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Job Approval
              </CardTitle>
              <CardDescription>
                Review and approve job postings from employers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/job-approval">
                <Button className="w-full">
                  Review Job Postings
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                System Analytics
              </CardTitle>
              <CardDescription>
                View platform usage, enrollment metrics, and performance data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Settings
              </CardTitle>
              <CardDescription>
                Configure platform settings, notifications, and integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">Quick Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium">Beta Testers</div>
              <div className="text-muted-foreground">Monitoring active</div>
            </div>
            <div>
              <div className="font-medium">Email System</div>
              <div className="text-muted-foreground">Operational</div>
            </div>
            <div>
              <div className="font-medium">Payment Processing</div>
              <div className="text-muted-foreground">Active</div>
            </div>
            <div>
              <div className="font-medium">Domain Status</div>
              <div className="text-muted-foreground">Verified</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}