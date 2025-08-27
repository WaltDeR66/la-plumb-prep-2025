import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calculator, Camera, FileText, Upload, Download, AlertTriangle, CheckCircle, BookOpen, ExternalLink, Lock, Wand2, FileEdit, Users, BookOpenCheck } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PipeSizingCalculator from "@/components/calculator/pipe-sizing";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Tools() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handlePhotoUpload = async (file: File) => {
    if (!file) return;

    setIsAnalyzing(true);
    const formData = new FormData();
    formData.append('photo', file);

    try {
      const response = await apiRequest("POST", "/api/photos/upload", formData);
      const result = await response.json();
      setAnalysisResult(result);
      
      toast({
        title: "Photo Analysis Complete",
        description: "Your plumbing installation has been analyzed for code compliance.",
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to analyze photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePlanUpload = async (file: File) => {
    if (!file) return;

    setIsAnalyzing(true);
    const formData = new FormData();
    formData.append('plan', file);

    try {
      const response = await apiRequest("POST", "/api/plans/upload", formData);
      const result = await response.json();
      setAnalysisResult(result);
      
      toast({
        title: "Plan Analysis Complete",
        description: "Material list and code compliance check generated.",
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to analyze plans. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const tools = [
    {
      id: "pipe-sizing",
      title: "Pipe Sizing Calculator",
      description: "Calculate proper pipe sizes for water supply systems based on fixture units and flow rates.",
      icon: Calculator,
      category: "Calculators"
    },
    {
      id: "pressure-loss",
      title: "Pressure Loss Calculator",
      description: "Calculate pressure losses through fittings, valves, and straight pipe runs.",
      icon: Calculator,
      category: "Calculators"
    },
    {
      id: "photo-checker",
      title: "Photo Code Checker",
      description: "Upload photos of installations for AI-powered code compliance analysis.",
      icon: Camera,
      category: "AI Tools"
    },
    {
      id: "plan-analysis",
      title: "Plan Analysis Tool",
      description: "Upload construction plans for material lists and compliance checks.",
      icon: FileText,
      category: "AI Tools"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="gradient-hero text-white py-16" data-testid="tools-hero">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6" data-testid="tools-title">
              Professional Plumbing Tools
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8" data-testid="tools-description">
              Comprehensive suite of calculators and AI-powered analysis tools to support your plumbing work and studies.
            </p>
            <div className="flex items-center justify-center space-x-8 text-blue-100">
              <div className="flex items-center space-x-2">
                <Calculator className="w-5 h-5" />
                <span>Professional Calculators</span>
              </div>
              <div className="flex items-center space-x-2">
                <Camera className="w-5 h-5" />
                <span>AI Code Analysis</span>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Plan Analysis</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section className="py-16" data-testid="tools-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="calculators" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="calculators" data-testid="tab-calculators">Calculators</TabsTrigger>
              <TabsTrigger value="ai-tools" data-testid="tab-ai-tools">AI Tools</TabsTrigger>
              <TabsTrigger value="content-generator" data-testid="tab-content-generator">Content Generator</TabsTrigger>
              <TabsTrigger value="resources" data-testid="tab-resources">Resources</TabsTrigger>
            </TabsList>

            <TabsContent value="calculators" className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Pipe Sizing Calculator */}
                <Card className="lg:col-span-2" data-testid="pipe-sizing-tool">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Calculator className="w-5 h-5" />
                      <span>Pipe Sizing Calculator</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PipeSizingCalculator />
                  </CardContent>
                </Card>

                {/* Pressure Loss Calculator */}
                <Card data-testid="pressure-loss-tool">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Calculator className="w-5 h-5" />
                      <span>Pressure Loss Calculator</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Pipe Length (ft)</label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-border rounded-md bg-background"
                          placeholder="Enter length"
                          data-testid="input-pipe-length"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Flow Rate (GPM)</label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-border rounded-md bg-background"
                          placeholder="Enter flow rate"
                          data-testid="input-flow-rate"
                        />
                      </div>
                      <Button className="w-full" data-testid="calculate-pressure-loss">
                        Calculate Pressure Loss
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Flow Rate Calculator */}
                <Card data-testid="flow-rate-tool">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Calculator className="w-5 h-5" />
                      <span>Flow Rate Calculator</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Pipe Diameter (inches)</label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-border rounded-md bg-background"
                          placeholder="Enter diameter"
                          data-testid="input-pipe-diameter"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Velocity (ft/s)</label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-border rounded-md bg-background"
                          placeholder="Enter velocity"
                          data-testid="input-velocity"
                        />
                      </div>
                      <Button className="w-full" data-testid="calculate-flow-rate">
                        Calculate Flow Rate
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="ai-tools" className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Photo Code Checker */}
                <Card data-testid="photo-checker-tool">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Camera className="w-5 h-5" />
                      <span>Photo Code Checker</span>
                      <Badge variant="secondary">AI Powered</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-muted-foreground text-sm">
                        Upload photos of plumbing installations for instant AI-powered code compliance analysis.
                      </p>
                      
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handlePhotoUpload(file);
                        }}
                        data-testid="photo-input"
                      />
                      
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isAnalyzing}
                        className="w-full"
                        data-testid="upload-photo-button"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {isAnalyzing ? "Analyzing..." : "Upload Photo"}
                      </Button>

                      {analysisResult?.analysis && (
                        <div className="space-y-4 mt-6">
                          <div className="flex items-center space-x-2">
                            {analysisResult.analysis.isCompliant ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <AlertTriangle className="w-5 h-5 text-red-600" />
                            )}
                            <span className="font-medium">
                              {analysisResult.analysis.isCompliant ? "Code Compliant" : "Code Violations Found"}
                            </span>
                          </div>
                          
                          {analysisResult.analysis.violations?.length > 0 && (
                            <div>
                              <h4 className="font-medium text-red-600 mb-2">Violations:</h4>
                              <ul className="list-disc list-inside space-y-1 text-sm">
                                {analysisResult.analysis.violations.map((violation: string, index: number) => (
                                  <li key={index}>{violation}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {analysisResult.analysis.recommendations?.length > 0 && (
                            <div>
                              <h4 className="font-medium text-blue-600 mb-2">Recommendations:</h4>
                              <ul className="list-disc list-inside space-y-1 text-sm">
                                {analysisResult.analysis.recommendations.map((rec: string, index: number) => (
                                  <li key={index}>{rec}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Plan Analysis Tool */}
                <Card data-testid="plan-analysis-tool">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="w-5 h-5" />
                      <span>Plan Analysis Tool</span>
                      <Badge variant="secondary">AI Powered</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-muted-foreground text-sm">
                        Upload construction plans to generate material lists and code compliance checks.
                      </p>
                      
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handlePlanUpload(file);
                        }}
                        data-testid="plan-input"
                      />
                      
                      <Button
                        onClick={() => document.querySelector('input[data-testid="plan-input"]')?.click()}
                        disabled={isAnalyzing}
                        className="w-full"
                        data-testid="upload-plan-button"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        {isAnalyzing ? "Analyzing..." : "Upload Plans"}
                      </Button>

                      {analysisResult?.materialList && (
                        <div className="space-y-4 mt-6">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Material List</h4>
                            <Button size="sm" variant="outline" data-testid="download-materials">
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          </div>
                          
                          <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                              <thead className="bg-muted">
                                <tr>
                                  <th className="text-left p-3">Item</th>
                                  <th className="text-center p-3">Qty</th>
                                  <th className="text-right p-3">Cost</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {analysisResult.materialList.slice(0, 5).map((item: any, index: number) => (
                                  <tr key={index}>
                                    <td className="p-3">{item.item}</td>
                                    <td className="p-3 text-center">{item.quantity} {item.unit}</td>
                                    <td className="p-3 text-right">${item.estimatedCost}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          
                          <div className="text-right font-medium">
                            Total: ${analysisResult.totalEstimatedCost}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="content-generator" className="space-y-8">
              <div className="grid grid-cols-1 gap-8">
                <AdminCodeBooksSection />
                <LessonContentGenerator />
              </div>
            </TabsContent>

            <TabsContent value="resources" className="space-y-8">
              <div className="grid grid-cols-1 gap-6">
                <CodeBooksSection />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                <Card data-testid="resource-conversion">
                  <CardHeader>
                    <CardTitle>Unit Converter</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm mb-4">
                      Convert between different units commonly used in plumbing.
                    </p>
                    <Button variant="outline" className="w-full">
                      Open Converter
                    </Button>
                  </CardContent>
                </Card>

                <Card data-testid="resource-reference">
                  <CardHeader>
                    <CardTitle>Quick Reference</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm mb-4">
                      Common pipe sizes, fittings, and code requirements at a glance.
                    </p>
                    <Button variant="outline" className="w-full">
                      View Reference
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
}

// Admin section for privately uploading code books
function AdminCodeBooksSection() {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: privateCodeBooks, isLoading } = useQuery({
    queryKey: ["/api/admin/code-books"],
    queryFn: async () => {
      const response = await fetch("/api/admin/code-books");
      if (!response.ok) throw new Error("Failed to fetch private code books");
      return response.json();
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setUploading(true);
      const formData = new FormData();
      formData.append('codebook', file);
      
      const response = await apiRequest("POST", "/api/admin/code-books/upload", formData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Code Book Uploaded",
        description: "The code book has been uploaded privately and is ready for lesson content generation.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/code-books"] });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: () => {
      toast({
        title: "Upload Failed", 
        description: "Failed to upload code book. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setUploading(false);
    }
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a PDF file only.",
        variant: "destructive",
      });
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  return (
    <Card data-testid="admin-code-books">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Lock className="w-5 h-5" />
          <span>Private Code Books Management</span>
          <Badge variant="secondary">Admin Only</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start space-x-3">
              <Lock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Private Reference Library</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Upload code books privately for your reference only. These won't be distributed but will be used to generate original lesson content, study materials, and quizzes.
                </p>
              </div>
            </div>
          </div>

          {/* Upload Section */}
          <div className="space-y-4">
            <h4 className="font-medium">Upload New Code Book</h4>
            
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".pdf"
              onChange={handleFileSelect}
              data-testid="codebook-file-input"
            />
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                data-testid="select-codebook-button"
              >
                <FileText className="w-4 h-4 mr-2" />
                Select PDF
              </Button>
              
              {selectedFile && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>{selectedFile.name}</span>
                  <span>({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)</span>
                </div>
              )}
            </div>
            
            {selectedFile && (
              <Button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full"
                data-testid="upload-codebook-button"
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? "Uploading..." : "Upload Code Book"}
              </Button>
            )}
          </div>

          {/* Private Library List */}
          <div className="space-y-4">
            <h4 className="font-medium">Private Code Book Library</h4>
            
            {isLoading ? (
              <p className="text-muted-foreground text-sm">Loading private library...</p>
            ) : (!privateCodeBooks || privateCodeBooks.length === 0) ? (
              <div className="text-center py-8 bg-muted/50 rounded-lg">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Private Code Books</h3>
                <p className="text-muted-foreground text-sm">
                  Upload PDF code books to start generating lesson content.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {privateCodeBooks.map((book: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30" data-testid={`private-book-${index}`}>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h5 className="font-medium text-sm">{book.name}</h5>
                        <p className="text-xs text-muted-foreground">
                          Uploaded {new Date(book.uploadedAt).toLocaleDateString()} • {book.size}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      <Lock className="w-3 h-3 mr-1" />
                      Private
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// AI-powered lesson content generator
function LessonContentGenerator() {
  const [contentType, setContentType] = useState<'lesson' | 'quiz' | 'study-guide'>('lesson');
  const [topic, setTopic] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const { toast } = useToast();

  const generateContentMutation = useMutation({
    mutationFn: async (params: { type: string; topic: string }) => {
      setGenerating(true);
      const response = await apiRequest("POST", "/api/admin/generate-content", {
        contentType: params.type,
        topic: params.topic
      });
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedContent(data);
      toast({
        title: "Content Generated",
        description: `Your ${contentType} content has been generated successfully.`,
      });
    },
    onError: () => {
      toast({
        title: "Generation Failed",
        description: "Failed to generate content. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setGenerating(false);
    }
  });

  const handleGenerate = () => {
    if (!topic.trim()) {
      toast({
        title: "Missing Topic",
        description: "Please enter a topic for content generation.",
        variant: "destructive",
      });
      return;
    }
    generateContentMutation.mutate({ type: contentType, topic: topic.trim() });
  };

  const contentTypes = [
    { value: 'lesson', label: 'Lesson Plan', icon: FileEdit, description: 'Complete lesson with objectives and activities' },
    { value: 'quiz', label: 'Quiz & Test', icon: BookOpenCheck, description: 'Multiple choice and practical questions' },
    { value: 'study-guide', label: 'Study Guide', icon: BookOpen, description: 'Comprehensive study materials and summaries' }
  ];

  return (
    <Card data-testid="lesson-content-generator">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Wand2 className="w-5 h-5" />
          <span>AI Lesson Content Generator</span>
          <Badge variant="secondary">AI Powered</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-start space-x-3">
              <Wand2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-green-900 dark:text-green-100 mb-1">AI Content Creation</h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Generate original educational content based on your private code book library. All content created is yours to use and distribute.
                </p>
              </div>
            </div>
          </div>

          {/* Content Type Selection */}
          <div className="space-y-3">
            <Label htmlFor="content-type">Content Type</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {contentTypes.map((type) => (
                <div
                  key={type.value}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    contentType === type.value 
                      ? 'border-primary bg-primary/5' 
                      : 'border-muted hover:border-primary/50'
                  }`}
                  onClick={() => setContentType(type.value as any)}
                  data-testid={`content-type-${type.value}`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <type.icon className="w-4 h-4" />
                    <span className="font-medium text-sm">{type.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{type.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Topic Input */}
          <div className="space-y-2">
            <Label htmlFor="topic">Topic</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Water Pressure Systems, Backflow Prevention, Gas Line Installation"
              data-testid="topic-input"
            />
            <p className="text-xs text-muted-foreground">
              Enter the specific plumbing topic you want to create content for
            </p>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={generating || !topic.trim()}
            className="w-full"
            data-testid="generate-content-button"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            {generating ? "Generating Content..." : `Generate ${contentTypes.find(t => t.value === contentType)?.label}`}
          </Button>

          {/* Generated Content Display */}
          {generatedContent && (
            <div className="space-y-4 mt-6 p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Generated Content</h4>
                <Button size="sm" variant="outline" data-testid="download-generated-content">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <div dangerouslySetInnerHTML={{ __html: generatedContent.content || generatedContent.html }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CodeBooksSection() {
  const { data: codeBooks, isLoading } = useQuery({
    queryKey: ["/api/code-books"],
    queryFn: async () => {
      const response = await fetch("/api/code-books");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5" />
            <span>Code Books & Resources</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading available code books...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="code-books-section">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BookOpen className="w-5 h-5" />
          <span>Study Materials & Resources</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Download original study materials, lesson plans, and educational resources created specifically for Louisiana plumbing certification.
          </p>
          
          {(!codeBooks || codeBooks.length === 0) ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Study Materials Available</h3>
              <p className="text-muted-foreground text-sm">
                Original educational content will appear here once created.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {codeBooks.map((book: any, index: number) => (
                <Card key={index} className="hover:shadow-md transition-shadow" data-testid={`code-book-${index}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground mb-1 truncate" data-testid={`book-title-${index}`}>
                          {book.name}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {book.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{book.size}</span>
                          <Button 
                            size="sm" 
                            variant="outline"
                            asChild
                            data-testid={`download-book-${index}`}
                          >
                            <a href={book.url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1">
                              <Download className="w-3 h-3" />
                              <span>Download</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
