import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  Building2, 
  MapPin, 
  Edit, 
  Pause, 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock,
  Users,
  Eye,
  AlertTriangle
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const editJobSchema = z.object({
  title: z.string().min(3, "Job title is required"),
  description: z.string().min(50, "Please provide a detailed job description (min 50 characters)"),
  location: z.string().min(3, "Location is required"),
  type: z.enum(["full_time", "part_time", "contract", "temporary"]),
  salaryMin: z.string().optional(),
  salaryMax: z.string().optional(),
  requirements: z.string().min(10, "Please list job requirements"),
  benefits: z.string().optional(),
});

type EditJobData = z.infer<typeof editJobSchema>;

interface JobListing {
  id: string;
  title: string;
  description: string;
  location: string;
  type: string;
  salaryMin?: string;
  salaryMax?: string;
  requirements: string;
  benefits?: string;
  status: 'active' | 'paused' | 'filled' | 'expired';
  planType: 'basic' | 'premium';
  daysRemaining: number;
  applicationsCount: number;
  createdAt: string;
}

export default function EmployerDashboard() {
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  // Fetch employer's job listings
  const { data: jobListings, isLoading } = useQuery({
    queryKey: ['/api/employer/jobs'],
    retry: false,
  });

  const editForm = useForm<EditJobData>({
    resolver: zodResolver(editJobSchema),
  });

  // Edit job mutation
  const editJobMutation = useMutation({
    mutationFn: (data: EditJobData) => 
      apiRequest("PUT", `/api/jobs/${selectedJob?.id}`, data),
    onSuccess: () => {
      setIsEditing(false);
      setSelectedJob(null);
      queryClient.invalidateQueries({ queryKey: ['/api/employer/jobs'] });
      toast({
        title: "Job Updated Successfully",
        description: "Your job listing has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update job listing",
        variant: "destructive",
      });
    },
  });

  // Change job status mutation
  const changeStatusMutation = useMutation({
    mutationFn: ({ jobId, status }: { jobId: string; status: string }) => 
      apiRequest("PATCH", `/api/jobs/${jobId}/status`, { status }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/employer/jobs'] });
      const statusMessages = {
        'paused': 'Job listing has been paused',
        'active': 'Job listing has been reactivated',
        'filled': 'Job listing marked as filled',
      };
      toast({
        title: "Status Updated",
        description: statusMessages[variables.status as keyof typeof statusMessages],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update job status",
        variant: "destructive",
      });
    },
  });

  const onSubmitEdit = (data: EditJobData) => {
    const processedData = {
      ...data,
      requirements: data.requirements.split('\n').filter(req => req.trim()).join('\n'),
      benefits: data.benefits ? data.benefits.split('\n').filter(benefit => benefit.trim()).join('\n') : undefined,
    };
    editJobMutation.mutate(processedData);
  };

  const handleStatusChange = (jobId: string, newStatus: string) => {
    changeStatusMutation.mutate({ jobId, status: newStatus });
  };

  const handleEditJob = (job: JobListing) => {
    setSelectedJob(job);
    setIsEditing(true);
    editForm.reset({
      title: job.title,
      description: job.description,
      location: job.location,
      type: job.type as any,
      salaryMin: job.salaryMin || "",
      salaryMax: job.salaryMax || "",
      requirements: job.requirements,
      benefits: job.benefits || "",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'paused': return 'bg-yellow-100 text-yellow-700';
      case 'filled': return 'bg-blue-100 text-blue-700';
      case 'expired': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'paused': return <Pause className="w-4 h-4" />;
      case 'filled': return <Users className="w-4 h-4" />;
      case 'expired': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold" data-testid="dashboard-title">
                Manage Job Listings
              </h1>
              <p className="text-muted-foreground mt-2">
                Update, pause, or mark your job listings as filled
              </p>
            </div>
            <Button 
              onClick={() => window.location.href = "/employer-portal"}
              data-testid="new-job-button"
            >
              <Building2 className="w-4 h-4 mr-2" />
              Post New Job
            </Button>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Job Listings Grid */}
        {!jobListings || jobListings.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16">
              <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Job Listings Yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first job listing to start hiring apprentice plumbers
              </p>
              <Button onClick={() => window.location.href = "/employer-portal"}>
                Post Your First Job
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {jobListings.map((job: JobListing) => (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold">{job.title}</h3>
                        <Badge className={getStatusColor(job.status)}>
                          {getStatusIcon(job.status)}
                          <span className="ml-1 capitalize">{job.status}</span>
                        </Badge>
                        <Badge variant="outline">
                          {job.planType.charAt(0).toUpperCase() + job.planType.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {job.location}
                        </span>
                        <span className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {job.applicationsCount} applications
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {job.daysRemaining} days left
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-muted-foreground mb-4 line-clamp-2">
                    {job.description}
                  </p>

                  {job.daysRemaining <= 7 && job.status === 'active' && (
                    <Alert className="mb-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        This listing expires in {job.daysRemaining} days. Edit to extend or mark as filled.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditJob(job)}
                      data-testid={`edit-job-${job.id}`}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit Details
                    </Button>
                    
                    {job.status === 'active' && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleStatusChange(job.id, 'paused')}
                        >
                          <Pause className="w-4 h-4 mr-1" />
                          Pause
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleStatusChange(job.id, 'filled')}
                          className="bg-green-50 hover:bg-green-100"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Mark as Filled
                        </Button>
                      </>
                    )}
                    
                    {job.status === 'paused' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleStatusChange(job.id, 'active')}
                        className="bg-blue-50 hover:bg-blue-100"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Reactivate
                      </Button>
                    )}
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.location.href = `/employer/applications/${job.id}`}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Applications
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Job Modal/Form */}
        {isEditing && selectedJob && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Edit className="w-5 h-5" />
                  <span>Edit Job Listing</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...editForm}>
                  <form onSubmit={editForm.handleSubmit(onSubmitEdit)} className="space-y-6">
                    <FormField
                      control={editForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Title *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., Journeyman Plumber" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={editForm.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="City, LA" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={editForm.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Employment Type *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="full_time">Full Time</SelectItem>
                                <SelectItem value="part_time">Part Time</SelectItem>
                                <SelectItem value="contract">Contract</SelectItem>
                                <SelectItem value="temporary">Temporary</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={editForm.control}
                        name="salaryMin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minimum Salary (optional)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="$45,000" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={editForm.control}
                        name="salaryMax"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Maximum Salary (optional)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="$65,000" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={editForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Description *</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              rows={6}
                              placeholder="Describe the position, responsibilities, and work environment..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="requirements"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Requirements *</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              rows={4}
                              placeholder="List requirements (one per line)&#10;Louisiana plumbing license required&#10;2+ years experience&#10;Reliable transportation"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="benefits"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Benefits (optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              rows={3}
                              placeholder="List benefits (one per line)&#10;Health insurance&#10;401k matching&#10;Paid time off"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex space-x-4">
                      <Button 
                        type="submit" 
                        disabled={editJobMutation.isPending}
                        className="flex-1"
                      >
                        {editJobMutation.isPending ? "Updating..." : "Update Job Listing"}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setSelectedJob(null);
                        }}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}