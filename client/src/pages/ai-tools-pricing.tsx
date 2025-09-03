import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { CheckCircle, Camera, FileText, Wand2, Brain, Zap, ArrowRight, Lock } from "lucide-react";
import { Link } from "wouter";
import BetaBanner from "@/components/beta-banner";

export default function AIToolsPricing() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [isBetaTester] = useState(true); // Would come from user session/API in real app

  const calculatePrice = (basePrice: number, isAnnual: boolean, isBeta: boolean) => {
    if (isAnnual && isBeta) {
      // Beta annual: 50% off first month + 25% off remaining 11 months
      const firstMonth = basePrice * 0.5;
      const remainingMonths = basePrice * 0.75 * 11;
      return parseFloat((firstMonth + remainingMonths).toFixed(2)); // Round to 2 decimals
    }
    
    let price = basePrice;
    
    if (isAnnual) {
      price = price * 12 * 0.8; // 20% annual discount on 12 months
    }
    
    if (isBeta && !isAnnual) {
      price = price * 0.75; // 25% off for beta testers (monthly only)
    }
    
    return parseFloat(price.toFixed(2)); // Round to 2 decimals
  };

  const aiToolsFeatures = [
    {
      icon: Camera,
      title: "Photo Code Checker",
      description: "Upload photos of plumbing installations and get instant AI-powered code compliance analysis. Our advanced computer vision technology identifies potential code violations, safety hazards, and installation issues with 95% accuracy.",
      details: [
        "Identifies pipe sizing violations",
        "Detects improper joint connections", 
        "Checks clearance requirements",
        "Validates installation angles",
        "Generates detailed violation reports",
        "Provides corrective recommendations"
      ],
      plans: ["Professional", "Master"]
    },
    {
      icon: FileText,
      title: "Plan Analysis Tool", 
      description: "Upload construction plans and blueprints to automatically generate material lists, cost estimates, and code compliance checks. Powered by GPT-5 for comprehensive plan review and analysis.",
      details: [
        "Automatic material list generation",
        "Cost estimation with current pricing",
        "Code compliance verification",
        "Identifies potential conflicts",
        "Suggests optimization opportunities",
        "Exports to common formats"
      ],
      plans: ["Master"]
    },
    {
      icon: Wand2,
      title: "AI Mentor Support",
      description: "24/7 AI-powered plumbing mentor that answers technical questions, provides code interpretations, and offers installation guidance. Trained on Louisiana plumbing codes and industry best practices.",
      details: [
        "Instant answers to plumbing questions",
        "Louisiana code interpretations", 
        "Installation step-by-step guidance",
        "Troubleshooting assistance",
        "Material recommendations",
        "Career advancement advice"
      ],
      plans: ["Professional", "Master"]
    }
  ];

  const pricingPlans = [
    {
      id: "pay-per-use",
      name: "Pay Per Use",
      basePrice: 0,
      tier: "pay_per_use",
      description: "Perfect for occasional use",
      payPerUse: true,
      aiFeatures: [
        "Photo Analysis: $2.99 per photo",
        "Plan Analysis: $9.99 per plan", 
        "AI Mentor: $0.99 per question",
        "No subscription required"
      ],
      additionalFeatures: [
        "Instant results",
        "No monthly commitment",
        "Pay only for what you use",
        "Perfect for contractors"
      ]
    },
    {
      id: "ai-tools-monthly",
      name: "Monthly",
      basePrice: 29.99,
      tier: "ai_tools_monthly",
      description: "AI tools subscription",
      popular: true,
      aiFeatures: [
        "Photo Code Checker",
        "Plan Analysis Tool",
        "AI Mentor Support", 
        "Unlimited AI analysis",
        "Priority support"
      ],
      additionalFeatures: [
        "Cancel anytime",
        "No course content",
        "API access available",
        "Business support"
      ]
    },
    {
      id: "ai-tools-annual",
      name: "Annual",
      basePrice: 29.99,
      tier: "ai_tools_annual", 
      description: "AI tools yearly plan",
      aiFeatures: [
        "Photo Code Checker",
        "Plan Analysis Tool",
        "AI Mentor Support",
        "Unlimited AI analysis",
        "Priority support"
      ],
      additionalFeatures: [
        "20% annual savings",
        "No course content",
        "API access available", 
        "Business support"
      ]
    }
  ];

  const getPriceId = (planId: string, isAnnual: boolean, isBeta: boolean) => {
    const priceMapping = {
      "ai-tools-only": {
        monthly: {
          regular: "price_ai_tools_monthly_reg",
          beta: "price_ai_tools_monthly_beta"
        },
        annual: {
          regular: "price_ai_tools_annual_reg", 
          beta: "price_ai_tools_annual_beta"
        }
      },
      professional: {
        monthly: {
          regular: "price_1S1xriByFL1L8uV2cKXSxmwV",
          beta: "price_1S1xuaByFL1L8uV2sfIJs3Hz"
        },
        annual: {
          regular: "price_1S1xuqByFL1L8uV2vPEtWkmX", 
          beta: "price_1S1xv9ByFL1L8uV2F8u5czkc"
        }
      },
      master: {
        monthly: {
          regular: "price_1S1xrjByFL1L8uV2iwBxqPG8",
          beta: "price_1S1xucByFL1L8uV2axdk2dL9"
        },
        annual: {
          regular: "price_1S1xurByFL1L8uV2IQuts2h2",
          beta: "price_1S1xvAByFL1L8uV2iuNDyfN7"
        }
      }
    };

    const cycle = isAnnual ? 'annual' : 'monthly';
    const type = isBeta ? 'beta' : 'regular';
    return priceMapping[planId as keyof typeof priceMapping]?.[cycle]?.[type] || "";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Beta Banner */}
      {isBetaTester && (
        <section className="py-6 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <BetaBanner showCTA={false} />
          </div>
        </section>
      )}

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 to-accent/10" data-testid="ai-tools-hero">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Brain className="w-12 h-12 text-primary" />
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground" data-testid="ai-tools-title">
              AI-Powered Plumbing Tools
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8" data-testid="ai-tools-description">
            Revolutionary AI technology designed specifically for Louisiana plumbers. Analyze photos, review plans, and get expert guidance powered by advanced machine learning.
          </p>
          <div className="flex flex-col items-center space-y-6">
            <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>GPT-5 Powered Analysis</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Louisiana Code Trained</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>95% Accuracy Rate</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Tools Features */}
      <section className="py-20" data-testid="ai-features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            Powerful AI Tools at Your Fingertips
          </h2>
          
          <div className="space-y-12">
            {aiToolsFeatures.map((feature, index) => (
              <Card key={feature.title} className={`p-8 ${index % 2 === 1 ? 'bg-muted/50' : ''}`}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <feature.icon className="w-8 h-8 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-foreground">{feature.title}</h3>
                        <div className="flex gap-2 mt-1">
                          {feature.plans.map(plan => (
                            <Badge key={plan} variant="secondary" className="text-xs">
                              {plan}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-muted-foreground text-lg leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    {feature.details.map((detail, idx) => (
                      <div key={idx} className="flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-20 bg-muted/30" data-testid="ai-pricing-plans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Choose Your AI Power Level
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Unlock the full potential of AI-powered plumbing analysis with our professional subscription plans.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {pricingPlans.map((plan) => (
              <Card 
                key={plan.id}
                className={`p-8 hover:shadow-lg transition-all relative ${
                  plan.popular ? 'border-2 border-primary ring-4 ring-primary/20' : ''
                }`}
                data-testid={`ai-plan-${plan.id}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1">
                    Most Popular
                  </Badge>
                )}
                
                <CardContent className="p-0">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-card-foreground mb-2">
                      {plan.name}
                    </h3>
                    <div className="text-4xl font-bold text-primary mb-2">
                      {plan.payPerUse ? (
                        <>
                          <span className="text-2xl">Pay Per Use</span>
                          <div className="text-base font-normal text-muted-foreground mt-2">
                            Starting at $0.99
                          </div>
                        </>
                      ) : plan.id === "ai-tools-annual" ? (
                        <>
                          ${calculatePrice(plan.basePrice, true, isBetaTester)}
                          <span className="text-xl font-normal text-muted-foreground">/year</span>
                        </>
                      ) : (
                        <>
                          ${calculatePrice(plan.basePrice, false, isBetaTester)}
                          <span className="text-xl font-normal text-muted-foreground">/month</span>
                        </>
                      )}
                      {!plan.payPerUse && (plan.id === "ai-tools-annual" || isBetaTester) && (
                        <div className="text-sm space-y-1">
                          {plan.basePrice !== calculatePrice(plan.basePrice, plan.id === "ai-tools-annual", isBetaTester) && (
                            <div className="text-muted-foreground line-through">
                              {plan.id === "ai-tools-annual" ? `$${(plan.basePrice * 12).toFixed(2)}/year` : `$${plan.basePrice.toFixed(2)}/month`}
                            </div>
                          )}
                          {isBetaTester && (
                            <div className="text-orange-600 font-semibold">
                              🎉 Beta: Extra 25% off + 50% off first month
                            </div>
                          )}
                          {plan.id === "ai-tools-annual" && (
                            <div className="text-green-600 font-normal">
                              Save ${((plan.basePrice * 12) - calculatePrice(plan.basePrice, true, isBetaTester)).toFixed(2)} per year (20% off)
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-muted-foreground">
                      {plan.description}
                    </p>
                  </div>
                  
                  <div className="space-y-6 mb-8">
                    <div>
                      <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-primary" />
                        AI-Powered Features
                      </h4>
                      <div className="space-y-2">
                        {plan.aiFeatures.map((feature, index) => (
                          <div key={index} className="flex items-center space-x-3">
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span className="text-card-foreground font-medium">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-foreground mb-3">Additional Features</h4>
                      <div className="space-y-2">
                        {plan.additionalFeatures.map((feature, index) => (
                          <div key={index} className="flex items-center space-x-3">
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span className="text-card-foreground">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {plan.payPerUse ? (
                    <Link href="/tools">
                      <Button 
                        className="w-full"
                        size="lg"
                        variant="outline"
                      >
                        Start Using Tools
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  ) : (
                    <Link href={`/subscribe?plan=${plan.id}&priceId=${getPriceId(plan.id, plan.id === "ai-tools-annual", isBetaTester)}&tier=${plan.tier}&isAnnual=${plan.id === "ai-tools-annual"}&isBeta=${isBetaTester}`}>
                      <Button 
                        className={`w-full ${plan.popular ? 'bg-primary hover:bg-primary/90' : ''}`}
                        size="lg"
                      >
                        Get AI Tools Now
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">
              Need course materials? Check out our learning plans with AI tools included.
            </p>
            <Link href="/pricing">
              <Button variant="outline">
                View Learning Plans
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-hero text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Ready to Revolutionize Your Plumbing Work?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join hundreds of Louisiana plumbers already using AI to improve their work quality, speed up inspections, and reduce code violations.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="#ai-pricing-plans">
              <Button size="lg" className="bg-white text-primary hover:bg-gray-50 text-lg px-8 py-4">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/tools">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg px-8 py-4">
                View Tools Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}