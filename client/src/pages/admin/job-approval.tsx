import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Building2, 
  MapPin, 
  DollarSign,
  Mail,
  Calendar,
  Eye,
  AlertTriangle
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Job } from "@/../../shared/schema";

export default function JobApproval() {
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pendingJobs = [], isLoading } = useQuery<Job[]>({
    queryKey: ["/api/admin/jobs/pending"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const approveJobMutation = useMutation({
    mutationFn: (jobId: string) => 
      apiRequest("PUT", `/api/admin/jobs/${jobId}/approve`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/jobs/pending"] });
      toast({
        title: "Job Approved",
        description: "The job posting has been approved and is now live.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Approval Failed",
        description: error.message || "Failed to approve job",
        variant: "destructive",
      });
    },
  });

  const rejectJobMutation = useMutation({
    mutationFn: ({ jobId, reason }: { jobId: string; reason: string }) => 
      apiRequest("PUT", `/api/admin/jobs/${jobId}/reject`, { rejectionReason: reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/jobs/pending"] });
      setShowRejectModal(false);
      setRejectionReason("");
      setSelectedJobId("");
      toast({
        title: "Job Rejected",
        description: "The job posting has been rejected and the employer has been notified.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Rejection Failed",
        description: error.message || "Failed to reject job",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (jobId: string) => {
    approveJobMutation.mutate(jobId);
  };

  const handleReject = (jobId: string) => {
    setSelectedJobId(jobId);
    setShowRejectModal(true);
  };

  const submitRejection = () => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejecting this job posting.",
        variant: "destructive",
      });
      return;
    }
    rejectJobMutation.mutate({ jobId: selectedJobId, reason: rejectionReason });
  };

  const formatSalary = (min?: string, max?: string) => {
    if (!min && !max) return "Salary not specified";
    if (min && max) return `$${min} - $${max}/hour`;
    if (min) return `From $${min}/hour`;
    if (max) return `Up to $${max}/hour`;
  };

  const formatJobType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
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
              <h1 className="text-3xl font-bold" data-testid="admin-title">
                Job Approval Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Review and approve job postings from employers
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="text-sm">
                <Clock className="w-4 h-4 mr-2" />
                {pendingJobs.length} Pending
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {pendingJobs.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">All Caught Up!</h3>
              <p className="text-muted-foreground">
                There are no pending job postings to review at this time.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {pendingJobs.map((job) => (
              <Card key={job.id} className="relative" data-testid={`job-card-${job.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <CardTitle className="text-xl">{job.title}</CardTitle>
                        <Badge variant="outline" className="text-xs">
                          {formatJobType(job.type)}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Building2 className="w-4 h-4" />
                          <span>{job.company}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{job.location}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <DollarSign className="w-4 h-4" />
                          <span>{formatSalary(job.salaryMin, job.salaryMax)}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      <Clock className="w-3 h-3 mr-1" />
                      Pending Review
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <Tabs defaultValue="details" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="details">Job Details</TabsTrigger>
                      <TabsTrigger value="requirements">Requirements</TabsTrigger>
                      <TabsTrigger value="employer">Employer Info</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="details" className="space-y-4 mt-4">
                      <div>
                        <h4 className="font-medium mb-2">Job Description</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">
                          {job.description}
                        </p>
                      </div>
                      {job.benefits && (
                        <div>
                          <h4 className="font-medium mb-2">Benefits</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {(job.benefits || []).map((benefit, index) => (
                              <li key={index}>• {benefit}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="requirements" className="space-y-4 mt-4">
                      <div>
                        <h4 className="font-medium mb-2">Requirements</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {(job.requirements || []).map((req, index) => (
                            <li key={index}>• {req}</li>
                          ))}
                        </ul>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="employer" className="space-y-4 mt-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Contact Information</h4>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-2">
                              <Mail className="w-4 h-4" />
                              <span>{job.contactEmail}</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Posting Date</h4>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>{job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Unknown'}</span>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => handleReject(job.id)}
                      disabled={rejectJobMutation.isPending}
                      data-testid={`button-reject-${job.id}`}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleApprove(job.id)}
                      disabled={approveJobMutation.isPending}
                      data-testid={`button-approve-${job.id}`}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {approveJobMutation.isPending ? "Approving..." : "Approve & Publish"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" data-testid="reject-modal">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  <span>Reject Job Posting</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Please provide a reason for rejecting this job posting. This will be sent to the employer.
                </p>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Reason for rejection..."
                  rows={4}
                  data-testid="input-rejection-reason"
                />
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRejectModal(false);
                      setRejectionReason("");
                      setSelectedJobId("");
                    }}
                    className="flex-1"
                    data-testid="button-cancel-reject"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={submitRejection}
                    disabled={rejectJobMutation.isPending || !rejectionReason.trim()}
                    className="flex-1"
                    data-testid="button-confirm-reject"
                  >
                    {rejectJobMutation.isPending ? "Rejecting..." : "Reject Job"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}