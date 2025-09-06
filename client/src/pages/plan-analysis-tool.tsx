import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  MapPin, 
  Calculator, 
  FileCheck, 
  AlertTriangle,
  Zap,
  Download,
  DollarSign,
  Clock,
  Brain,
  Target,
  ArrowRight,
  Package,
  Ruler,
  Settings
} from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

export default function PlanAnalysisTool() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const calculatePricing = (fileSizeBytes: number) => {
    const sizeMB = fileSizeBytes / (1024 * 1024);
    
    if (sizeMB <= 2) return { tier: "Small", price: 4.99, description: "≤2MB" };
    if (sizeMB <= 10) return { tier: "Medium", price: 9.99, description: "2-10MB" };
    if (sizeMB <= 25) return { tier: "Large", price: 19.99, description: "10-25MB" };
    return { tier: "Enterprise", price: 39.99, description: "25MB+" };
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setAnalysisResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!uploadedFile) return;

    const pricing = calculatePricing(uploadedFile.size);
    
    // Redirect to checkout with file info
    setLocation(`/pay-per-use?service=plan-analysis&amount=${pricing.price}&fileName=${encodeURIComponent(uploadedFile.name)}&fileSize=${uploadedFile.size}`);
  };

  const pricingTiers = [
    {
      tier: "Small Files",
      size: "≤2MB",
      price: "$4.99",
      description: "Perfect for simple floor plans and basic schematics",
      features: [
        "Basic material list generation",
        "Standard code compliance check",
        "Simple fitting identification",
        "PDF export included"
      ],
      color: "bg-green-50 border-green-200"
    },
    {
      tier: "Medium Files", 
      size: "2-10MB",
      price: "$9.99",
      description: "Ideal for detailed blueprints and multi-room layouts",
      features: [
        "Comprehensive material lists",
        "Advanced code analysis",
        "Detailed fitting mapping",
        "Cost estimation included",
        "3D visualization support"
      ],
      color: "bg-blue-50 border-blue-200",
      popular: true
    },
    {
      tier: "Large Files",
      size: "10-25MB", 
      price: "$19.99",
      description: "For complex commercial plans and multi-story buildings",
      features: [
        "Enterprise-grade analysis",
        "Multi-floor coordination",
        "Advanced material optimization",
        "Detailed cost breakdowns",
        "Priority processing",
        "CAD file support"
      ],
      color: "bg-purple-50 border-purple-200"
    },
    {
      tier: "Enterprise Files",
      size: "25MB+",
      price: "$39.99", 
      description: "Large-scale commercial and industrial projects",
      features: [
        "Industrial-grade processing",
        "Complex system analysis",
        "Advanced optimization algorithms",
        "Custom material specifications",
        "Expedited delivery",
        "Technical support included"
      ],
      color: "bg-orange-50 border-orange-200"
    }
  ];

  const features = [
    {
      icon: MapPin,
      title: "Spatial Coordinate Mapping",
      description: "Advanced AI identifies exact locations of fittings, valves, and connections with precise coordinates and confidence scores.",
      benefits: [
        "Numbered fitting overlays on plans",
        "GPS-style coordinate mapping", 
        "95%+ accuracy in fitting detection",
        "Confidence scores for each identification"
      ]
    },
    {
      icon: Package,
      title: "Automatic Material List Generation",
      description: "Generate comprehensive material lists with quantities, specifications, and current market pricing automatically.",
      benefits: [
        "Accurate pipe sizing calculations",
        "Fitting type identification",
        "Quantity calculations with 10% buffer",
        "Real-time pricing from major suppliers"
      ]
    },
    {
      icon: FileCheck,
      title: "Louisiana Code Compliance",
      description: "Comprehensive analysis against Louisiana Plumbing Code requirements with detailed violation reporting.",
      benefits: [
        "Clearance requirement validation",
        "Installation angle verification", 
        "Code violation flagging",
        "Corrective action recommendations"
      ]
    },
    {
      icon: Calculator,
      title: "Cost Estimation Engine",
      description: "Professional-grade cost analysis with labor estimates, material costs, and project timeline predictions.",
      benefits: [
        "Material cost calculations",
        "Labor hour estimations",
        "Total project cost projections",
        "Cost optimization suggestions"
      ]
    },
    {
      icon: Brain,
      title: "AI-Powered Analysis",
      description: "GPT-5 powered analysis engine trained specifically on Louisiana plumbing codes and industry standards.",
      benefits: [
        "Louisiana-specific code knowledge",
        "Industry best practices integration",
        "Continuous learning improvements",
        "Professional-grade accuracy"
      ]
    },
    {
      icon: Download,
      title: "Professional Reports",
      description: "Generate detailed PDF reports with analysis results, material lists, and compliance summaries.",
      benefits: [
        "Formatted PDF exports",
        "Professional documentation",
        "Client-ready presentations",
        "Compliance certificates"
      ]
    }
  ];

  const sampleResults = [
    {
      title: "Spatial Mapping Results",
      description: "AI-identified 47 fittings with coordinate precision",
      items: [
        "Kitchen sink connection: (X: 145.2, Y: 67.8) - 95% confidence",
        "Main water line: (X: 203.1, Y: 145.9) - 98% confidence", 
        "Bathroom fixtures: (X: 89.4, Y: 201.3) - 92% confidence",
        "Hot water heater: (X: 256.7, Y: 78.2) - 97% confidence"
      ]
    },
    {
      title: "Generated Material List",
      description: "Comprehensive list with current pricing",
      items: [
        "3/4\" Copper Type L Pipe: 124 ft - $387.40",
        "1/2\" PEX Tubing: 89 ft - $156.80",
        "3/4\" Ball Valves: 8 units - $127.20",
        "Pipe Fittings (Various): 34 units - $89.60"
      ]
    },
    {
      title: "Code Compliance Check",
      description: "Louisiana code analysis results",
      items: [
        "✅ All clearances meet minimum requirements",
        "⚠️ Hot water line needs additional insulation (Section 605.11)",
        "✅ Fixture spacing complies with accessibility standards",
        "⚠️ Shutoff valve placement requires adjustment"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-6">
              <FileText className="w-16 h-16 text-blue-200" />
              <h1 className="text-5xl lg:text-6xl font-bold" data-testid="plan-analysis-title">
                Plan Analysis Tool
              </h1>
            </div>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8" data-testid="plan-analysis-description">
              Revolutionary AI-powered plan analysis with spatial coordinate mapping, automated material lists, and Louisiana code compliance checking. Pay only for what you analyze.
            </p>
            
            {/* Key Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-200">95%+</div>
                <div className="text-sm text-blue-300">Accuracy Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-200">5 Min</div>
                <div className="text-sm text-blue-300">Average Analysis</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-200">$4.99</div>
                <div className="text-sm text-blue-300">Starting Price</div>
              </div>
            </div>

            {/* Upload Section */}
            <div className="max-w-md mx-auto">
              <Card className="bg-white/10 border-white/20">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept=".pdf,.dwg,.png,.jpg,.jpeg"
                      className="hidden"
                      data-testid="file-input"
                    />
                    
                    {uploadedFile ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-white/10 rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="w-6 h-6 text-blue-200" />
                            <div className="text-left">
                              <div className="font-medium text-white">{uploadedFile.name}</div>
                              <div className="text-sm text-blue-200">
                                {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-4 bg-green-500/20 border border-green-400/30 rounded-lg">
                          <div className="text-center">
                            <div className="font-semibold text-green-100">
                              {calculatePricing(uploadedFile.size).tier} Plan Analysis
                            </div>
                            <div className="text-2xl font-bold text-white">
                              ${calculatePricing(uploadedFile.size).price}
                            </div>
                            <div className="text-sm text-green-200">
                              {calculatePricing(uploadedFile.size).description}
                            </div>
                          </div>
                        </div>
                        
                        <Button 
                          onClick={handleAnalyze}
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                          size="lg"
                          disabled={isAnalyzing}
                          data-testid="analyze-plan-button"
                        >
                          {isAnalyzing ? (
                            <>Analyzing Plan...</>
                          ) : (
                            <>
                              Analyze Plan - ${calculatePricing(uploadedFile.size).price}
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline"
                        className="w-full border-white/30 text-white hover:bg-white/10"
                        size="lg"
                        data-testid="upload-plan-button"
                      >
                        <Upload className="w-5 h-5 mr-2" />
                        Upload Plan or Blueprint
                      </Button>
                    )}
                    
                    <p className="text-xs text-blue-200">
                      Supports PDF, DWG, PNG, JPG files up to 50MB
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="py-20 bg-muted/30" data-testid="pricing-tiers">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Transparent File-Size Based Pricing
            </h2>
            <p className="text-xl text-muted-foreground">
              Automatic pricing based on your file size - no hidden fees, no subscriptions required.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pricingTiers.map((tier, index) => (
              <Card 
                key={tier.tier}
                className={`${tier.color} ${tier.popular ? 'ring-2 ring-blue-500 relative' : ''}`}
                data-testid={`pricing-tier-${index}`}
              >
                {tier.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white">
                    Most Popular
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {tier.tier}
                    <span className="text-2xl font-bold text-primary">{tier.price}</span>
                  </CardTitle>
                  <div className="text-lg font-semibold text-muted-foreground">{tier.size}</div>
                  <p className="text-sm text-muted-foreground">{tier.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {tier.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20" data-testid="features-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Advanced AI Analysis Features
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our GPT-5 powered analysis engine provides professional-grade insights that would take hours to calculate manually.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {features.map((feature, index) => (
              <Card key={feature.title} className="p-8" data-testid={`feature-${index}`}>
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-primary/10 rounded-lg flex-shrink-0">
                    <feature.icon className="w-8 h-8 text-primary" />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                    <div className="space-y-2">
                      {feature.benefits.map((benefit, idx) => (
                        <div key={idx} className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Sample Results */}
      <section className="py-20 bg-muted/30" data-testid="sample-results">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              See What You Get
            </h2>
            <p className="text-xl text-muted-foreground">
              Example results from our Plan Analysis Tool showing the detailed insights you'll receive.
            </p>
          </div>
          
          <Tabs defaultValue="spatial" className="max-w-4xl mx-auto">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="spatial">Spatial Mapping</TabsTrigger>
              <TabsTrigger value="materials">Material Lists</TabsTrigger>
              <TabsTrigger value="compliance">Code Compliance</TabsTrigger>
            </TabsList>
            
            {sampleResults.map((result, index) => (
              <TabsContent 
                key={index}
                value={["spatial", "materials", "compliance"][index]}
                className="mt-8"
              >
                <Card className="p-8">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-foreground mb-2">{result.title}</h3>
                    <p className="text-muted-foreground">{result.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.items.map((item, idx) => (
                      <Card key={idx} className="p-4 bg-muted/20">
                        <div className="flex items-start space-x-3">
                          <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <span className="text-xs font-semibold text-primary">{idx + 1}</span>
                          </div>
                          <span className="text-sm">{item}</span>
                        </div>
                      </Card>
                    ))}
                  </div>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20" data-testid="how-it-works">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground">
              Simple 4-step process to get professional plan analysis in minutes.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                title: "Upload Plan",
                description: "Upload your construction plan, blueprint, or schematic in PDF, DWG, or image format.",
                icon: Upload
              },
              {
                step: "2", 
                title: "Auto-Pricing",
                description: "System automatically detects file size and calculates pricing ($4.99-$39.99).",
                icon: DollarSign
              },
              {
                step: "3",
                title: "AI Analysis",
                description: "GPT-5 analyzes your plan for fittings, materials, codes, and costs in under 5 minutes.",
                icon: Brain
              },
              {
                step: "4",
                title: "Get Results",
                description: "Receive detailed PDF report with material lists, coordinates, and compliance check.",
                icon: Download
              }
            ].map((step, index) => (
              <Card key={step.step} className="text-center p-6" data-testid={`step-${index}`}>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-8 h-8 text-primary" />
                </div>
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold">{step.step}</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Ready to Analyze Your Plans?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join hundreds of Louisiana plumbers using AI to streamline their project planning and ensure code compliance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => fileInputRef.current?.click()}
              size="lg"
              className="bg-white text-blue-600 hover:bg-blue-50"
              data-testid="cta-upload-button"
            >
              <Upload className="w-5 h-5 mr-2" />
              Upload Your Plan Now
            </Button>
            <Link href="/tools/ai-pricing">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                View AI Tools Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}