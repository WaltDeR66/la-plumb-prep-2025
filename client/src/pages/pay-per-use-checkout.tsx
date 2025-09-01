import { useState, useEffect } from 'react';
import { useStripe, useElements, PaymentElement, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useLocation, Link } from 'wouter';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = ({ service, amount, onSuccess, onError }: {
  service: string;
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (error) {
        onError(error.message || 'Payment failed');
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent.id);
        toast({
          title: "Payment Successful",
          description: `Your ${service} payment has been processed!`,
        });
      }
    } catch (err: any) {
      onError(err.message || 'Payment failed');
      toast({
        title: "Payment Error",
        description: err.message || 'An unexpected error occurred',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button
        type="submit"
        className="w-full"
        disabled={!stripe || isLoading}
        data-testid="confirm-payment-button"
      >
        {isLoading ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
      </Button>
    </form>
  );
};

export default function PayPerUseCheckout() {
  const [, setLocation] = useLocation();
  const [clientSecret, setClientSecret] = useState("");
  const [service, setService] = useState("");
  const [amount, setAmount] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'succeeded' | 'failed'>('pending');
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    // Get service type from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const serviceType = urlParams.get('service');
    const data = urlParams.get('data');

    if (!serviceType) {
      setLocation('/tools');
      return;
    }

    const initializePayment = async () => {
      try {
        let endpoint = '';
        let serviceDisplayName = '';
        
        switch (serviceType) {
          case 'photo-analysis':
            endpoint = '/api/pay-per-use/photo-analysis';
            serviceDisplayName = 'Photo Analysis';
            break;
          case 'plan-analysis':
            endpoint = '/api/pay-per-use/plan-analysis';
            serviceDisplayName = 'Plan Analysis';
            break;
          case 'mentor-question':
            endpoint = '/api/pay-per-use/mentor-question';
            serviceDisplayName = 'AI Mentor Question';
            break;
          default:
            setLocation('/tools');
            return;
        }

        const response = await apiRequest("POST", endpoint, {
          [serviceType === 'photo-analysis' ? 'imageData' : 
           serviceType === 'plan-analysis' ? 'planData' : 'question']: data
        });

        setClientSecret(response.clientSecret);
        setAmount(response.amount);
        setService(serviceDisplayName);
      } catch (error: any) {
        console.error('Failed to initialize payment:', error);
        setLocation('/tools');
      }
    };

    initializePayment();
  }, [setLocation]);

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    setPaymentStatus('processing');
    
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const serviceType = urlParams.get('service');
      const data = urlParams.get('data');

      const response = await apiRequest("POST", "/api/pay-per-use/process", {
        paymentIntentId,
        service: serviceType,
        data: {
          [serviceType === 'photo-analysis' ? 'imageData' : 
           serviceType === 'plan-analysis' ? 'planData' : 'question']: data
        }
      });

      setResult(response.result);
      setPaymentStatus('succeeded');
    } catch (error: any) {
      console.error('Failed to process service:', error);
      setPaymentStatus('failed');
    }
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    setPaymentStatus('failed');
  };

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (paymentStatus === 'processing') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Processing Your Request</h2>
            <p className="text-muted-foreground">
              Your payment was successful! We're now analyzing your data...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentStatus === 'succeeded') {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="w-6 h-6" />
                <CardTitle>Analysis Complete!</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <p className="text-green-800 dark:text-green-200">
                  Your {service} has been completed successfully.
                </p>
              </div>
              
              {result && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Results:</h3>
                  <div className="bg-muted p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(result, null, 2)}</pre>
                  </div>
                </div>
              )}
              
              <div className="flex space-x-4">
                <Link href="/tools" className="flex-1">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Tools
                  </Button>
                </Link>
                <Link href="/tools/ai-pricing" className="flex-1">
                  <Button className="w-full">
                    Upgrade to Unlimited
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'failed') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <div className="flex items-center space-x-2 text-red-600">
              <XCircle className="w-6 h-6" />
              <CardTitle>Payment Failed</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              There was an issue processing your payment. Please try again.
            </p>
            <Link href="/tools" className="block">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Tools
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Pay Per Use - {service}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6 p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">{service}</span>
                <span className="text-2xl font-bold text-primary">${amount.toFixed(2)}</span>
              </div>
            </div>
            
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm
                service={service}
                amount={amount}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </Elements>
            
            <div className="mt-6 text-center">
              <Link href="/tools">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Cancel and go back
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}