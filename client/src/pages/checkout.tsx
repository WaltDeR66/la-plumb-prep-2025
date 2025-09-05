import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { Building2 } from "lucide-react";

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

const CheckoutForm = ({ planName, price, priceId, tier }: { 
  planName: string; 
  price: string; 
  priceId: string;
  tier: string;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!stripe || !elements) {
      setIsLoading(false);
      return;
    }

    // Validate customer information
    if (!customerInfo.firstName || !customerInfo.lastName || !customerInfo.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      // Confirm payment with customer info
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success?plan=${tier}&email=${encodeURIComponent(customerInfo.email)}`,
          payment_method_data: {
            billing_details: {
              name: `${customerInfo.firstName} ${customerInfo.lastName}`,
              email: customerInfo.email,
              phone: customerInfo.phone || undefined,
            }
          }
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // Payment succeeded - this will be handled by the success page
        toast({
          title: "Payment Processing",
          description: "Processing your enrollment...",
        });
      }
    } catch (err: any) {
      toast({
        title: "Payment Error",
        description: err.message || "An error occurred during payment",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" data-testid="checkout-form">
      {/* Plan Summary */}
      <div className="bg-muted/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-2" data-testid="plan-summary-title">
          {planName} Plan
        </h3>
        <p className="text-2xl font-bold text-primary" data-testid="plan-summary-price">
          {price}/month
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          50% off first month • Cancel anytime
        </p>
      </div>

      {/* Customer Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                name="firstName"
                value={customerInfo.firstName}
                onChange={handleInputChange}
                required
                data-testid="input-first-name"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                name="lastName"
                value={customerInfo.lastName}
                onChange={handleInputChange}
                required
                data-testid="input-last-name"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={customerInfo.email}
              onChange={handleInputChange}
              required
              data-testid="input-email"
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone Number (Optional)</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={customerInfo.phone}
              onChange={handleInputChange}
              data-testid="input-phone"
            />
          </div>
        </CardContent>
      </Card>

      {/* Payment Information */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentElement />
        </CardContent>
      </Card>
      
      <Button 
        type="submit" 
        className="w-full" 
        size="lg" 
        disabled={!stripe || isLoading}
        data-testid="button-complete-payment"
      >
        {isLoading ? "Processing..." : `Complete Enrollment - ${price}/month`}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        By completing this purchase, you agree to our terms of service and privacy policy.
        Your account will be created automatically and login credentials will be emailed to you.
      </p>
    </form>
  );
};

export default function Checkout() {
  const [location] = useLocation();
  const [clientSecret, setClientSecret] = useState("");
  const [planDetails, setPlanDetails] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Parse URL parameters
    const urlParams = new URLSearchParams(location.split('?')[1] || '');
    const plan = urlParams.get('plan');
    const priceId = urlParams.get('priceId');
    const planName = urlParams.get('planName');
    const price = urlParams.get('price');

    if (!plan || !priceId || !planName || !price) {
      toast({
        title: "Invalid Payment Link",
        description: "Please select a plan from the pricing page",
        variant: "destructive",
      });
      return;
    }

    setPlanDetails({ plan, priceId, planName, price });

    // Create payment intent with customer info collection
    apiRequest("POST", "/api/create-payment-intent", { 
      priceId,
      tier: plan,
      collectCustomerInfo: true
    })
    .then((response) => response.json())
    .then((data) => {
      setClientSecret(data.clientSecret);
    })
    .catch((error) => {
      toast({
        title: "Payment Setup Failed",
        description: error.message || "Failed to setup payment",
        variant: "destructive",
      });
    });
  }, [location, toast]);

  if (!clientSecret || !planDetails) {
    return (
      <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
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
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
            </div>
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
          <h2 className="text-3xl font-bold text-foreground" data-testid="checkout-title">
            Complete Your Enrollment
          </h2>
          <p className="text-muted-foreground mt-2">
            Join thousands of plumbers advancing their careers
          </p>
        </div>

        {/* Checkout Form */}
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm 
            planName={planDetails.planName}
            price={planDetails.price}
            priceId={planDetails.priceId}
            tier={planDetails.plan}
          />
        </Elements>
      </div>
    </div>
  );
}