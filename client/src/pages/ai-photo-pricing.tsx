import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Camera, FileText, Clock, Star, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function AIPhotoPricing() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Check authentication and subscription status
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const { data: subscription } = useQuery({
    queryKey: ["/api/subscription-status"],
    enabled: !!user,
  });

  // Create payment session for photo analysis credits
  const purchasePhotoAnalysis = useMutation({
    mutationFn: async ({ credits }: { credits: number }) => {
      const response = await fetch("/api/create-photo-analysis-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ credits }),
      });
      if (!response.ok) throw new Error("Failed to create payment session");
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process payment",
        variant: "destructive",
      });
    },
  });

  const plans = [
    {
      name: "Starter Pack",
      credits: 10,
      price: 19.99,
      description: "Perfect for small projects",
      features: [
        "10 photo analyses",
        "Code compliance checking",
        "Installation review",
        "Detailed reports",
        "Email support",
      ],
      popular: false,
    },
    {
      name: "Professional",
      credits: 25,
      price: 39.99,
      description: "Most popular for contractors",
      features: [
        "25 photo analyses",
        "Code compliance checking", 
        "Installation review",
        "Detailed reports",
        "Priority support",
        "Save 20% per analysis",
      ],
      popular: true,
    },
    {
      name: "Business",
      credits: 50,
      price: 69.99,
      description: "Best value for companies",
      features: [
        "50 photo analyses",
        "Code compliance checking",
        "Installation review", 
        "Detailed reports",
        "Priority support",
        "Save 30% per analysis",
        "Bulk processing",
      ],
      popular: false,
    },
  ];

  const handlePurchase = (credits: number) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to purchase photo analysis credits",
      });
      return;
    }
    
    setIsProcessing(true);
    purchasePhotoAnalysis.mutate({ credits });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-4">
            <Camera className="h-12 w-12 text-blue-600 mr-4" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              AI Photo Analysis
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Get instant code compliance checking and professional installation reviews using our advanced AI technology
          </p>
        </div>

        {/* How it works */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Camera className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Upload Photo</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Take a photo of your plumbing installation or upload existing images
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">AI Analysis</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Our AI analyzes your photo for Louisiana plumbing code compliance
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Get Report</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Receive detailed analysis with violations, recommendations, and corrections
            </p>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <Card 
              key={plan.name} 
              className={`relative ${plan.popular ? 'border-blue-500 shadow-lg' : ''}`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-1">
                  Most Popular
                </Badge>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-blue-600">${plan.price}</span>
                  <p className="text-sm text-gray-500 mt-1">
                    ${(plan.price / plan.credits).toFixed(2)} per analysis
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full" 
                  size="lg"
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => handlePurchase(plan.credits)}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Processing..." : `Purchase ${plan.credits} Credits`}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Current subscription info */}
        {user && subscription?.hasActiveSubscription && (
          <Card className="mb-8 bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                <div>
                  <h3 className="font-semibold text-green-800">Subscription Active</h3>
                  <p className="text-green-700">
                    You have an active subscription. Photo analysis credits are 20% off for subscribers.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Try free version */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-800 mb-2">
                  Try the Free Version First
                </h3>
                <p className="text-blue-700">
                  Get a basic analysis with our free photo analyzer tool to see if it meets your needs.
                </p>
              </div>
              <div className="ml-4">
                <Link href="/ai-photo-analysis">
                  <Button variant="outline" className="border-blue-300 text-blue-700">
                    Try Free Version
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ or additional info */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Questions?</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Contact us for bulk pricing or enterprise solutions
          </p>
          <Link href="/contact">
            <Button variant="outline">Contact Support</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}