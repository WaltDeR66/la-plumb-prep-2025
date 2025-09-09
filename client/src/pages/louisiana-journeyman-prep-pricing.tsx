import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { CheckCircle, Star, Clock, BookOpen, Users, Award } from "lucide-react";
import { Link } from "wouter";
import BetaBanner from "@/components/beta-banner";

export default function LouisianaJourneymanPrepPricing() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isAnnual, setIsAnnual] = useState(false);
  const [isBetaTester] = useState(true); // Would come from user session/API in real app

  useEffect(() => {
    document.title = "Louisiana Journeyman Prep - LA Plumb Prep";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Comprehensive Louisiana Journeyman Plumber certification preparation. Master the Louisiana Plumbing Code with our expert-led course, practice exams, and AI tools.');
    }
  }, []);

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

  const getPriceId = (planId: string, isAnnual: boolean, isBeta: boolean) => {
    // Real Stripe Price IDs from your account
    const priceMapping = {
      basic: {
        monthly: {
          regular: "price_1S4EusByFL1L8uV24yWoGtnf", // Basic Monthly - $49.99
          beta: "price_1S4E4SByFL1L8uV2fwNtzcdE" // Beta Basic Monthly - $37.49
        },
        annual: {
          regular: "price_1S4EqJByFL1L8uV2KtL96A1l", // Basic Annual - $599.88
          beta: "price_1S4Ek6ByFL1L8uV2AYQdiGj4" // Beta Basic Annual - $437.41
        }
      },
      professional: {
        monthly: {
          regular: "price_1S4F7cByFL1L8uV2U5V4tOje", // Professional Monthly - $79.99
          beta: "price_1S4E9wByFL1L8uV2wOO4VM4D" // Beta Professional Monthly - $59.99
        },
        annual: {
          regular: "price_1S4F4wByFL1L8uV2xK3ArjCj", // Professional Annual - $959.88
          beta: "price_1S4EZSByFL1L8uV2cRdBL3bp" // Beta Professional Annual - $699.91
        }
      },
      master: {
        monthly: {
          regular: "price_1S4F1jByFL1L8uV2YfeGdK7U", // Master Monthly - $99.99
          beta: "price_1S4ESMByFL1L8uV2SPXM5fs4" // Beta Master Monthly - $74.99
        },
        annual: {
          regular: "price_1S4EyGByFL1L8uV2c2IPcRGY", // Master Annual - $1199.88
          beta: "price_1S4EflByFL1L8uV2hXo6sAmI" // Beta Master Annual - $874.91
        }
      }
    };

    const cycle = isAnnual ? 'annual' : 'monthly';
    const type = isBeta ? 'beta' : 'regular';
    return priceMapping[planId as keyof typeof priceMapping][cycle][type];
  };

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Beta Banner */}
      {isBetaTester && (
        <section className="py-6 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <BetaBanner showCTA={false} />
          </div>
        </section>
      )}

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600/10 to-indigo-600/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-6">
            <Badge className="bg-blue-100 text-blue-800 px-6 py-2 text-lg">
              Most Popular Course
            </Badge>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Louisiana Journeyman Prep
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            Comprehensive preparation for the Louisiana Journeyman Plumber License exam. Covers all aspects of the Louisiana Plumbing Code, practical applications, and exam strategies. Cancel anytime - only pay for days used.
          </p>
          
          <div className="flex flex-col items-center space-y-6">
            <div className="flex items-center justify-center space-x-8 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Cancel Anytime</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Pro-rated Billing</span>
              </div>
            </div>
            <div className="flex items-center space-x-4 bg-white dark:bg-gray-800 p-3 rounded-lg border">
              <span className={`text-sm font-medium ${!isAnnual ? 'text-blue-600' : 'text-gray-600'}`}>Monthly</span>
              <Switch checked={isAnnual} onCheckedChange={setIsAnnual} />
              <span className={`text-sm font-medium ${isAnnual ? 'text-blue-600' : 'text-gray-600'}`}>Annual</span>
              {isAnnual && <Badge className="bg-green-100 text-green-800 text-xs">Save 20%</Badge>}
            </div>
          </div>
          
          {/* Course Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto mb-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">120</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Lessons</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">4-5</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Years Course</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">95%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Pass Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">24/7</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* What You'll Learn */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            What You'll Master
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Louisiana Plumbing Code</h3>
              <p className="text-gray-600 dark:text-gray-400">Complete coverage of all 17 chapters with real-world applications</p>
            </div>
            <div className="text-center p-6">
              <Award className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Exam Preparation</h3>
              <p className="text-gray-600 dark:text-gray-400">Practice tests and exam strategies proven to increase pass rates</p>
            </div>
            <div className="text-center p-6">
              <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Expert Mentoring</h3>
              <p className="text-gray-600 dark:text-gray-400">AI-powered mentor available 24/7 for technical questions</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-4">
            Get Started Today
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-12">
            Choose a subscription plan that works for you. Cancel anytime.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                id: "basic",
                name: "Basic",
                basePrice: 37.49,
                tier: "basic",
                description: "Perfect for getting started",
                features: [
                  "Journeyman Prep Course",
                  "Basic Calculator Tools", 
                  "Practice Tests",
                  "Job Board Access",
                  "Referral Commissions (10%)",
                  "Email Support"
                ]
              },
              {
                id: "professional",
                name: "Professional",
                basePrice: 59.99,
                tier: "professional",
                description: "For serious professionals",
                popular: true,
                features: [
                  "Everything in Basic",
                  "Complete Calculator Suite",
                  "AI Photo Analysis",
                  "Plan Analysis Tools",
                  "AI Mentor Support",
                  "Priority Support"
                ]
              },
              {
                id: "master",
                name: "Master",
                basePrice: 74.99,
                tier: "master",
                description: "Complete mastery package",
                features: [
                  "Everything in Professional",
                  "All Future Courses",
                  "1-on-1 Mentoring",
                  "Material List Generator",
                  "Book Store Access",
                  "White-Glove Support"
                ]
              }
            ].map((plan) => (
              <Card 
                key={plan.id} 
                className={`p-6 hover:shadow-lg transition-all relative cursor-pointer ${
                  plan.popular ? 'border-2 border-blue-500 scale-105' : ''
                } ${
                  selectedPlan === plan.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => handleSelectPlan(plan.id)}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white">
                    Most Popular
                  </Badge>
                )}
                <CardContent className="p-0">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {plan.name}
                    </h3>
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                      {isAnnual ? (
                        <>
                          ${calculatePrice(plan.basePrice, isAnnual, isBetaTester)}
                          <span className="text-xl font-normal text-gray-600">/year</span>
                        </>
                      ) : (
                        <>
                          ${calculatePrice(plan.basePrice, isAnnual, isBetaTester)}
                          <span className="text-xl font-normal text-gray-600">/month</span>
                        </>
                      )}
                      {(isAnnual || isBetaTester) && (
                        <div className="text-sm space-y-1">
                          {plan.basePrice !== calculatePrice(plan.basePrice, isAnnual, isBetaTester) && (
                            <div className="text-gray-500 line-through">
                              {isAnnual ? `$${(plan.basePrice * 12).toFixed(2)}/year` : `$${plan.basePrice.toFixed(2)}/month`}
                            </div>
                          )}
                          {isBetaTester && (
                            <div className="text-orange-600 font-semibold">
                              🎉 Beta: Extra 25% off + 50% off first month
                            </div>
                          )}
                          {isAnnual && (
                            <div className="text-green-600 font-normal">
                              Save ${((plan.basePrice * 12) - calculatePrice(plan.basePrice, isAnnual, isBetaTester)).toFixed(2)} per year (20% off)
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                      {plan.description}
                    </p>
                  </div>
                  
                  <div className="space-y-4 mb-8">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-gray-900 dark:text-white">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Link href={`/checkout?plan=${plan.tier}&priceId=${getPriceId(plan.id, isAnnual, isBetaTester)}&planName=${plan.name}&price=$${calculatePrice(plan.basePrice, isAnnual, isBetaTester).toFixed(2)}`}>
                    <Button 
                      className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                      size="lg"
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
    </div>
  );
}