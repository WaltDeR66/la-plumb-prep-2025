import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Users, BookOpen, DollarSign, TrendingUp, Eye, UserPlus, CreditCard, GraduationCap } from "lucide-react";
import { useState } from "react";

export default function SystemAnalytics() {
  const [timeRange, setTimeRange] = useState("30");

  // Fetch analytics data
  const { data: analytics } = useQuery({
    queryKey: ["/api/admin/analytics", timeRange],
  });

  const stats = analytics || {
    totalUsers: 0,
    activeStudents: 0,
    totalRevenue: 0,
    courseCompletions: 0,
    newSignups: 0,
    subscriptionConversions: 0,
    jobApplications: 0,
    betaFeedbackScore: 0
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">System Analytics</h1>
            <p className="text-muted-foreground">
              Monitor platform performance and user engagement
            </p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.newSignups} new this period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Students</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeStudents}</div>
              <p className="text-xs text-muted-foreground">
                Currently enrolled
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalRevenue}</div>
              <p className="text-xs text-muted-foreground">
                Total platform revenue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Course Completions</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.courseCompletions}</div>
              <p className="text-xs text-muted-foreground">
                Lessons completed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>User Engagement</CardTitle>
              <CardDescription>Student activity and progression metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Beta Feedback Score</span>
                  <span className="text-2xl font-bold text-green-600">{stats.betaFeedbackScore}/5</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Avg. Session Duration</span>
                  <span className="text-sm">24 minutes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Course Progress Rate</span>
                  <span className="text-sm">73%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">AI Tool Usage</span>
                  <span className="text-sm">156 queries this month</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Business Metrics</CardTitle>
              <CardDescription>Revenue and conversion analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Subscription Conversions</span>
                  <span className="text-2xl font-bold text-blue-600">{stats.subscriptionConversions}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Avg. Revenue per User</span>
                  <span className="text-sm">$89</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Referral Commission Paid</span>
                  <span className="text-sm">$2,340</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Job Placements</span>
                  <span className="text-sm">{stats.jobApplications} applications</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Course Analytics */}
        <Card>
          <CardHeader>
            <CardTitle>Course Performance</CardTitle>
            <CardDescription>Detailed analytics for each course offering</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold">Louisiana Journeyman Prep</h3>
                  <p className="text-sm text-muted-foreground">Active Course</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Enrolled Students</p>
                  <p className="text-lg font-semibold">45</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Progress</p>
                  <p className="text-lg font-semibold">28%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completion Rate</p>
                  <p className="text-lg font-semibold">12%</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg opacity-60">
                <div>
                  <h3 className="font-semibold">Backflow Prevention</h3>
                  <p className="text-sm text-muted-foreground">Coming Soon</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Waitlist</p>
                  <p className="text-lg font-semibold">23</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expected Launch</p>
                  <p className="text-lg font-semibold">Q2 2025</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Interest Score</p>
                  <p className="text-lg font-semibold">High</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}