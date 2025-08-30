import { useState } from "react";
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
import { Building2, MapPin, DollarSign, Clock, CheckCircle, Mail, Phone, BarChart3 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const employerSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  contactName: z.string().min(2, "Contact name is required"),
  contactEmail: z.string().email("Valid email is required"),
  contactPhone: z.string().optional(),
  companyWebsite: z.string().url().optional().or(z.literal("")),
  companyDescription: z.string().min(10, "Please provide a brief company description"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  zipCode: z.string().min(5, "Valid ZIP code is required"),
});

const jobSchema = z.object({
  title: z.string().min(3, "Job title is required"),
  description: z.string().min(50, "Please provide a detailed job description (min 50 characters)"),
  location: z.string().min(3, "Location is required"),
  type: z.enum(["full_time", "part_time", "contract", "temporary"]),
  salaryMin: z.string().optional(),
  salaryMax: z.string().optional(),
  requirements: z.string().min(10, "Please list job requirements"),
  benefits: z.string().optional(),
});

type EmployerData = z.infer<typeof employerSchema>;
type JobData = z.infer<typeof jobSchema>;

export default function EmployerPortal() {
  const [step, setStep] = useState<'employer' | 'job' | 'success'>('employer');
  const [employerId, setEmployerId] = useState<string>("");
  const { toast } = useToast();

  const employerForm = useForm<EmployerData>({
    resolver: zodResolver(employerSchema),
    defaultValues: {
      state: "Louisiana",
    },
  });

  const jobForm = useForm<JobData>({
    resolver: zodResolver(jobSchema),
  });

  const registerEmployerMutation = useMutation({
    mutationFn: (data: EmployerData) => 
      apiRequest("POST", "/api/employers/register", data),
    onSuccess: (response) => {
      setEmployerId(response.employerId);
      setStep('job');
      toast({
        title: "Registration Successful",
        description: "Your company has been registered. Now let's create your job posting.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register company",
        variant: "destructive",
      });
    },
  });

  const createJobMutation = useMutation({
    mutationFn: (data: JobData & { requirements: string[]; benefits?: string[] }) => 
      apiRequest("POST", `/api/employers/${employerId}/jobs`, data),
    onSuccess: () => {
      setStep('success');
      toast({
        title: "Job Posted Successfully",
        description: "Your job posting has been submitted for review.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Job Posting Failed",
        description: error.message || "Failed to create job posting",
        variant: "destructive",
      });
    },
  });

  const onSubmitEmployer = (data: EmployerData) => {
    registerEmployerMutation.mutate(data);
  };

  const onSubmitJob = (data: JobData) => {
    const processedData = {
      ...data,
      requirements: data.requirements.split('\n').filter(req => req.trim()),
      benefits: data.benefits ? data.benefits.split('\n').filter(benefit => benefit.trim()) : undefined,
    };
    createJobMutation.mutate(processedData);
  };

  const formatJobType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <Card className="text-center">
            <CardContent className="pt-12 pb-16">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
              <h1 className="text-3xl font-bold mb-4" data-testid="success-title">
                Job Posted Successfully!
              </h1>
              <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
                Your job posting has been submitted and is pending review by our team. 
                We'll notify you via email once it's approved and live on our platform.
              </p>
              <div className="bg-blue-50 rounded-lg p-6 mb-8 max-w-2xl mx-auto">
                <h3 className="font-semibold mb-2">What happens next?</h3>
                <ul className="text-sm text-muted-foreground space-y-2 text-left">
                  <li>• Our team will review your job posting within 24-48 hours</li>
                  <li>• You'll receive an email confirmation once approved</li>
                  <li>• Your job will be visible to apprentice plumbers in our training program</li>
                  <li>• Applications will be forwarded directly to your email</li>
                  <li>• Access detailed analytics about student applications and engagement</li>
                </ul>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  onClick={() => window.location.href = "/employer/analytics"} 
                  data-testid="view-analytics"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <BarChart3 className="w-5 h-5 mr-2" />
                  View Application Analytics
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => window.location.href = "/"} 
                  data-testid="return-home"
                >
                  Return to Homepage
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="gradient-hero text-white py-16" data-testid="employer-hero">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold mb-6" data-testid="hero-title">
            Hire Apprentice Plumbers in Training
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
            Connect with qualified apprentice plumbers who are actively enrolled in our comprehensive 
            Louisiana Plumbing Code training program. Get detailed analytics on student applications to your job postings.
          </p>
          <div className="flex items-center justify-center space-x-8 text-blue-100">
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5" />
              <span>Apprentices in Training</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5" />
              <span>Louisiana Code Specialists</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>Application Analytics</span>
            </div>
          </div>
        </div>
      </section>

      {/* Progress Steps */}
      <section className="py-8 bg-white border-b">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center space-x-2 ${step === 'employer' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step === 'employer' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                1
              </div>
              <span className="font-medium">Company Info</span>
            </div>
            <div className="w-16 h-px bg-muted"></div>
            <div className={`flex items-center space-x-2 ${step === 'job' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step === 'job' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                2
              </div>
              <span className="font-medium">Job Details</span>
            </div>
            <div className="w-16 h-px bg-muted"></div>
            <div className={`flex items-center space-x-2 ${step === 'success' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step === 'success' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                3
              </div>
              <span className="font-medium">Review</span>
            </div>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          {step === 'employer' && (
            <Card data-testid="employer-form">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="w-6 h-6" />
                  <span>Company Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...employerForm}>
                  <form onSubmit={employerForm.handleSubmit(onSubmitEmployer)} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={employerForm.control}
                        name="companyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Name *</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-company-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={employerForm.control}
                        name="contactName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Person *</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-contact-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={employerForm.control}
                        name="contactEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address *</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} data-testid="input-contact-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={employerForm.control}
                        name="contactPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-contact-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={employerForm.control}
                      name="companyWebsite"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Website</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="https://" data-testid="input-company-website" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={employerForm.control}
                      name="companyDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Description *</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              rows={4}
                              placeholder="Tell us about your company..."
                              data-testid="input-company-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid md:grid-cols-3 gap-6">
                      <FormField
                        control={employerForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Address *</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-address" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={employerForm.control}
                        name="zipCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ZIP Code *</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-zip-code" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={employerForm.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City *</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-city" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={employerForm.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State</FormLabel>
                            <FormControl>
                              <Input {...field} disabled />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      size="lg" 
                      className="w-full"
                      disabled={registerEmployerMutation.isPending}
                      data-testid="button-continue-employer"
                    >
                      {registerEmployerMutation.isPending ? "Registering..." : "Continue to Job Details"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {step === 'job' && (
            <Card data-testid="job-form">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="w-6 h-6" />
                  <span>Job Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...jobForm}>
                  <form onSubmit={jobForm.handleSubmit(onSubmitJob)} className="space-y-6">
                    <FormField
                      control={jobForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Title *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., Journeyman Plumber" data-testid="input-job-title" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={jobForm.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Job Location *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., Baton Rouge, LA" data-testid="input-job-location" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={jobForm.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Employment Type *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-job-type">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="full_time">Full-time</SelectItem>
                                <SelectItem value="part_time">Part-time</SelectItem>
                                <SelectItem value="contract">Contract</SelectItem>
                                <SelectItem value="temporary">Temporary</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={jobForm.control}
                        name="salaryMin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minimum Hourly Rate ($)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" placeholder="25" data-testid="input-salary-min" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={jobForm.control}
                        name="salaryMax"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Maximum Hourly Rate ($)</FormLabel>
                            <FormControl>
                              <Input {...field} type="number" placeholder="35" data-testid="input-salary-max" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={jobForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Description *</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              rows={6}
                              placeholder="Describe the role, responsibilities, and what makes this position attractive..."
                              data-testid="input-job-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={jobForm.control}
                      name="requirements"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Requirements *</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              rows={4}
                              placeholder="List each requirement on a new line (e.g., Louisiana plumbing license, 5+ years experience, etc.)"
                              data-testid="input-job-requirements"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={jobForm.control}
                      name="benefits"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Benefits</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              rows={3}
                              placeholder="List each benefit on a new line (e.g., Health insurance, Paid time off, etc.)"
                              data-testid="input-job-benefits"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Your job posting will be reviewed by our team before going live. 
                        This ensures quality and helps maintain our platform's reputation.
                      </AlertDescription>
                    </Alert>

                    <div className="flex space-x-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setStep('employer')}
                        data-testid="button-back"
                      >
                        Back
                      </Button>
                      <Button 
                        type="submit" 
                        size="lg" 
                        className="flex-1"
                        disabled={createJobMutation.isPending}
                        data-testid="button-submit-job"
                      >
                        {createJobMutation.isPending ? "Submitting..." : "Submit Job Posting"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}