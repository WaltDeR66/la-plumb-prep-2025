import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageSquare, 
  Send, 
  Users, 
  CheckCircle, 
  Clock,
  TrendingUp,
  Mail,
  Calendar
} from "lucide-react";

interface FeedbackStats {
  totalSent: number;
  completed: number;
  completionRate: number;
  totalBetaTesters: number;
}

interface FeedbackCampaign {
  id: string;
  title: string;
  monthYear: string;
  emailSentAt: string | null;
  dueDate: string;
}

interface FeedbackAnalytics {
  campaign: FeedbackCampaign | null;
  stats: FeedbackStats | null;
  responses: any[];
}

export default function BetaFeedbackDashboard() {
  const [analytics, setAnalytics] = useState<FeedbackAnalytics | null>(null);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Default to current month
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(currentMonth);
    loadAnalytics(currentMonth);
  }, []);

  const loadAnalytics = async (monthYear?: string) => {
    setIsLoading(true);
    try {
      const url = monthYear 
        ? `/api/admin/beta-feedback/analytics?monthYear=${monthYear}`
        : '/api/admin/beta-feedback/analytics';
      const response = await apiRequest("GET", url);
      const data = await response.json();
      setAnalytics(data);
    } catch (error: any) {
      console.error("Error loading analytics:", error);
      toast({
        title: "Error",
        description: "Failed to load feedback analytics",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMonthlyFeedback = async () => {
    setIsSending(true);
    try {
      const response = await apiRequest("POST", "/api/admin/beta-feedback/send-monthly");
      const result = await response.json();
      
      toast({
        title: "Feedback Emails Sent!",
        description: `Sent to ${result.emailsSent} beta testers`,
      });
      
      // Reload analytics
      loadAnalytics(selectedMonth);
    } catch (error: any) {
      console.error("Error sending feedback:", error);
      toast({
        title: "Error",
        description: "Failed to send monthly feedback emails",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const monthYear = e.target.value;
    setSelectedMonth(monthYear);
    if (monthYear) {
      loadAnalytics(monthYear);
    }
  };

  if (isLoading && !analytics) {
    return (
      <div className="p-6">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="feedback-dashboard-title">
            Beta Feedback Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage monthly feedback campaigns for beta testers
          </p>
        </div>
        <Button 
          onClick={sendMonthlyFeedback}
          disabled={isSending}
          data-testid="send-feedback-button"
        >
          {isSending ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Send Monthly Feedback
            </>
          )}
        </Button>
      </div>

      {/* Month selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Select Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="month-input">Month & Year</Label>
              <Input
                id="month-input"
                type="month"
                value={selectedMonth}
                onChange={handleMonthChange}
                data-testid="month-selector"
              />
            </div>
            <Button 
              onClick={() => loadAnalytics(selectedMonth)}
              variant="outline"
              data-testid="load-analytics"
            >
              Load Analytics
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      {analytics?.stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Beta Testers</p>
                  <p className="text-2xl font-bold" data-testid="total-testers">
                    {analytics.stats.totalBetaTesters}
                  </p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Emails Sent</p>
                  <p className="text-2xl font-bold" data-testid="emails-sent">
                    {analytics.stats.totalSent}
                  </p>
                </div>
                <Mail className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Responses</p>
                  <p className="text-2xl font-bold" data-testid="responses-count">
                    {analytics.stats.completed}
                  </p>
                </div>
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                  <p className="text-2xl font-bold" data-testid="completion-rate">
                    {analytics.stats.completionRate.toFixed(1)}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Campaign Status */}
      {analytics?.campaign && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Campaign Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold" data-testid="campaign-title">
                    {analytics.campaign.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Due: {new Date(analytics.campaign.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {analytics.campaign.emailSentAt ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Sent
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <Clock className="w-3 h-3 mr-1" />
                      Pending
                    </Badge>
                  )}
                </div>
              </div>
              
              {analytics.campaign.emailSentAt && (
                <p className="text-sm text-muted-foreground">
                  Emails sent on: {new Date(analytics.campaign.emailSentAt).toLocaleString()}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Responses */}
      {analytics?.responses && analytics.responses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Responses</CardTitle>
            <CardDescription>
              Latest feedback submissions from beta testers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.responses.slice(0, 5).map((response, index) => (
                <div key={index} className="border-b last:border-b-0 pb-4 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">
                      {response.userName || 'Anonymous'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(response.completedAt).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {response.userEmail}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Data State */}
      {analytics && !analytics.campaign && !analytics.stats && (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Campaign Found</h3>
            <p className="text-muted-foreground mb-4">
              No feedback campaign exists for the selected month.
            </p>
            <Button onClick={sendMonthlyFeedback} disabled={isSending}>
              Create & Send Campaign
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}