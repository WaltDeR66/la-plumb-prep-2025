import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Download, Shield, AlertTriangle, FileText, Zap } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const leadMagnetSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  position: z.string().optional(),
});

type LeadMagnetForm = z.infer<typeof leadMagnetSchema>;

export default function LeadMagnet() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const form = useForm<LeadMagnetForm>({
    resolver: zodResolver(leadMagnetSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      companyName: "",
      position: "",
    },
  });

  const onSubmit = async (data: LeadMagnetForm) => {
    setIsSubmitting(true);
    try {
      const response = await apiRequest("POST", "/api/lead-magnet/download", data);
      
      if (response.ok) {
        setIsSuccess(true);
        toast({
          title: "Success!",
          description: "Check your email for the download link and bonus materials.",
        });
      } else {
        throw new Error("Failed to process request");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send download link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl text-green-700 dark:text-green-300">Check Your Email!</CardTitle>
            <CardDescription className="text-lg">
              Your Louisiana Plumbing Code Guide is on its way, plus exclusive bonus materials.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">📧 What's Coming Next:</h3>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                <li>• Instant download link for your Louisiana Code Guide</li>
                <li>• Exclusive plumbing calculator tools (bonus)</li>
                <li>• Weekly Louisiana code updates and tips</li>
                <li>• Early access to new certification courses</li>
              </ul>
            </div>
            
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                While you're here, explore our complete certification platform:
              </p>
              <Button asChild className="bg-blue-600 hover:bg-blue-700">
                <a href="/courses">View All Courses</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 mb-4">
              🚨 FREE LOUISIANA RESOURCE
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Louisiana Plumbing Code
              <br />
              <span className="text-blue-600 dark:text-blue-400">Quick Reference Guide</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
              The essential code violations every Louisiana plumber needs to avoid. 
              <strong>Download this 15-page guide and save thousands on your next inspection.</strong>
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Benefits */}
            <div className="space-y-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  What You'll Get (FREE):
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">15-Page Louisiana Code Guide</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">Most common violations and how to avoid them</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Top 10 Costly Mistakes</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">Real violations that cost contractors $5,000+</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Shield className="w-6 h-6 text-green-600 dark:text-green-400 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">2024 Code Updates</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">Latest Louisiana-specific changes and requirements</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">BONUS: Pipe Sizing Calculator</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">Professional tool for accurate estimates (Value: $97)</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                <h3 className="font-bold text-green-800 dark:text-green-200 mb-3">
                  🎯 Perfect for Louisiana Contractors Who:
                </h3>
                <ul className="text-green-700 dark:text-green-300 space-y-2 text-sm">
                  <li>✅ Want to avoid costly code violations</li>
                  <li>✅ Need quick reference for job sites</li>
                  <li>✅ Are preparing for journeyman certification</li>
                  <li>✅ Want to stay current with 2024 changes</li>
                  <li>✅ Need professional credibility with clients</li>
                </ul>
              </div>
            </div>

            {/* Right Side - Lead Capture Form */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
              <div className="text-center mb-6">
                <Download className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Get Your FREE Guide
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Enter your details below for instant access
                </p>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="John" 
                              {...field} 
                              data-testid="input-first-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Smith" 
                              {...field} 
                              data-testid="input-last-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address *</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="john@smithplumbing.com" 
                            {...field} 
                            data-testid="input-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Smith Plumbing LLC" 
                            {...field} 
                            data-testid="input-company"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Position (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Owner, Journeyman, etc." 
                            {...field} 
                            data-testid="input-position"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 text-lg"
                    disabled={isSubmitting}
                    data-testid="button-download"
                  >
                    {isSubmitting ? "Sending..." : "🚀 Download FREE Guide Now"}
                  </Button>
                </form>
              </Form>
              
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  📧 No spam, ever. Unsubscribe with one click.<br />
                  🔒 Your email is safe and secure with us.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Social Proof Section */}
      <div className="bg-white dark:bg-gray-800 py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
              Join 500+ Louisiana Contractors Already Using Our Resources
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <div className="text-4xl mb-4">⭐⭐⭐⭐⭐</div>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  "This guide saved me $3,000 on my last inspection. Caught issues before the inspector did."
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">- Mike T., Baton Rouge</p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <div className="text-4xl mb-4">⭐⭐⭐⭐⭐</div>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  "Finally, Louisiana-specific information that actually helps. Keep it on every job site."
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">- Sarah K., New Orleans</p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <div className="text-4xl mb-4">⭐⭐⭐⭐⭐</div>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  "The bonus calculator tool alone is worth hundreds. Professional and accurate."
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">- Robert L., Lafayette</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}