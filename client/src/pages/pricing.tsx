import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { CheckCircle } from "lucide-react";
import { Link } from "wouter";

export default function Pricing() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isAnnual, setIsAnnual] = useState(false);

  const pricingPlans = [
    {
      id: "basic",
      name: "Basic",
      price: "$49",
      priceId: "price_basic_monthly", // Replace with actual Stripe price ID
      tier: "basic",
      description: "Perfect for getting started",
      features: [
        "1 Certification Track",
        "Basic Calculator Tools", 
        "Practice Tests",
        "Job Board Access",
        "Email Support"
      ]
    },
    {
      id: "professional",
      name: "Professional",
      price: "$79",
      priceId: "price_professional_monthly", // Replace with actual Stripe price ID
      tier: "professional",
      description: "For serious professionals",
      popular: true,
      features: [
        "3 Certification Tracks",
        "Complete Calculator Suite",
        "Photo Code Checker",
        "AI Mentor Support",
        "Resume Builder",
        "Priority Support"
      ]
    },
    {
      id: "master",
      name: "Master",
      price: "$99",
      priceId: "price_master_monthly", // Replace with actual Stripe price ID
      tier: "master",
      description: "Complete mastery package",
      features: [
        "All 5 Certification Tracks",
        "Plan Analysis Tools",
        "Material List Generator",
        "Referral Commissions",
        "Book Store Access",
        "White-Glove Support"
      ]
    }
  ];

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 to-accent/10" data-testid="pricing-hero">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6" data-testid="pricing-hero-title">
            Choose Your Learning Path
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8" data-testid="pricing-hero-description">
            Flexible pricing plans designed for every stage of your plumbing career. Cancel anytime - only pay for days used.
          </p>
          <div className="flex flex-col items-center space-y-6">
            <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Cancel Anytime</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Pro-rated Billing</span>
              </div>
            </div>
            <div className="flex items-center space-x-4 bg-card p-3 rounded-lg border">
              <span className={`text-sm font-medium ${!isAnnual ? 'text-primary' : 'text-muted-foreground'}`}>Monthly</span>
              <Switch checked={isAnnual} onCheckedChange={setIsAnnual} />
              <span className={`text-sm font-medium ${isAnnual ? 'text-primary' : 'text-muted-foreground'}`}>Annual</span>
              {isAnnual && <Badge className="bg-green-100 text-green-800 text-xs">Save 20%</Badge>}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-20" data-testid="pricing-plans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`p-8 hover:shadow-lg transition-all relative cursor-pointer ${
                  plan.popular ? 'border-2 border-primary scale-105' : ''
                } ${
                  selectedPlan === plan.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => handleSelectPlan(plan.id)}
                data-testid={`pricing-plan-${plan.id}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                )}
                <CardContent className="p-0">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-card-foreground mb-2" data-testid={`plan-name-${plan.id}`}>
                      {plan.name}
                    </h3>
                    <div className="text-4xl font-bold text-primary mb-2" data-testid={`plan-price-${plan.id}`}>
                      {isAnnual ? `$${Math.floor(parseInt(plan.price.replace('$', '')) * 0.8)}` : plan.price}
                      <span className="text-xl font-normal text-muted-foreground">/month</span>
                      {isAnnual && (
                        <div className="text-sm text-green-600 font-normal">
                          Save 20% • ${Math.floor(parseInt(plan.price.replace('$', '')) * 0.8 * 12)} annually
                        </div>
                      )}
                    </div>
                    <p className="text-muted-foreground" data-testid={`plan-description-${plan.id}`}>
                      {plan.description}
                    </p>
                  </div>
                  
                  <div className="space-y-4 mb-8">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-card-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Link href={`/subscribe?plan=${plan.id}&priceId=${plan.priceId}&tier=${plan.tier}`}>
                    <Button 
                      className={`w-full ${plan.popular ? 'bg-primary hover:bg-primary/90' : ''}`}
                      size="lg"
                      data-testid={`button-select-${plan.id}`}
                    >
                      Get Started Now
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Comparison */}
      <section className="py-20 bg-muted/50" data-testid="features-comparison">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12" data-testid="comparison-title">
            What's Included in Each Plan
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-card rounded-lg overflow-hidden shadow-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left p-4 font-semibold">Features</th>
                  <th className="text-center p-4 font-semibold">Basic</th>
                  <th className="text-center p-4 font-semibold">Professional</th>
                  <th className="text-center p-4 font-semibold">Master</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="p-4 font-medium">Certification Tracks</td>
                  <td className="p-4 text-center">1</td>
                  <td className="p-4 text-center">3</td>
                  <td className="p-4 text-center">5</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Calculator Tools</td>
                  <td className="p-4 text-center">Basic</td>
                  <td className="p-4 text-center">Complete Suite</td>
                  <td className="p-4 text-center">Complete Suite</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">AI Mentor Support</td>
                  <td className="p-4 text-center">❌</td>
                  <td className="p-4 text-center">✅</td>
                  <td className="p-4 text-center">✅</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Photo Code Checker</td>
                  <td className="p-4 text-center">❌</td>
                  <td className="p-4 text-center">✅</td>
                  <td className="p-4 text-center">✅</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Plan Analysis</td>
                  <td className="p-4 text-center">❌</td>
                  <td className="p-4 text-center">❌</td>
                  <td className="p-4 text-center">✅</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Resume Builder</td>
                  <td className="p-4 text-center">❌</td>
                  <td className="p-4 text-center">✅</td>
                  <td className="p-4 text-center">✅</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium">Referral Commissions</td>
                  <td className="p-4 text-center">❌</td>
                  <td className="p-4 text-center">❌</td>
                  <td className="p-4 text-center">10%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20" data-testid="pricing-faq">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12" data-testid="faq-title">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-8">
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold text-foreground mb-2">How does cancellation work?</h3>
              <p className="text-muted-foreground">
                You can cancel anytime with no penalties. When you cancel, you'll only be charged for the days you actually used the service. For example, if you cancel after 10 days of a monthly plan, you'll only pay for those 10 days.
              </p>
            </div>
            
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold text-foreground mb-2">Can I change plans later?</h3>
              <p className="text-muted-foreground">
                Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle, and you'll be prorated for any differences.
              </p>
            </div>
            
            
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold text-foreground mb-2">What payment methods do you accept?</h3>
              <p className="text-muted-foreground">
                We accept all major credit cards (Visa, MasterCard, American Express, Discover) through our secure Stripe payment processing system.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">How does the cancel anytime policy work?</h3>
              <p className="text-muted-foreground">
                You can cancel your subscription at any time with no penalties or fees. When you cancel, you'll only be charged for the actual days you used the service, not the full billing period.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-hero text-white" data-testid="pricing-cta">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6" data-testid="cta-title">
            Ready to Advance Your Plumbing Career?
          </h2>
          <p className="text-xl text-blue-100 mb-8" data-testid="cta-description">
            Join thousands of Louisiana plumbers who have successfully advanced their careers with our comprehensive training programs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="#pricing-plans">
              <Button size="lg" className="bg-white text-primary hover:bg-gray-50 text-lg px-8 py-4" data-testid="cta-button-start">
                Get Started Today
              </Button>
            </Link>
            <a href="mailto:support@laplumbprep.com">
              <Button variant="outline" size="lg" className="border-2 border-white text-white hover:bg-white hover:text-primary text-lg px-8 py-4" data-testid="cta-button-contact">
                Contact Sales
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
