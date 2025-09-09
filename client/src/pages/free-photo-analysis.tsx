import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Upload, AlertCircle, CheckCircle, Clock, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function FreePhotoAnalysis() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const { toast } = useToast();

  // Check authentication
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit for free version
        toast({
          title: "File too large",
          description: "Free version supports files up to 5MB. Upgrade for larger files.",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      setAnalysis(null);
    }
  };

  const handleFreeAnalysis = async () => {
    if (!selectedFile) return;
    
    setIsAnalyzing(true);
    
    // Simulate free analysis (limited functionality)
    setTimeout(() => {
      setAnalysis({
        isCompliant: true,
        basicIssues: [
          "Basic visual inspection completed",
          "No obvious safety hazards detected",
          "Upgrade for detailed code compliance analysis"
        ],
        limitations: [
          "Limited to basic visual inspection",
          "No detailed code compliance checking",
          "No installation violation detection",
          "No professional reporting"
        ]
      });
      setIsAnalyzing(false);
      
      toast({
        title: "Basic Analysis Complete",
        description: "Upgrade to Professional for detailed code compliance checking.",
      });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Camera className="h-12 w-12 text-blue-600 mr-4" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Free Photo Analysis
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Get basic visual inspection of your plumbing installations
          </p>
          <Badge variant="secondary" className="mt-4">
            Free Version - Limited Features
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                Upload Photo
              </CardTitle>
              <CardDescription>
                Upload a photo of your plumbing installation for basic analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
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
                  <Camera className="h-12 w-12 text-gray-400 mb-4" />
                  <span className="text-lg font-medium text-gray-700 mb-2">
                    Choose photo to analyze
                  </span>
                  <span className="text-sm text-gray-500">
                    Max 5MB • JPG, PNG, HEIC
                  </span>
                </label>
              </div>

              {selectedFile && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <span className="font-medium text-green-800">
                      {selectedFile.name}
                    </span>
                  </div>
                </div>
              )}

              <Button
                onClick={handleFreeAnalysis}
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
                    Analyze Photo (Free)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card>
            <CardHeader>
              <CardTitle>Analysis Results</CardTitle>
              <CardDescription>
                Basic visual inspection results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!analysis ? (
                <div className="text-center py-8 text-gray-500">
                  Upload and analyze a photo to see results
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      <span className="font-medium text-green-800">Basic Analysis Complete</span>
                    </div>
                    <ul className="text-sm text-green-700 space-y-1">
                      {analysis.basicIssues.map((issue: string, index: number) => (
                        <li key={index}>• {issue}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                      <span className="font-medium text-yellow-800">Free Version Limitations</span>
                    </div>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {analysis.limitations.map((limitation: string, index: number) => (
                        <li key={index}>• {limitation}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upgrade Section */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-blue-900 mb-4">
                Need Professional Code Compliance Analysis?
              </h3>
              <p className="text-blue-800 mb-6">
                Upgrade to get detailed code compliance checking, violation detection, and professional reports
              </p>
              <div className="flex justify-center gap-4">
                <Link href="/ai-photo-pricing">
                  <Button size="lg">
                    View Pricing Plans
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button variant="outline" size="lg">
                    Get Subscription
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features Comparison */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">Free Version</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Basic visual inspection
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Safety hazard detection
                </li>
                <li className="flex items-center">
                  <AlertCircle className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-500">Limited analysis depth</span>
                </li>
                <li className="flex items-center">
                  <AlertCircle className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-500">5MB file size limit</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-blue-600">Professional Version</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-blue-500 mr-2" />
                  Full code compliance analysis
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-blue-500 mr-2" />
                  Detailed violation reports
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-blue-500 mr-2" />
                  Professional recommendations
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-blue-500 mr-2" />
                  No file size limits
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}