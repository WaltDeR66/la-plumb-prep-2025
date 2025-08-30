import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Download, Target, TrendingUp, Award, BookOpen, DollarSign } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const studentLeadMagnetSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  currentLevel: z.string().min(2, "Please specify your current level"),
  goals: z.string().optional(),
});

type StudentLeadMagnetForm = z.infer<typeof studentLeadMagnetSchema>;

export default function StudentLeadMagnet() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const form = useForm<StudentLeadMagnetForm>({
    resolver: zodResolver(studentLeadMagnetSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      currentLevel: "",
      goals: "",
    },
  });

  const onSubmit = async (data: StudentLeadMagnetForm) => {
    setIsSubmitting(true);
    try {
      const response = await apiRequest("POST", "/api/student-lead-magnet/download", data);
      
      if (response.ok) {
        setIsSuccess(true);
        toast({
          title: "Success!",
          description: "Check your email for your career roadmap and exclusive study materials.",
        });
      } else {
        throw new Error("Failed to process request");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send career guide. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <CardTitle className="text-2xl text-purple-700 dark:text-purple-300">Check Your Email!</CardTitle>
            <CardDescription className="text-lg">
              Your Louisiana Plumbing Career Roadmap is on its way, plus exclusive bonus materials.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">📧 What's Coming Next:</h3>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Complete Louisiana plumbing career roadmap</li>
                <li>• Salary progression guide with real numbers</li>
                <li>• Free practice tests and study materials</li>
                <li>• Weekly career tips and industry updates</li>
                <li>• Early access to certification courses</li>
              </ul>
            </div>
            
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Ready to start your plumbing career journey?
              </p>
              <Button asChild className="bg-purple-600 hover:bg-purple-700">
                <a href="/courses">Explore Certification Courses</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 mb-4">
              🎆 FREE CAREER GUIDE
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Louisiana Plumbing
              <br />
              <span className="text-purple-600 dark:text-purple-400">Career Roadmap 2024</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
              The complete guide to building a $75,000+ plumbing career in Louisiana. 
              <strong>Download this roadmap and start earning more within 12 months.</strong>
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
                    <Target className="w-6 h-6 text-purple-600 dark:text-purple-400 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Complete Career Roadmap</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">Step-by-step path from beginner to master plumber</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Salary Progression Guide</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">Real Louisiana wages from $35K to $85K+ per year</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Award className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Certification Timeline</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">When to get apprentice, journeyman, and master licenses</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <BookOpen className="w-6 h-6 text-orange-600 dark:text-orange-400 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">BONUS: Study Materials Pack</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">Practice tests, flashcards, and study guides (Value: $127)</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                <h3 className="font-bold text-green-800 dark:text-green-200 mb-3">
                  🎯 Perfect for You If:
                </h3>
                <ul className="text-green-700 dark:text-green-300 space-y-2 text-sm">
                  <li>✅ New to plumbing and want a clear career path</li>
                  <li>✅ Current apprentice ready for journeyman level</li>
                  <li>✅ Want to maximize your earning potential</li>
                  <li>✅ Planning to start your own plumbing business</li>
                  <li>✅ Need Louisiana-specific licensing information</li>
                </ul>
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                <h3 className="font-bold text-yellow-800 dark:text-yellow-200 mb-3">
                  💰 Louisiana Plumber Salaries:
                </h3>
                <ul className="text-yellow-700 dark:text-yellow-300 space-y-1 text-sm">
                  <li>• <strong>Apprentice:</strong> $35,000 - $42,000/year</li>
                  <li>• <strong>Journeyman:</strong> $55,000 - $68,000/year</li>
                  <li>• <strong>Master Plumber:</strong> $70,000 - $85,000+/year</li>
                  <li>• <strong>Business Owner:</strong> $90,000 - $150,000+/year</li>
                </ul>
              </div>
            </div>

            {/* Right Side - Lead Capture Form */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
              <div className="text-center mb-6">
                <Download className="w-12 h-12 text-purple-600 dark:text-purple-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Get Your FREE Career Guide
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Start building your $75K+ plumbing career today
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
                            placeholder="john.smith@email.com" 
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
                    name="currentLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Level *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="New to plumbing, Apprentice, etc." 
                            {...field} 
                            data-testid="input-level"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="goals"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Career Goals (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Get journeyman license, start business, etc." 
                            {...field} 
                            data-testid="input-goals"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 text-lg"
                    disabled={isSubmitting}
                    data-testid="button-download"
                  >
                    {isSubmitting ? "Sending..." : "🚀 Download FREE Career Guide"}
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

      {/* Success Stories Section */}
      <div className="bg-white dark:bg-gray-800 py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
              Join 1,200+ Louisiana Plumbers Who've Advanced Their Careers
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <div className="text-4xl mb-4">🎉</div>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  "Went from $38K to $62K in 18 months following this roadmap. The certification prep was spot-on."
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">- Marcus R., New Orleans</p>
                <p className="text-sm text-gray-500">Apprentice → Journeyman</p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <div className="text-4xl mb-4">💼</div>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  "Started my own business at 28. Now earning $120K/year. This guide showed me exactly when and how."
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">- Jennifer K., Baton Rouge</p>
                <p className="text-sm text-gray-500">Journeyman → Business Owner</p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <div className="text-4xl mb-4">🎯</div>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  "Passed my journeyman exam on the first try. The study materials made all the difference."
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">- David M., Lafayette</p>
                <p className="text-sm text-gray-500">Recent Certification Success</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Career Progression Visual */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-3xl font-bold mb-8">
              Your Louisiana Plumbing Career Journey
            </h2>
            
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-white/10 backdrop-blur rounded-lg p-6">
                <div className="text-3xl mb-3">🔨</div>
                <h3 className="font-bold mb-2">Apprentice</h3>
                <p className="text-sm mb-2">$35K - $42K/year</p>
                <p className="text-xs opacity-90">Learn the basics</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur rounded-lg p-6">
                <div className="text-3xl mb-3">⚙️</div>
                <h3 className="font-bold mb-2">Journeyman</h3>
                <p className="text-sm mb-2">$55K - $68K/year</p>
                <p className="text-xs opacity-90">Work independently</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur rounded-lg p-6">
                <div className="text-3xl mb-3">🏆</div>
                <h3 className="font-bold mb-2">Master</h3>
                <p className="text-sm mb-2">$70K - $85K/year</p>
                <p className="text-xs opacity-90">Supervise others</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur rounded-lg p-6">
                <div className="text-3xl mb-3">🏢</div>
                <h3 className="font-bold mb-2">Business Owner</h3>
                <p className="text-sm mb-2">$90K - $150K+/year</p>
                <p className="text-xs opacity-90">Own your future</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}