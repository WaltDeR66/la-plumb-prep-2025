import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Building2, Calculator, Camera, MessageCircle, Users, Star, Clock, MapPin, DollarSign } from "lucide-react";
import { Link } from "wouter";
import heroImage from "@assets/generated_images/Louisiana_plumbing_prep_hero_image_70473180.png";
import BetaBanner from "@/components/beta-banner";

export default function Home() {
  const courses = [
    {
      id: "journeyman",
      title: "Journeyman Plumber",
      description: "Master residential and commercial plumbing systems, codes, and installation techniques.",
      price: "Available",
      icon: Building2,
      features: ["120+ Practice Questions", "Video Lessons", "Code Books Included"]
    },
    {
      id: "backflow",
      title: "Backflow Prevention",
      description: "Comprehensive training course covering backflow prevention testing, repairs, and field report completion.",
      price: "Coming Soon",
      icon: Calculator,
      features: ["Device Testing Modules", "Cross-Connection Control", "Field Reports Training"]
    },
    {
      id: "natural-gas",
      title: "Natural Gas",
      description: "Gas line installation, pressure testing, and safety protocols for natural gas systems.",
      price: "Coming Soon",
      icon: Building2,
      features: ["Pressure Testing Procedures", "Safety Protocols", "Code Compliance"]
    },
    {
      id: "medical-gas",
      title: "Medical Gas",
      description: "Hospital and healthcare facility gas systems installation and maintenance certification.",
      price: "Coming Soon",
      icon: Building2,
      features: ["NFPA 99 Standards", "Critical Care Systems", "Purity Testing"]
    },
    {
      id: "master",
      title: "Master Plumber",
      description: "Advanced business operations, code interpretation, and supervisory responsibilities.",
      price: "Coming Soon",
      icon: Star,
      features: ["Business Law & Operations", "Advanced Code Interpretation", "Project Management"],
      badge: "Most Advanced"
    }
  ];

  const tools = [
    {
      title: "Pipe Sizing Calculator",
      description: "Calculate proper pipe sizes for water supply systems based on fixture units and flow rates.",
      icon: Calculator
    },
    {
      title: "Plan Analysis Tool",
      description: "Upload construction plans and get automated material lists and code compliance checks.",
      icon: Building2
    },
    {
      title: "Photo Code Checker",
      description: "Take photos of installations and get instant AI-powered code compliance feedback.",
      icon: Camera
    },
    {
      title: "Pressure Loss Calculator",
      description: "Calculate pressure losses through fittings, valves, and straight pipe runs.",
      icon: Calculator
    }
  ];

  const jobs = [
    {
      title: "Journeyman Plumber",
      company: "Reliable Contracting LLC",
      location: "Baton Rouge, LA",
      type: "Full-time",
      salary: "$28-35/hour",
      description: "Seeking experienced journeyman plumber for residential and commercial projects. Must have valid Louisiana license and 3+ years experience.",
      badge: "Featured",
      tags: ["Residential", "Commercial", "Benefits"]
    },
    {
      title: "Master Plumber - Supervisor",
      company: "Gulf South Plumbing",
      location: "New Orleans, LA",
      type: "Full-time",
      salary: "$45-55/hour",
      description: "Lead team of 5+ plumbers on commercial construction projects. Master license required. Excellent leadership and project management skills needed.",
      badge: "Urgent",
      tags: ["Leadership", "Commercial", "Project Management"]
    },
    {
      title: "Backflow Prevention Specialist",
      company: "Acadiana Plumbing Services",
      location: "Lafayette, LA",
      type: "Contract",
      salary: "$150-200/test",
      description: "Certified backflow prevention assembly tester needed for commercial and industrial clients. Must have current Louisiana certification.",
      tags: ["Backflow Testing", "Commercial", "Flexible Schedule"]
    }
  ];

  const pricingPlans = [
    {
      name: "Basic",
      price: "$49",
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
      name: "Professional",
      price: "$79",
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
      name: "Master",
      price: "$99",
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

  return (
    <div>
      {/* Beta Banner */}
      <section className="py-6 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BetaBanner />
        </div>
      </section>

      {/* Hero Section */}
      <section className="gradient-hero text-white py-20" data-testid="hero-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight" data-testid="hero-title">
                Master Your<br />
                Plumbing Career<br />
                in Louisiana
              </h1>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed" data-testid="hero-description">
                Comprehensive prep courses for Journeyman, Backflow, Natural Gas, Medical Gas, and Master Plumber certifications. Take your Louisiana plumbing test with confidence that you will pass the first time.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/pricing">
                  <Button size="lg" className="bg-white text-primary hover:bg-gray-50 text-lg px-8 py-4" data-testid="button-free-trial">
                    Get 50% Off First Month
                  </Button>
                </Link>
              </div>
              <div className="flex items-center space-x-6 mt-8 text-blue-100">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm">5 Certification Tracks</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm">AI Mentor Support</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm">Louisiana Job Placement</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <img 
                src={heroImage} 
                alt="Louisiana plumbing certification and professional education" 
                className="rounded-2xl shadow-2xl w-full h-auto"
                data-testid="hero-image"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Course Tracks Section */}
      <section className="py-20 bg-muted/50" data-testid="courses-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4" data-testid="courses-title">
              Five Professional Certification Tracks
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="courses-description">
              Comprehensive courses designed to prepare you for Louisiana state plumbing examinations with confidence.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <Card key={course.id} className={`p-8 hover:shadow-lg transition-shadow relative ${course.badge ? 'border-accent' : ''}`} data-testid={`course-card-${course.id}`}>
                {course.badge && (
                  <Badge className="absolute -top-3 left-4 bg-accent text-accent-foreground">
                    {course.badge}
                  </Badge>
                )}
                <CardContent className="p-0">
                  <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-6">
                    <course.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-card-foreground mb-3" data-testid={`course-title-${course.id}`}>
                    {course.title}
                  </h3>
                  <p className="text-muted-foreground mb-6" data-testid={`course-description-${course.id}`}>
                    {course.description}
                  </p>
                  <div className="space-y-3 mb-6">
                    {course.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    {course.price === "Coming Soon" ? (
                      <>
                        <span className="text-lg font-semibold text-muted-foreground" data-testid={`course-status-${course.id}`}>
                          Coming Soon
                        </span>
                        <Button disabled data-testid={`button-coming-soon-${course.id}`}>
                          Coming Soon
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="text-lg font-semibold text-muted-foreground">
                          Available Now
                        </span>
                        <Link href="/pricing">
                          <Button data-testid={`button-start-course-${course.id}`}>
                            Start Course
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Professional Tools Section */}
      <section className="py-20 bg-white" data-testid="tools-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4" data-testid="tools-title">
              Professional Plumbing Tools & Calculators
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="tools-description">
              Comprehensive suite of calculators and analysis tools to support your plumbing work and studies.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="space-y-8">
                {tools.map((tool, index) => (
                  <div key={index} className="flex items-start space-x-4" data-testid={`tool-${index}`}>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <tool.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-2" data-testid={`tool-title-${index}`}>
                        {tool.title}
                      </h3>
                      <p className="text-muted-foreground" data-testid={`tool-description-${index}`}>
                        {tool.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="lg:pl-8">
              <Card className="bg-muted/50 p-8" data-testid="calculator-demo">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Pipe Sizing Calculator</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Fixture Units (WFU)</label>
                      <input 
                        type="number" 
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent" 
                        placeholder="Enter fixture units" 
                        defaultValue="45"
                        data-testid="input-fixture-units"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Pipe Material</label>
                      <select 
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                        data-testid="select-pipe-material"
                      >
                        <option>Copper Type L</option>
                        <option>PEX</option>
                        <option>CPVC</option>
                      </select>
                    </div>
                    <Link href="/tools">
                      <Button className="w-full" data-testid="button-calculate-pipe-size">
                        Calculate Pipe Size
                      </Button>
                    </Link>
                    <Card className="p-4 border">
                      <div className="text-sm text-muted-foreground mb-1">Recommended Pipe Size:</div>
                      <div className="text-2xl font-bold text-primary" data-testid="calculated-pipe-size">
                        3/4" Copper
                      </div>
                    </Card>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* AI Mentor Section */}
      <section className="py-20 bg-gradient-to-br from-purple-50 to-blue-50" data-testid="ai-mentor-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <img 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                alt="Professional mentor with apprentice reviewing blueprints" 
                className="rounded-2xl shadow-xl w-full h-auto"
                data-testid="mentor-image"
              />
            </div>
            <div className="order-1 lg:order-2">
              <Badge className="bg-purple-100 text-purple-800 mb-4">
                AI-Powered
              </Badge>
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6" data-testid="mentor-title">
                24/7 AI Mentor Support
              </h2>
              <p className="text-xl text-muted-foreground mb-8" data-testid="mentor-description">
                Get instant answers to your plumbing questions with our AI mentor trained on Louisiana plumbing codes and industry best practices.
              </p>
              
              <div className="space-y-6 mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-foreground">Instant code interpretation and clarification</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-foreground">Step-by-step problem solving guidance</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-foreground">Practice test explanations and feedback</span>
                </div>
              </div>
              
              <Card className="p-6 border" data-testid="mentor-demo">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">AI Mentor</p>
                    <p className="text-foreground">"What's the minimum pipe size for a 3-fixture bathroom according to Louisiana code?"</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Job Board Preview */}
      <section className="py-20 bg-white" data-testid="jobs-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4" data-testid="jobs-title">
              Louisiana Plumbing Job Board
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="jobs-description">
              Connect with employers across Louisiana. Premium job postings with detailed company information and competitive salaries.
            </p>
          </div>
          
          <div className="space-y-6">
            {jobs.map((job, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow" data-testid={`job-card-${index}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                      <span className="text-primary-foreground font-bold text-lg">
                        {job.company.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-card-foreground mb-1" data-testid={`job-title-${index}`}>
                        {job.title}
                      </h3>
                      <p className="text-muted-foreground mb-2" data-testid={`job-company-${index}`}>
                        {job.company}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span data-testid={`job-location-${index}`}>{job.location}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span data-testid={`job-type-${index}`}>{job.type}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <DollarSign className="w-4 h-4" />
                          <span data-testid={`job-salary-${index}`}>{job.salary}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {job.badge && (
                      <Badge className={job.badge === "Featured" ? "bg-green-100 text-green-800" : "bg-purple-100 text-purple-800"}>
                        {job.badge}
                      </Badge>
                    )}
                    <Link href="/jobs">
                      <Button data-testid={`button-apply-${index}`}>
                        Apply Now
                      </Button>
                    </Link>
                  </div>
                </div>
                <p className="text-muted-foreground mt-4" data-testid={`job-description-${index}`}>
                  {job.description}
                </p>
                <div className="flex items-center space-x-2 mt-4">
                  {job.tags.map((tag, tagIndex) => (
                    <Badge key={tagIndex} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link href="/jobs">
              <Button size="lg" data-testid="button-view-all-jobs">
                View All Jobs (47 Available)
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-muted/50" data-testid="pricing-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4" data-testid="pricing-title">
              Choose Your Learning Path
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="pricing-description">
              Flexible pricing plans designed for every stage of your plumbing career. Start with a 7-day free trial.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`p-8 hover:shadow-lg transition-shadow relative ${plan.popular ? 'border-2 border-primary' : ''}`} data-testid={`pricing-plan-${plan.name.toLowerCase()}`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                )}
                <CardContent className="p-0">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-card-foreground mb-2" data-testid={`plan-name-${plan.name.toLowerCase()}`}>
                      {plan.name}
                    </h3>
                    <div className="text-4xl font-bold text-primary mb-2" data-testid={`plan-price-${plan.name.toLowerCase()}`}>
                      {plan.price}<span className="text-xl font-normal text-muted-foreground">/month</span>
                    </div>
                    <p className="text-muted-foreground" data-testid={`plan-description-${plan.name.toLowerCase()}`}>
                      {plan.description}
                    </p>
                  </div>
                  
                  <div className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-card-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Link href="/pricing">
                    <Button className="w-full" size="lg" data-testid={`button-trial-${plan.name.toLowerCase()}`}>
                      Start 7-Day Free Trial
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">All plans include 7-day free trial • Cancel anytime • No setup fees</p>
            <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Louisiana State Approved</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Mobile App Included</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Secure Payment Processing</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
