import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, DollarSign, Building2, ExternalLink } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface JobCardProps {
  job: {
    id: string;
    title: string;
    company: string;
    description: string;
    location: string;
    type: string;
    salaryMin?: string;
    salaryMax?: string;
    requirements?: string[];
    benefits?: string[];
    isFeatured?: boolean;
    createdAt: string;
  };
}

export default function JobCard({ job }: JobCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const applyMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/jobs/${job.id}/apply`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-applications"] });
      toast({
        title: "Application Submitted",
        description: `Your application for ${job.title} has been submitted successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Application Failed", 
        description: error.message || "Failed to submit application",
        variant: "destructive",
      });
    },
  });

  const formatSalary = () => {
    if (job.salaryMin && job.salaryMax) {
      return `$${job.salaryMin}-${job.salaryMax}/hour`;
    }
    return "Competitive salary";
  };

  const getJobTypeColor = () => {
    switch (job.type) {
      case "full_time":
        return "bg-green-100 text-green-800";
      case "part_time":
        return "bg-blue-100 text-blue-800";
      case "contract":
        return "bg-orange-100 text-orange-800";
      case "temporary":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatJobType = () => {
    return job.type.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleApply = () => {
    applyMutation.mutate();
  };

  return (
    <Card className={`hover:shadow-lg transition-shadow ${job.isFeatured ? 'border-accent' : ''}`} data-testid={`job-card-${job.id}`}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="text-xl font-semibold text-card-foreground" data-testid={`job-title-${job.id}`}>
                    {job.title}
                  </h3>
                  {job.isFeatured && (
                    <Badge className="bg-accent text-accent-foreground">
                      Featured
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground font-medium" data-testid={`job-company-${job.id}`}>
                  {job.company}
                </p>
              </div>
            </div>
            <Button 
              onClick={handleApply}
              disabled={applyMutation.isPending}
              data-testid={`button-apply-${job.id}`}
            >
              {applyMutation.isPending ? "Applying..." : "Apply Now"}
            </Button>
          </div>

          {/* Job Details */}
          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <MapPin className="w-4 h-4" />
              <span data-testid={`job-location-${job.id}`}>{job.location}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <Badge variant="secondary" className={getJobTypeColor()}>
                {formatJobType()}
              </Badge>
            </div>
            <div className="flex items-center space-x-1">
              <DollarSign className="w-4 h-4" />
              <span data-testid={`job-salary-${job.id}`}>{formatSalary()}</span>
            </div>
          </div>

          {/* Description */}
          <p className="text-muted-foreground" data-testid={`job-description-${job.id}`}>
            {job.description}
          </p>

          {/* Requirements */}
          {job.requirements && job.requirements.length > 0 && (
            <div>
              <h4 className="font-medium text-foreground mb-2">Requirements:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {job.requirements.slice(0, 3).map((req, index) => (
                  <li key={index}>{req}</li>
                ))}
                {job.requirements.length > 3 && (
                  <li className="text-primary">+{job.requirements.length - 3} more requirements</li>
                )}
              </ul>
            </div>
          )}

          {/* Benefits */}
          {job.benefits && job.benefits.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {job.benefits.slice(0, 4).map((benefit, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {benefit}
                </Badge>
              ))}
              {job.benefits.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{job.benefits.length - 4} more
                </Badge>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t text-sm text-muted-foreground">
            <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
            <Button variant="ghost" size="sm" data-testid={`view-details-${job.id}`}>
              View Details
              <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
