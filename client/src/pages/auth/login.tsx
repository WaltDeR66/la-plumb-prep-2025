import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building2, Eye, EyeOff } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import plumbingEducationImage from "@assets/generated_images/Louisiana_plumbing_prep_interface_dd5de1e1.png";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await apiRequest("POST", "/api/auth/login", { email, password });
      
      // Invalidate the auth query to refetch user data
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
      
      setLocation("/dashboard");
    } catch (error: any) {
      setError(error.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Image */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/5 to-primary/10 items-center justify-center p-12">
        <div className="max-w-lg">
          <img 
            src={plumbingEducationImage} 
            alt="Professional plumbing education and certification training"
            className="w-full h-auto rounded-lg shadow-2xl"
          />
          <div className="mt-8 text-center">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Master Louisiana Plumbing Code
            </h3>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Professional certification preparation designed by experts for Louisiana plumbers. 
              Comprehensive courses, AI-powered assistance, and proven success methods.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center" data-testid="login-header">
            <Link href="/">
              <div className="flex items-center justify-center space-x-2 mb-6 cursor-pointer">
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                  <Building2 className="w-7 h-7 text-primary-foreground" />
                </div>
                <div className="text-left">
                  <h1 className="text-xl font-bold text-primary">LA Plumb Prep</h1>
                  <p className="text-xs text-muted-foreground">Official State Prep Course</p>
                </div>
              </div>
            </Link>
            <h2 className="text-3xl font-bold text-foreground" data-testid="login-title">
              Sign in to your account
            </h2>
            <p className="mt-2 text-muted-foreground" data-testid="login-subtitle">
              Continue your plumbing education journey
            </p>
          </div>

        {/* Login Form */}
        <Card data-testid="login-form">
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-6" data-testid="login-error">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1"
                  placeholder="Enter your email"
                  data-testid="input-email"
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    data-testid="input-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid="toggle-password"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                    data-testid="checkbox-remember"
                  />
                  <Label htmlFor="remember-me" className="ml-2 text-sm">
                    Remember me
                  </Label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-medium text-primary hover:text-primary/80" data-testid="link-forgot-password">
                    Forgot your password?
                  </a>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                data-testid="button-login"
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-background text-muted-foreground">Or</span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <Link 
                    href="/register"
                    className="font-medium text-primary hover:text-primary/80" 
                    data-testid="link-register"
                  >
                    Sign up for free
                  </Link>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Benefits */}
        <div className="text-center space-y-4" data-testid="login-benefits">
          <p className="text-sm text-muted-foreground">
            Join thousands of Louisiana plumbers advancing their careers
          </p>
          <div className="flex items-center justify-center space-x-6 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>State Approved Courses</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>AI Mentor Support</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Job Placement</span>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
