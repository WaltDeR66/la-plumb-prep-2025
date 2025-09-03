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
import { Building2, MapPin, DollarSign, Clock, CheckCircle, Mail, Phone, BarChart3, Edit, Star, RefreshCw, Settings } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const employerSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  contactName: z.string().min(2, "Contact name is required"),
  contactEmail: z.string().email("Valid email is required"),
  contactPhone: z.string().optional(),
  companyWebsite: z.string().optional().refine((val) => {
    if (!val || val === "") return true;
    const urlPattern = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})+(\S*)?$/;
    return urlPattern.test(val);
  }, "Please enter a valid website URL"),
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
  const [step, setStep] = useState<'pricing' | 'employer' | 'job' | 'payment' | 'success'>('pricing');
  const [employerId, setEmployerId] = useState<string>("");
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'premium'>('basic');
  const [quantity, setQuantity] = useState<number>(1);
  const [clientSecret, setClientSecret] = useState<string>("");
  const [paymentData, setPaymentData] = useState<any>(null);
  const { toast } = useToast();

  // Bulk pricing logic with progressive discounts
  const calculatePricing = (basePrice: number, qty: number) => {
    let discount = 0;
    if (qty >= 10) discount = 0.25; // 25% off for 10+
    else if (qty >= 5) discount = 0.15; // 15% off for 5+
    else if (qty >= 3) discount = 0.10; // 10% off for 3+
    
    const unitPrice = basePrice * (1 - discount);
    const totalPrice = unitPrice * qty;
    const totalSavings = (basePrice * qty) - totalPrice;
    
    return { unitPrice, totalPrice, totalSavings, discount };
  };

  const basicPrice = 49;
  const premiumPrice = 89;
  
  const basicPricing = calculatePricing(basicPrice, quantity);
  const premiumPricing = calculatePricing(premiumPrice, quantity);

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

  const createPaymentIntentMutation = useMutation({
    mutationFn: ({ quantity, planType }: { quantity: number; planType: string }) => 
      apiRequest("POST", "/api/employers/payment-intent", { quantity, planType }),
    onSuccess: (response: any) => {
      setClientSecret(response.clientSecret);
      setPaymentData(response);
      setStep('payment');
      toast({
        title: "Payment Ready",
        description: "Please complete your payment to post your job(s).",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Payment Error",
        description: error.message || "Failed to create payment",
        variant: "destructive",
      });
    },
  });

  const createJobMutation = useMutation({
    mutationFn: (data: JobData & { 
      requirements: string[]; 
      benefits?: string[]; 
      planType: 'basic' | 'premium';
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      discount: number;
    }) => 
      apiRequest("POST", `/api/employers/${employerId}/jobs`, data),
    onSuccess: () => {
      setStep('success');
      toast({
        title: "Job Posted Successfully",
        description: `Your ${quantity} job posting${quantity > 1 ? 's have' : ' has'} been submitted for review.`,
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
    // Store job data for after payment
    const pricing = selectedPlan === 'basic' ? basicPricing : premiumPricing;
    const processedData = {
      ...data,
      requirements: data.requirements,
      benefits: data.benefits,
      planType: selectedPlan,
      quantity: quantity,
      unitPrice: pricing.unitPrice,
      totalPrice: pricing.totalPrice,
      discount: pricing.discount,
    };
    
    // Store job data in state for after payment
    setPaymentData({ ...paymentData, jobData: processedData });
    
    // Create payment intent first
    createPaymentIntentMutation.mutate({ 
      quantity, 
      planType: selectedPlan 
    });
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
                Your {quantity} {selectedPlan} job posting{quantity > 1 ? 's have' : ' has'} been submitted and {quantity > 1 ? 'are' : 'is'} pending review by our team. 
                We'll notify you via email once {quantity > 1 ? 'they\'re' : 'it\'s'} approved and live on our platform.
              </p>
              
              {/* Pricing Summary */}
              <div className="bg-gray-50 rounded-lg p-6 mb-8 max-w-2xl mx-auto">
                <h3 className="font-semibold mb-4">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>{quantity}x {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} Job Post{quantity > 1 ? 's' : ''}</span>
                    <span>${((selectedPlan === 'basic' ? basicPrice : premiumPrice) * quantity).toFixed(2)}</span>
                  </div>
                  {(selectedPlan === 'basic' ? basicPricing : premiumPricing).discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Volume Discount ({Math.round((selectedPlan === 'basic' ? basicPricing : premiumPricing).discount * 100)}% off)</span>
                      <span>-${(selectedPlan === 'basic' ? basicPricing : premiumPricing).totalSavings.toFixed(2)}</span>
                    </div>
                  )}
                  <hr className="my-2" />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>${(selectedPlan === 'basic' ? basicPricing : premiumPricing).totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
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
                  onClick={() => window.location.href = "/employer/dashboard"} 
                  data-testid="manage-jobs"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Edit className="w-5 h-5 mr-2" />
                  Manage Job Listings
                </Button>
                <Button 
                  size="lg" 
                  onClick={() => window.location.href = "/employer/analytics"} 
                  data-testid="view-analytics"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <BarChart3 className="w-5 h-5 mr-2" />
                  View Analytics
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
            Hire Certified Louisiana Plumbers
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
            Connect with certified plumbers, journeymen, apprentices, and plumbing professionals across Louisiana. 
            Access a comprehensive database of qualified candidates and get detailed analytics on all applications.
          </p>
          <div className="flex items-center justify-center space-x-8 text-blue-100">
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5" />
              <span>Certified Professionals</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5" />
              <span>All Skill Levels</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>Application Analytics</span>
            </div>
          </div>
        </div>
      </section>

      {/* Unique Selling Point */}
      <section className="py-12 bg-gradient-to-r from-blue-50 to-green-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <Star className="w-4 h-4 mr-2" />
              EXCLUSIVE FEATURE - No Other Job Board Offers This
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              The Only Job Board That Adapts With Your Business
            </h2>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto mb-8">
              <strong>Pay once, post smart.</strong> Unlike Indeed, LinkedIn, or ZipRecruiter, you can completely modify your listings without additional fees.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-blue-100 shadow-lg">
              <div className="flex items-center mb-4">
                <Edit className="text-blue-600 w-8 h-8 mr-3" />
                <h3 className="font-bold text-lg">Change Position Types</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Switch from "Master Plumber Needed" to "Journeyman Plumber" based on budget or application response
              </p>
              <div className="text-sm text-blue-600 font-medium">
                ✓ No extra payment required
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 border border-green-100 shadow-lg">
              <div className="flex items-center mb-4">
                <RefreshCw className="text-green-600 w-8 h-8 mr-3" />
                <h3 className="font-bold text-lg">Pause & Reactivate</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Stop applications while interviewing candidates, then reactivate when you need more applicants
              </p>
              <div className="text-sm text-green-600 font-medium">
                ✓ Preserve your original posting
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 border border-purple-100 shadow-lg">
              <div className="flex items-center mb-4">
                <Settings className="text-purple-600 w-8 h-8 mr-3" />
                <h3 className="font-bold text-lg">Update Everything</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Modify salary ranges, requirements, location, or job description based on market response
              </p>
              <div className="text-sm text-purple-600 font-medium">
                ✓ Unlimited edits included
              </div>
            </div>
          </div>
          
          <div className="text-center mt-8">
            <p className="text-sm text-gray-600">
              <strong>Why we're different:</strong> Other platforms charge you again for every change. We believe you should get full value from your investment.
            </p>
          </div>
        </div>
      </section>

      {/* Progress Steps */}
      <section className="py-8 bg-white border-b">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-center space-x-2">
            <div className={`flex items-center space-x-2 ${step === 'pricing' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step === 'pricing' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                1
              </div>
              <span className="font-medium hidden sm:block">Pricing</span>
            </div>
            <div className="w-8 h-px bg-muted"></div>
            <div className={`flex items-center space-x-2 ${step === 'employer' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step === 'employer' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                2
              </div>
              <span className="font-medium hidden sm:block">Company Info</span>
            </div>
            <div className="w-8 h-px bg-muted"></div>
            <div className={`flex items-center space-x-2 ${step === 'job' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step === 'job' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                3
              </div>
              <span className="font-medium hidden sm:block">Job Details</span>
            </div>
            <div className="w-8 h-px bg-muted"></div>
            <div className={`flex items-center space-x-2 ${step === 'success' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step === 'success' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                4
              </div>
              <span className="font-medium hidden sm:block">Complete</span>
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
                      {registerEmployerMutation.isPending ? "Registering..." : "Continue to Pricing"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {step === 'pricing' && (
            <Card data-testid="pricing-form">
              <CardHeader>
                <CardTitle className="flex items-center justify-center space-x-2">
                  <BarChart3 className="w-6 h-6" />
                  <span>Job Posting Plans</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Quantity Selector */}
                <div className="mb-8 text-center">
                  <h3 className="text-lg font-semibold mb-4">How many job postings do you need?</h3>
                  <div className="flex items-center justify-center space-x-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      data-testid="quantity-decrease"
                    >
                      -
                    </Button>
                    <div className="w-16 text-center">
                      <Input 
                        type="number" 
                        value={quantity} 
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="text-center"
                        min="1"
                        data-testid="quantity-input"
                      />
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setQuantity(quantity + 1)}
                      data-testid="quantity-increase"
                    >
                      +
                    </Button>
                  </div>
                  {quantity >= 3 && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-700 font-medium">
                        🎉 Bulk Discount Applied! 
                        {quantity >= 10 ? " Save 25%" : quantity >= 5 ? " Save 15%" : " Save 10%"}
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  {/* Basic Job Posting */}
                  <Card className={`border-2 hover:border-primary transition-colors cursor-pointer ${
                    selectedPlan === 'basic' ? 'border-primary bg-primary/5' : ''
                  }`}>
                    <CardContent className="p-6">
                      <div className="text-center mb-6">
                        <h3 className="text-2xl font-bold">Basic Job Post</h3>
                        <div className="space-y-2">
                          {basicPricing.discount > 0 && (
                            <div className="text-lg text-muted-foreground line-through">
                              ${(basicPrice * quantity).toFixed(2)}
                            </div>
                          )}
                          <div className="text-3xl font-bold text-primary">
                            ${basicPricing.totalPrice.toFixed(2)}
                          </div>
                          <p className="text-muted-foreground">
                            ${basicPricing.unitPrice.toFixed(2)} per 60-day listing
                          </p>
                          {basicPricing.totalSavings > 0 && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              Save ${basicPricing.totalSavings.toFixed(2)}!
                            </Badge>
                          )}
                        </div>
                      </div>
                      <ul className="space-y-3 mb-6">
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span>60-day active job listing</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span>Receive student applications</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span>Basic application analytics</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span>Email notifications</span>
                        </li>
                      </ul>
                      <Button 
                        className="w-full bg-primary hover:bg-primary/90 text-white" 
                        onClick={() => {
                          setSelectedPlan('basic');
                          setStep('employer');
                        }}
                        data-testid="select-basic-plan"
                      >
                        Select Basic Plan
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Premium Job Posting */}
                  <Card className={`border-2 hover:border-primary transition-colors cursor-pointer ${
                    selectedPlan === 'premium' ? 'border-primary bg-primary/5' : ''
                  }`}>
                    <CardContent className="p-6">
                      <div className="text-center mb-6">
                        <Badge className="mb-2">Most Popular</Badge>
                        <h3 className="text-2xl font-bold">Premium Job Post</h3>
                        <div className="space-y-2">
                          {premiumPricing.discount > 0 && (
                            <div className="text-lg text-muted-foreground line-through">
                              ${(premiumPrice * quantity).toFixed(2)}
                            </div>
                          )}
                          <div className="text-3xl font-bold text-primary">
                            ${premiumPricing.totalPrice.toFixed(2)}
                          </div>
                          <p className="text-muted-foreground">
                            ${premiumPricing.unitPrice.toFixed(2)} per 120-day listing
                          </p>
                          {premiumPricing.totalSavings > 0 && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              Save ${premiumPricing.totalSavings.toFixed(2)}!
                            </Badge>
                          )}
                        </div>
                      </div>
                      <ul className="space-y-3 mb-6">
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span>120-day active job listing</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span>Priority placement in job board</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span>Advanced application analytics</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span>Resume download & management</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span>Direct student messaging</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span>Priority support</span>
                        </li>
                      </ul>
                      <Button 
                        className="w-full bg-primary hover:bg-primary/90" 
                        onClick={() => {
                          setSelectedPlan('premium');
                          setStep('employer');
                        }}
                        data-testid="select-premium-plan"
                      >
                        Select Premium Plan
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Bulk Discount Information */}
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">💰 Volume Discounts Available</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-blue-700">
                    <div>📦 3-4 postings: <strong>10% off</strong></div>
                    <div>📦 5-9 postings: <strong>15% off</strong></div>
                    <div>📦 10+ postings: <strong>25% off</strong></div>
                  </div>
                </div>

                <div className="text-center text-sm text-muted-foreground">
                  <p>All plans include access to apprentice plumbers actively enrolled in Louisiana Plumbing Code training.</p>
                  <p className="mt-2">Payment will be processed after job posting approval.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 'job' && (
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Job Form */}
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

            {/* Live Preview */}
            <div className="lg:sticky lg:top-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="w-6 h-6" />
                    <span>Preview - How Students See Your Job</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Job Card Preview */}
                  <div className="border rounded-lg p-6 bg-card hover:bg-accent/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">
                          {jobForm.watch("title") || "Job Title"}
                        </h3>
                        <p className="text-muted-foreground mb-2">
                          {employerForm.getValues("companyName") || "Company Name"}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-4">
                          <span className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{jobForm.watch("location") || "Location"}</span>
                          </span>
                          <span className="capitalize">
                            {jobForm.watch("type")?.replace("_", "-") || "Job Type"}
                          </span>
                          {(jobForm.watch("salaryMin") || jobForm.watch("salaryMax")) && (
                            <span className="flex items-center space-x-1">
                              <DollarSign className="w-4 h-4" />
                              <span>
                                {jobForm.watch("salaryMin") && `$${jobForm.watch("salaryMin")}`}
                                {jobForm.watch("salaryMin") && jobForm.watch("salaryMax") && "-"}
                                {jobForm.watch("salaryMax") && `$${jobForm.watch("salaryMax")}`}
                                /hr
                              </span>
                            </span>
                          )}
                        </div>
                        <p className="text-sm line-clamp-3">
                          {jobForm.watch("description") || "Job description will appear here..."}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <Button className="w-full" disabled>
                        Apply Now
                      </Button>
                    </div>
                  </div>

                  {/* Full Job Detail Preview */}
                  <div className="mt-6 p-4 border rounded-lg bg-muted/50">
                    <h4 className="font-semibold mb-3">Full Job Details Preview</h4>
                    
                    {jobForm.watch("description") && (
                      <div className="mb-4">
                        <h5 className="font-medium mb-2">Description</h5>
                        <p className="text-sm whitespace-pre-wrap">
                          {jobForm.watch("description")}
                        </p>
                      </div>
                    )}

                    {jobForm.watch("requirements") && (
                      <div className="mb-4">
                        <h5 className="font-medium mb-2">Requirements</h5>
                        <ul className="text-sm space-y-1">
                          {jobForm.watch("requirements").split('\n').filter(req => req.trim()).map((req, idx) => (
                            <li key={idx} className="flex items-start space-x-2">
                              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{req.trim()}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {jobForm.watch("benefits") && (
                      <div className="mb-4">
                        <h5 className="font-medium mb-2">Benefits</h5>
                        <ul className="text-sm space-y-1">
                          {jobForm.watch("benefits").split('\n').filter(benefit => benefit.trim()).map((benefit, idx) => (
                            <li key={idx} className="flex items-start space-x-2">
                              <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                              <span>{benefit.trim()}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          )}
        </div>
      </section>
    </div>
  );
}