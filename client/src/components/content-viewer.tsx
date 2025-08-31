import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  MessageSquare, 
  CheckCircle, 
  ExternalLink,
  RefreshCw,
  Loader2
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useStudySession } from "@/hooks/use-study-session";
import { useToast } from "@/hooks/use-toast";
import PodcastPlayer from "@/components/podcast-player";

interface ContentViewerProps {
  contentId?: string;
  contentType?: string;
  title?: string;
  courseId?: string;
  sectionId?: string;
  onComplete?: () => void;
}

export default function ContentViewer(props?: ContentViewerProps) {
  if (!props || !props.contentId || !props.contentType) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading content...</p>
        </div>
      </div>
    );
  }
  
  const { contentId, contentType, title, courseId, sectionId, onComplete } = props;
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { startSession, endSession } = useStudySession();
  
  // Start session when component loads
  useEffect(() => {
    if (contentId) {
      startSession(contentId);
    }
  }, [contentId, startSession]);

  // Stop any existing audio when component loads
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      console.log('Stopped any existing audio playback');
    }
  }, []);

  // Fetch content
  const { data: content, isLoading } = useQuery({
    queryKey: ["/api/course-content", contentId],
    enabled: !!contentId,
  });

  // Extract content mutation
  const extractMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/course-content/${contentId}/extract`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/course-content", contentId] });
      toast({ title: "Content extracted successfully!" });
    },
    onError: (error: any) => {
      toast({
        title: "Extraction failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Complete content mutation
  const completeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/course-content/${contentId}/complete`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/course-content"] });
      endSession();
      toast({ title: "Content completed!" });
      navigate("/courses");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to complete content",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleComplete = () => {
    completeMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="text-center p-8">
        <p>Content not found</p>
        <Button onClick={() => navigate("/courses")} className="mt-4">
          Back to Courses
        </Button>
      </div>
    );
  }

  // Check for autoStart parameter from URL (when user clicks Review)
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const shouldAutoStart = urlParams.get('autostart') === 'true';

  const renderPodcastContent = () => {
    const extracted = content?.content?.extracted;
    const podcastContent = extracted?.transcript || extracted?.content || extracted?.text || '';
    
    if (!podcastContent) {
      return (
        <div className="text-center p-6">
          <p className="mb-4">No podcast content available.</p>
          <Button onClick={() => extractMutation.mutate()} disabled={extractMutation.isPending}>
            {extractMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Generate Podcast
          </Button>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto">
        {/* Podcast Header */}
        <Card className="mb-6">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎧</span>
            </div>
            <CardTitle className="text-2xl">{content?.title || 'Podcast Lesson'}</CardTitle>
            <p className="text-muted-foreground">
              Audio lesson with interactive transcript
            </p>
          </CardHeader>
        </Card>

        {/* Podcast Player - Clean Interface */}
        <PodcastPlayer 
          content={podcastContent} 
          autoStart={shouldAutoStart} 
        />
        
        {/* Complete Button */}
        <Card className="mt-6">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">
              Listen to the complete audio lesson to mark as completed
            </p>
            <Button onClick={handleComplete} className="w-full max-w-sm mx-auto">
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete Podcast
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderTextContent = () => {
    const text = content?.content?.extracted?.content || content?.content?.text || content?.title || '';
    
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              {content.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              {text ? (
                <div dangerouslySetInnerHTML={{ __html: text.replace(/\n/g, '<br/>') }} />
              ) : (
                <p>No content available</p>
              )}
            </div>
            
            <Button onClick={handleComplete} className="w-full mt-6">
              Complete Reading
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderContent = () => {
    switch (contentType) {
      case 'podcast':
        return renderPodcastContent();
      default:
        return renderTextContent();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => navigate("/courses")}
          className="mb-4"
        >
          ← Back to Courses
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{content?.title || 'Content'}</h1>
            <Badge variant="secondary" className="mt-2">
              {contentType.charAt(0).toUpperCase() + contentType.slice(1)}
            </Badge>
          </div>
        </div>
      </div>

      {renderContent()}
    </div>
  );
}