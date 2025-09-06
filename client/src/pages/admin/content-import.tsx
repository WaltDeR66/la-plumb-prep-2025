import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Upload, CheckCircle, AlertCircle, FileText } from "lucide-react";

interface ParsedContent {
  question: string;
  answer: string;
  keywords: string[];
  contentId?: string;
}

export default function ContentImport() {
  const [rawContent, setRawContent] = useState("");
  const [contentId, setContentId] = useState("");
  const [parsedContent, setParsedContent] = useState<ParsedContent[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: (content: ParsedContent[]) => 
      apiRequest("POST", "/api/admin/import-chat-content", { content }),
    onSuccess: () => {
      toast({
        title: "Content Imported Successfully",
        description: `${parsedContent.length} chat answers have been added to the system.`,
      });
      setRawContent("");
      setParsedContent([]);
      setContentId("");
    },
    onError: (error: any) => {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import content",
        variant: "destructive",
      });
    },
  });

  const parseContent = () => {
    setIsProcessing(true);
    
    try {
      const lines = rawContent.split('\n').filter(line => line.trim());
      const parsed: ParsedContent[] = [];
      let currentQuestion = "";
      let currentAnswer = "";
      let isAnswerMode = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip empty lines and emojis/icons
        if (!line || line.match(/^[🧠💡📚]+/) || line.startsWith('🧠 Key Concept:') || line.startsWith('💡 Key Information:')) {
          continue;
        }

        // Detect questions (lines ending with ?)
        if (line.endsWith('?')) {
          // Save previous question/answer pair if exists
          if (currentQuestion && currentAnswer) {
            const keywords = extractKeywords(currentQuestion, currentAnswer);
            parsed.push({
              question: currentQuestion,
              answer: currentAnswer.trim(),
              keywords,
              contentId: contentId || undefined
            });
          }
          
          currentQuestion = line;
          currentAnswer = "";
          isAnswerMode = true;
        } 
        // This is part of an answer
        else if (isAnswerMode && currentQuestion) {
          currentAnswer += line + "\n\n";
        }
        // Handle standalone informational content as Q&A
        else if (!currentQuestion && line.length > 20) {
          // Create a question from the content
          const generatedQuestion = generateQuestionFromContent(line);
          if (generatedQuestion) {
            const keywords = extractKeywords(generatedQuestion, line);
            parsed.push({
              question: generatedQuestion,
              answer: line,
              keywords,
              contentId: contentId || undefined
            });
          }
        }
      }

      // Handle the last question/answer pair
      if (currentQuestion && currentAnswer) {
        const keywords = extractKeywords(currentQuestion, currentAnswer);
        parsed.push({
          question: currentQuestion,
          answer: currentAnswer.trim(),
          keywords,
          contentId: contentId || undefined
        });
      }

      setParsedContent(parsed);
      toast({
        title: "Content Parsed Successfully",
        description: `Found ${parsed.length} question/answer pairs`,
      });
    } catch (error) {
      toast({
        title: "Parsing Failed",
        description: "Please check your content format and try again",
        variant: "destructive",
      });
    }
    
    setIsProcessing(false);
  };

  const extractKeywords = (question: string, answer: string): string[] => {
    const text = `${question} ${answer}`.toLowerCase();
    const keywords = new Set<string>();
    
    // Extract important terms
    const patterns = [
      /louisiana state plumbing code|lspc/g,
      /department of health and hospitals/g,
      /enforcement|authority|delegat/g,
      /legal basis|statutory/g,
      /r\.s\. \d+:\d+/g,
      /historical|promulgat|amend/g,
      /section \d+|§\d+/g,
      /state health officer/g,
      /violation|code/g
    ];
    
    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => keywords.add(match.trim()));
      }
    });
    
    // Add key individual words
    const importantWords = text.match(/\b(?:enforcement|authority|legal|basis|delegation|violation|code|plumbing|louisiana|health|officer|section|historical|promulgated|amended)\b/g);
    if (importantWords) {
      importantWords.forEach(word => keywords.add(word));
    }
    
    return Array.from(keywords);
  };

  const generateQuestionFromContent = (content: string): string | null => {
    if (content.includes("Louisiana State Plumbing Code")) {
      return "What is the Louisiana State Plumbing Code (LSPC)?";
    }
    if (content.includes("Department of Health and Hospitals")) {
      return "Who enforces the LSPC?";
    }
    if (content.includes("legal foundation") || content.includes("R.S.")) {
      return "What is the legal basis for the LSPC?";
    }
    if (content.includes("historical") || content.includes("promulgated")) {
      return "Tell me about the historical notes.";
    }
    if (content.includes("enforcement") || content.includes("authority")) {
      return "How is the LSPC enforced?";
    }
    return null;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <FileText className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Import Chat Content</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Import Form */}
        <Card data-testid="content-import-form">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="w-5 h-5" />
              <span>Import Educational Content</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="content-id">Content ID (Optional)</Label>
              <Input
                id="content-id"
                placeholder="e.g., section-101, lesson-1"
                value={contentId}
                onChange={(e) => setContentId(e.target.value)}
                data-testid="input-content-id"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="raw-content">Paste Your Educational Content</Label>
              <Textarea
                id="raw-content"
                placeholder="Paste your formatted content here..."
                className="h-64"
                value={rawContent}
                onChange={(e) => setRawContent(e.target.value)}
                data-testid="textarea-raw-content"
              />
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={parseContent}
                disabled={!rawContent.trim() || isProcessing}
                data-testid="button-parse-content"
              >
                <FileText className="w-4 h-4 mr-2" />
                {isProcessing ? "Parsing..." : "Parse Content"}
              </Button>
              
              {parsedContent.length > 0 && (
                <Button
                  onClick={() => importMutation.mutate(parsedContent)}
                  disabled={importMutation.isPending}
                  data-testid="button-import-content"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {importMutation.isPending ? "Importing..." : `Import ${parsedContent.length} Items`}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card data-testid="content-preview">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>Parsed Content Preview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {parsedContent.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No content parsed yet. Paste your content and click "Parse Content" to preview.
              </p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {parsedContent.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-2" data-testid={`parsed-item-${index}`}>
                    <div className="font-medium text-sm text-primary">
                      Q: {item.question}
                    </div>
                    <div className="text-sm text-muted-foreground line-clamp-3">
                      {item.answer.substring(0, 150)}...
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {item.keywords.slice(0, 5).map((keyword, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                      {item.keywords.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{item.keywords.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5" />
            <span>How to Use</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>1. <strong>Paste your educational content</strong> in the text area above</p>
            <p>2. <strong>Add a Content ID</strong> (optional) to associate with specific lessons</p>
            <p>3. <strong>Click "Parse Content"</strong> to automatically extract questions and answers</p>
            <p>4. <strong>Review the preview</strong> to ensure content was parsed correctly</p>
            <p>5. <strong>Click "Import"</strong> to add the content to the AI mentor system</p>
            <p className="mt-3 p-3 bg-muted rounded-lg">
              <strong>Supported Format:</strong> The parser looks for questions ending with "?" and treats the following text as answers. It also automatically generates questions from informational content about the Louisiana Plumbing Code.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}