import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const SubscribeForm = ({ planName, price }: { planName: string; price: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!stripe || !elements) {
      setIsLoading(false);
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Subscription Successful",
        description: "Welcome to LA Plumb Prep!",
      });
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" data-testid="subscribe-form">
      <div className="bg-muted/50 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-2" data-testid="plan-summary-title">
          {planName} Plan
        </h3>
        <p className="text-2xl font-bold text-primary" data-testid="plan-summary-price">
          {price}/month
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          7-day free trial • Cancel anytime
        </p>
      </div>

      <PaymentElement />
      
      <Button 
        type="submit" 
        className="w-full" 
        size="lg" 
        disabled={!stripe || isLoading}
        data-testid="button-confirm-subscription"
      >
        {isLoading ? "Processing..." : "Start Free Trial"}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        By subscribing, you agree to our Terms of Service and Privacy Policy. 
        Your trial starts today and you won't be charged until after 7 days.
      </p>
    </form>
  );
};

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Get plan details from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const planId = urlParams.get('plan') || 'professional';
  const priceId = urlParams.get('priceId') || 'price_professional_monthly';
  const tier = urlParams.get('tier') || 'professional';

  const planDetails = {
    basic: { name: "Basic", price: "$49" },
    professional: { name: "Professional", price: "$79" },
    master: { name: "Master", price: "$99" }
  };

  const currentPlan = planDetails[planId as keyof typeof planDetails] || planDetails.professional;

  useEffect(() => {
    // Create subscription as soon as the page loads
    apiRequest("POST", "/api/create-subscription", { priceId, tier })
      .then((res) => res.json())
      .then((data) => {
        setClientSecret(data.clientSecret);
      })
      .catch((error) => {
        toast({
          title: "Error",
          description: "Failed to initialize subscription. Please try again.",
          variant: "destructive",
        });
        console.error("Subscription error:", error);
        setLocation("/pricing");
      });
  }, [priceId, tier, toast, setLocation]);

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" data-testid="loading-subscription">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              <p className="text-muted-foreground">Setting up your subscription...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-20" data-testid="subscribe-page">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4" data-testid="subscribe-title">
            Complete Your Subscription
          </h1>
          <p className="text-muted-foreground" data-testid="subscribe-description">
            Secure payment processing powered by Stripe. Your information is safe and encrypted.
          </p>
        </div>

        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle className="text-center" data-testid="payment-form-title">
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <SubscribeForm planName={currentPlan.name} price={currentPlan.price} />
            </Elements>
          </CardContent>
        </Card>

        <div className="text-center mt-8 space-y-4">
          <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
              </svg>
              <span>SSL Encrypted</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
              </svg>
              <span>PCI Compliant</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
              </svg>
              <span>Cancel Anytime</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Questions about your subscription? Contact our support team at support@louisianaplanningacademy.com or call (555) 123-4567.
          </p>
        </div>
      </div>
    </div>
  );
}
