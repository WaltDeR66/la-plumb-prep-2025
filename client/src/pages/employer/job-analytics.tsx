import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  Eye, 
  Download, 
  Mail, 
  Calendar,
  TrendingUp,
  FileText,
  Clock,
  CheckCircle,
  UserCheck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Job, JobApplication } from "@/../../shared/schema";

interface JobWithApplications extends Job {
  applications: (JobApplication & {
    user: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
    };
  })[];
}

export default function JobAnalytics() {
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const { toast } = useToast();

  // This would typically require authentication to get employer's jobs
  const { data: employerJobs = [], isLoading } = useQuery<JobWithApplications[]>({
    queryKey: ["/api/employer/jobs"],
    enabled: false, // Disable for now since we need employer auth
  });

  const selectedJob = employerJobs.find(job => job.id === selectedJobId);

  const getApplicationStats = (applications: JobApplication[]) => {
    const total = applications.length;
    const pending = applications.filter(app => app.status === "pending").length;
    const reviewed = applications.filter(app => app.status === "reviewed").length;
    const hired = applications.filter(app => app.status === "hired").length;
    
    return { total, pending, reviewed, hired };
  };

  const handleDownloadResume = (resumeUrl: string, applicantName: string) => {
    if (!resumeUrl) {
      toast({
        title: "No Resume Available",
        description: "This applicant hasn't uploaded a resume yet.",
        variant: "destructive",
      });
      return;
    }
    
    // Create download link
    const link = document.createElement('a');
    link.href = resumeUrl;
    link.download = `${applicantName.replace(/\s+/g, '_')}_resume.pdf`;
    link.click();
    
    toast({
      title: "Resume Downloaded",
      description: `Downloaded resume for ${applicantName}`,
    });
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Unknown";
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold" data-testid="analytics-title">
                Job Application Analytics
              </h1>
              <p className="text-muted-foreground mt-1">
                Track applications and download resumes from apprentice plumbers
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {employerJobs.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Job Postings Yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first job posting to start receiving applications from apprentice plumbers.
              </p>
              <Button onClick={() => window.location.href = "/employer-portal"}>
                Post Your First Job
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Job Selector */}
            <Card>
              <CardHeader>
                <CardTitle>Select Job Posting</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                  <SelectTrigger className="w-full max-w-md">
                    <SelectValue placeholder="Choose a job posting to view analytics" />
                  </SelectTrigger>
                  <SelectContent>
                    {employerJobs.map((job) => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.title} - {job.applications.length} applications
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {selectedJob && (
              <div className="space-y-6">
                {/* Analytics Overview */}
                <div className="grid md:grid-cols-4 gap-6">
                  {(() => {
                    const stats = getApplicationStats(selectedJob.applications);
                    return (
                      <>
                        <Card>
                          <CardContent className="p-6">
                            <div className="flex items-center space-x-2">
                              <Users className="w-8 h-8 text-blue-500" />
                              <div>
                                <p className="text-2xl font-bold">{stats.total}</p>
                                <p className="text-sm text-muted-foreground">Total Applications</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="p-6">
                            <div className="flex items-center space-x-2">
                              <Clock className="w-8 h-8 text-orange-500" />
                              <div>
                                <p className="text-2xl font-bold">{stats.pending}</p>
                                <p className="text-sm text-muted-foreground">Pending Review</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="p-6">
                            <div className="flex items-center space-x-2">
                              <Eye className="w-8 h-8 text-blue-500" />
                              <div>
                                <p className="text-2xl font-bold">{stats.reviewed}</p>
                                <p className="text-sm text-muted-foreground">Reviewed</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardContent className="p-6">
                            <div className="flex items-center space-x-2">
                              <UserCheck className="w-8 h-8 text-green-500" />
                              <div>
                                <p className="text-2xl font-bold">{stats.hired}</p>
                                <p className="text-sm text-muted-foreground">Hired</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </>
                    );
                  })()}
                </div>

                {/* Applications List */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="w-5 h-5" />
                      <span>Applications for: {selectedJob.title}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedJob.applications.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No applications yet for this job posting.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {selectedJob.applications.map((application) => (
                          <div 
                            key={application.id} 
                            className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                            data-testid={`application-${application.id}`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="space-y-2 flex-1">
                                <div className="flex items-center space-x-3">
                                  <h4 className="font-semibold text-lg">
                                    {application.user.firstName} {application.user.lastName}
                                  </h4>
                                  <Badge 
                                    variant={
                                      application.status === 'hired' ? 'default' :
                                      application.status === 'reviewed' ? 'secondary' :
                                      'outline'
                                    }
                                  >
                                    {application.status}
                                  </Badge>
                                </div>
                                
                                <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center space-x-2">
                                    <Mail className="w-4 h-4" />
                                    <span>{application.user.email}</span>
                                  </div>
                                  {application.user.phone && (
                                    <div className="flex items-center space-x-2">
                                      <span>📞</span>
                                      <span>{application.user.phone}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center space-x-2">
                                    <Calendar className="w-4 h-4" />
                                    <span>Applied: {formatDate(application.appliedAt)}</span>
                                  </div>
                                </div>

                                {application.coverLetter && (
                                  <div className="mt-3">
                                    <p className="text-sm font-medium mb-1">Cover Letter:</p>
                                    <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
                                      {application.coverLetter}
                                    </p>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex flex-col space-y-2 ml-4">
                                {application.resumeUrl ? (
                                  <Button
                                    size="sm"
                                    onClick={() => handleDownloadResume(
                                      application.resumeUrl!, 
                                      `${application.user.firstName}_${application.user.lastName}`
                                    )}
                                    data-testid={`download-resume-${application.id}`}
                                  >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download Resume
                                  </Button>
                                ) : (
                                  <Badge variant="outline" className="text-xs">
                                    No Resume
                                  </Badge>
                                )}
                                
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.location.href = `mailto:${application.user.email}?subject=Re: ${selectedJob.title} Application`}
                                  data-testid={`contact-applicant-${application.id}`}
                                >
                                  <Mail className="w-4 h-4 mr-2" />
                                  Contact
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}