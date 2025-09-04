import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Bell, Trophy, Calendar, Medal, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function DashboardNotifications() {
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000, // Check for new notifications every 30 seconds
  });

  const { data: currentCompetition } = useQuery({
    queryKey: ["/api/competitions/current"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const unreadNotifications = notifications.filter((n: any) => !n.isRead);
  const recentNotifications = notifications.slice(0, 3);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "advance_notice": return Calendar;
      case "day_of": return Trophy;
      case "results": return Medal;
      default: return Bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "advance_notice": return "text-blue-500 bg-blue-100";
      case "day_of": return "text-green-500 bg-green-100";
      case "results": return "text-purple-500 bg-purple-100";
      default: return "text-gray-500 bg-gray-100";
    }
  };

  // Special banner for live competition
  const isCompetitionLive = currentCompetition?.status === "active";
  const isCompetitionSoon = currentCompetition?.status === "upcoming";

  return (
    <div className="space-y-4">
      {/* Live Competition Banner */}
      {isCompetitionLive && (
        <Card className="border-2 border-green-500 bg-gradient-to-r from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500 rounded-full">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-green-800">🔴 LIVE: Monthly Competition</h3>
                  <p className="text-sm text-green-700">
                    {currentCompetition.title} is active now! 
                    {currentCompetition.timeLimit} minutes to complete.
                  </p>
                </div>
              </div>
              <Link href={`/competition/${currentCompetition.id}/test`}>
                <Button className="bg-green-600 hover:bg-green-700" data-testid="start-live-competition">
                  Start Now
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Competition Banner */}
      {isCompetitionSoon && (
        <Card className="border-2 border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-full">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-blue-800">Upcoming Competition</h3>
                  <p className="text-sm text-blue-700">
                    {currentCompetition.title} starts {formatDistanceToNow(new Date(currentCompetition.startDate), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <Link href="/competitions">
                <Button variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50">
                  View Details
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications Card */}
      <Card data-testid="dashboard-notifications">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Recent Notifications
              {unreadNotifications.length > 0 && (
                <Badge variant="secondary" data-testid="unread-notifications-count">
                  {unreadNotifications.length} unread
                </Badge>
              )}
            </CardTitle>
            {notifications.length > 3 && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/notifications">
                  <span className="sr-only">View all notifications</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No notifications yet</p>
              <p className="text-sm mt-1">
                You'll receive updates about competitions, achievements, and more!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentNotifications.map((notification: any) => {
                const IconComponent = getNotificationIcon(notification.notificationType);
                const iconStyles = getNotificationColor(notification.notificationType);
                
                return (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border transition-colors ${
                      !notification.isRead 
                        ? "bg-blue-50 border-blue-200" 
                        : "bg-gray-50 border-gray-200"
                    }`}
                    data-testid={`dashboard-notification-${notification.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${iconStyles}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-medium ${
                          !notification.isRead ? "text-gray-900" : "text-gray-700"
                        }`}>
                          {notification.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                      )}
                    </div>
                  </div>
                );
              })}
              
              {notifications.length > 3 && (
                <div className="pt-3 border-t">
                  <Link href="/notifications">
                    <Button variant="outline" size="sm" className="w-full">
                      View All Notifications ({notifications.length})
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}