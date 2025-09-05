import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Mail, Lock, Building2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function CheckoutSuccess() {
  const [location] = useLocation();
  const [isProcessing, setIsProcessing] = useState(true);
  const [credentials, setCredentials] = useState<any>(null);
  const [customerEmail, setCustomerEmail] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.split('?')[1] || '');
    const plan = urlParams.get('plan');
    const email = urlParams.get('email');
    const paymentIntentId = urlParams.get('payment_intent');

    if (email) {
      setCustomerEmail(decodeURIComponent(email));
    }

    if (paymentIntentId && plan && email) {
      // Process the successful payment and create account
      processSuccessfulPayment(paymentIntentId, plan, decodeURIComponent(email));
    } else {
      setIsProcessing(false);
    }
  }, [location]);

  const processSuccessfulPayment = async (paymentIntentId: string, plan: string, email: string) => {
    try {
      const response = await apiRequest("POST", "/api/process-payment-success", {
        paymentIntentId,
        plan,
        email
      });
      const data = await response.json();
      
      setCredentials(data.credentials);
      setIsProcessing(false);
      
      toast({
        title: "Account Created Successfully!",
        description: "Check your email for login credentials and receipt",
      });
    } catch (error: any) {
      console.error("Error processing payment success:", error);
      setIsProcessing(false);
      toast({
        title: "Processing Error",
        description: "Payment successful, but there was an issue creating your account. Please contact support.",
        variant: "destructive",
      });
    }
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-6">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Building2 className="w-7 h-7 text-primary-foreground" />
              </div>
              <div className="text-left">
                <h1 className="text-xl font-bold text-primary">LA Plumb Prep</h1>
                <p className="text-xs text-muted-foreground">Official State Prep Course</p>
              </div>
            </div>
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold mb-2">Processing Your Enrollment...</h2>
            <p className="text-muted-foreground">Creating your account and sending confirmation email</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-7 h-7 text-primary-foreground" />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-bold text-primary">LA Plumb Prep</h1>
              <p className="text-xs text-muted-foreground">Official State Prep Course</p>
            </div>
          </div>
          
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          
          <h2 className="text-3xl font-bold text-foreground mb-2" data-testid="success-title">
            Welcome to LA Plumb Prep!
          </h2>
          <p className="text-muted-foreground">
            Your enrollment was successful and your account has been created
          </p>
        </div>

        {/* Success Details */}
        <div className="space-y-6">
          {/* Credentials Card */}
          {credentials && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Lock className="w-5 h-5" />
                  Your Login Credentials
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-green-700 font-medium">Username:</p>
                  <p className="text-lg font-mono bg-white p-2 rounded border" data-testid="generated-username">
                    {credentials.username}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-green-700 font-medium">Temporary Password:</p>
                  <p className="text-lg font-mono bg-white p-2 rounded border" data-testid="generated-password">
                    {credentials.password}
                  </p>
                </div>
                <div className="bg-green-100 border border-green-300 rounded p-3 text-sm text-green-800">
                  <p className="font-medium">Important:</p>
                  <ul className="mt-1 space-y-1 text-xs">
                    <li>• Save these credentials in a safe place</li>
                    <li>• You can change your password after logging in</li>
                    <li>• These credentials have also been emailed to you</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Email Confirmation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Check Your Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We've sent confirmation emails to <strong>{customerEmail}</strong>:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Payment receipt and subscription details
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Account verification with login credentials
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Getting started guide and course access
                </li>
              </ul>
              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
                Don't see the emails? Check your spam folder or contact support.
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>What's Next?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium">Log into your account</h4>
                    <p className="text-sm text-muted-foreground">Use the credentials above or from your email</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium">Complete your profile</h4>
                    <p className="text-sm text-muted-foreground">Update your password and profile information</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium">Start your first course</h4>
                    <p className="text-sm text-muted-foreground">Begin with Louisiana Journeyman Prep</p>
                  </div>
                </div>
              </div>
              
              <Button asChild className="w-full mt-6" size="lg" data-testid="button-login">
                <a href="/login">
                  Login to Your Account
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}