import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Camera, FileText, Clock, Star, ArrowRight, Upload } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function AIPhotoPricing() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
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

  // Pay-per-use photo analysis with payment collection
  const analyzePhotoPayment = useMutation({
    mutationFn: async ({ file, paymentMethodId }: { file: File, paymentMethodId: string }) => {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('paymentMethodId', paymentMethodId);
      
      const response = await fetch("/api/photo-analysis/pay-per-use", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!response.ok) throw new Error("Failed to process photo analysis");
      return response.json();
    },
    onSuccess: (data) => {
      setAnalysis(data);
      setIsAnalyzing(false);
      toast({
        title: "Analysis Complete",
        description: `Charged $${data.cost} for professional analysis.`,
      });
    },
    onError: (error: any) => {
      setIsAnalyzing(false);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze photo",
        variant: "destructive",
      });
    },
  });

  // Create payment intent for pay-per-use
  const createPaymentIntent = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/create-photo-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount: 499 }), // $4.99
      });
      if (!response.ok) throw new Error("Failed to create payment intent");
      return response.json();
    },
  });

  // Create payment session for photo analysis credits (bulk purchase)
  const purchasePhotoAnalysis = useMutation({
    mutationFn: async ({ credits, amount, planName }: { credits: number, amount: number, planName: string }) => {
      const response = await fetch("/api/create-photo-credits-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ credits, amount, planName }),
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File too large",
          description: "Please choose a file smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      setAnalysis(null);
    }
  };

  const handlePayPerUseAnalysis = async () => {
    if (!selectedFile) return;
    
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to use photo analysis",
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Create payment intent
      const paymentData = await createPaymentIntent.mutateAsync();
      
      // Redirect to Stripe Checkout for payment
      window.location.href = paymentData.url;
    } catch (error: any) {
      setIsAnalyzing(false);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initialize payment",
        variant: "destructive",
      });
    }
  };

  const handlePurchase = (plan: any) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to purchase photo analysis credits",
      });
      return;
    }
    
    setIsProcessing(true);
    purchasePhotoAnalysis.mutate({ 
      credits: plan.credits, 
      amount: plan.price,
      planName: plan.name
    });
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

        {/* Pay-Per-Use Analysis Tool */}
        <Card className="mb-12 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-blue-900">Try Analysis Now - Pay Per Use</CardTitle>
            <CardDescription className="text-blue-700">
              $4.99 per photo analysis - Only pay when you use it
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Upload Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Upload Photo</h3>
                <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center bg-white">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label
                    htmlFor="photo-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Camera className="h-12 w-12 text-blue-400 mb-4" />
                    <span className="text-lg font-medium text-blue-700 mb-2">
                      Choose photo to analyze
                    </span>
                    <span className="text-sm text-blue-600">
                      Max 10MB • JPG, PNG, HEIC
                    </span>
                  </label>
                </div>

                {selectedFile && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      <span className="font-medium text-green-800">
                        {selectedFile.name}
                      </span>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handlePayPerUseAnalysis}
                  disabled={!selectedFile || isAnalyzing}
                  className="w-full"
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4 mr-2" />
                      Analyze Photo ($4.99)
                    </>
                  )}
                </Button>
              </div>

              {/* Results Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Analysis Results</h3>
                <div className="bg-white rounded-lg p-6 border border-gray-200 min-h-[200px]">
                  {!analysis ? (
                    <div className="text-center py-8 text-gray-500">
                      Upload and analyze a photo to see professional results
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className={`p-4 rounded-lg ${analysis.isCompliant ? 'bg-green-50' : 'bg-yellow-50'}`}>
                        <div className="flex items-center mb-2">
                          <CheckCircle className={`h-5 w-5 mr-2 ${analysis.isCompliant ? 'text-green-600' : 'text-yellow-600'}`} />
                          <span className={`font-medium ${analysis.isCompliant ? 'text-green-800' : 'text-yellow-800'}`}>
                            {analysis.isCompliant ? 'Code Compliant' : 'Violations Found'}
                          </span>
                        </div>
                      </div>

                      {analysis.violations && analysis.violations.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Code Violations:</h4>
                          <ul className="text-sm text-gray-700 space-y-1">
                            {analysis.violations.map((violation: string, index: number) => (
                              <li key={index}>• {violation}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {analysis.recommendations && analysis.recommendations.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Recommendations:</h4>
                          <ul className="text-sm text-gray-700 space-y-1">
                            {analysis.recommendations.map((rec: string, index: number) => (
                              <li key={index}>• {rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
                  onClick={() => handlePurchase(plan)}
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