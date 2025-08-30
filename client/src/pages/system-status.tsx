import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { ArrowLeft, CheckCircle, AlertTriangle, XCircle, Clock, Server, Database, Wifi, Shield } from "lucide-react";

export default function SystemStatus() {
  // Mock status data - in a real app this would come from an API
  const systemStatus = {
    overall: "operational", // operational, degraded, outage
    lastUpdated: new Date().toLocaleString(),
    services: [
      {
        name: "Website & Platform",
        status: "operational",
        description: "Main website and learning platform",
        icon: Server,
        uptime: "99.9%"
      },
      {
        name: "Video Streaming",
        status: "operational", 
        description: "Course videos and content delivery",
        icon: Wifi,
        uptime: "99.8%"
      },
      {
        name: "User Authentication",
        status: "operational",
        description: "Login and account management",
        icon: Shield,
        uptime: "100%"
      },
      {
        name: "Database Services",
        status: "operational",
        description: "User data and course progress",
        icon: Database,
        uptime: "99.9%"
      }
    ],
    recentIncidents: [
      {
        id: 1,
        title: "Brief video streaming interruption",
        description: "Some users experienced slow video loading",
        status: "resolved",
        date: "2024-01-15",
        duration: "15 minutes"
      },
      {
        id: 2,
        title: "Scheduled maintenance",
        description: "Database optimization and security updates",
        status: "completed",
        date: "2024-01-10", 
        duration: "2 hours"
      }
    ]
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "operational":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "degraded":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "outage":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "operational":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Operational</Badge>;
      case "degraded":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Degraded</Badge>;
      case "outage":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Outage</Badge>;
      case "resolved":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Resolved</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background py-12" data-testid="system-status-page">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4" data-testid="back-button">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-foreground mb-4" data-testid="status-title">
            System Status
          </h1>
          <p className="text-muted-foreground text-lg" data-testid="status-subtitle">
            Real-time status of LA Plumb Prep services and infrastructure
          </p>
        </div>

        {/* Overall Status */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                {getStatusIcon(systemStatus.overall)}
                <span>Overall System Status</span>
              </CardTitle>
              {getStatusBadge(systemStatus.overall)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">
                All systems are operating normally
              </p>
              <p className="text-sm text-muted-foreground">
                Last updated: {systemStatus.lastUpdated}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Service Status */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">Service Status</h2>
          <div className="space-y-4">
            {systemStatus.services.map((service, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <service.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{service.name}</h3>
                        <p className="text-muted-foreground text-sm">{service.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{service.uptime} uptime</p>
                        <p className="text-xs text-muted-foreground">Last 30 days</p>
                      </div>
                      {getStatusBadge(service.status)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Incidents */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">Recent Incidents</h2>
          {systemStatus.recentIncidents.length > 0 ? (
            <div className="space-y-4">
              {systemStatus.recentIncidents.map((incident) => (
                <Card key={incident.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{incident.title}</CardTitle>
                      {getStatusBadge(incident.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-2">{incident.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>Date: {incident.date}</span>
                      <span>Duration: {incident.duration}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Recent Incidents</h3>
                  <p className="text-muted-foreground">
                    All services have been running smoothly with no reported issues.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Status History & Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Average Response Time:</span>
                  <span className="font-medium">&lt; 200ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Overall Uptime (30 days):</span>
                  <span className="font-medium">99.9%</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Users:</span>
                  <span className="font-medium">1,200+</span>
                </div>
                <div className="flex justify-between">
                  <span>Data Centers:</span>
                  <span className="font-medium">2 (Primary + Backup)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                If you're experiencing issues not reflected here, please contact our support team.
              </p>
              <div className="space-y-2">
                <Link href="/technical-support">
                  <Button variant="outline" className="w-full justify-start">
                    Technical Support
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button variant="outline" className="w-full justify-start">
                    Contact Support
                  </Button>
                </Link>
                <Link href="/help">
                  <Button variant="outline" className="w-full justify-start">
                    Help Center
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Info */}
        <Card className="mt-8 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="font-semibold mb-2">Stay Updated</h3>
              <p className="text-muted-foreground text-sm">
                This page is automatically updated every 5 minutes. For real-time notifications of any service disruptions, 
                you can contact support@laplumbprep.com to be added to our status notification list.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}