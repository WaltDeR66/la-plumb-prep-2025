import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "wouter";
import PodcastPlayer from "@/components/podcast-player";

export default function PodcastView() {
  const [match, params] = useRoute("/course/:courseId/podcast/:contentId");
  const contentId = params?.contentId;
  const courseId = params?.courseId;
  const [podcastProgress, setPodcastProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  
  const { data: content, isLoading, error } = useQuery({
    queryKey: [`/api/content/${contentId}/display`],
    enabled: !!contentId,
  });

  // Load saved progress from localStorage
  useEffect(() => {
    if (contentId) {
      const savedProgress = localStorage.getItem(`podcast-progress-${contentId}`);
      if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        setPodcastProgress(progress.sentenceIndex || 0);
        setIsCompleted(progress.completed || false);
      }
    }
  }, [contentId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to load content</p>
          <Button asChild>
            <Link href="/courses">Back to Courses</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Extract podcast content safely
  const podcastContent = content?.content?.extracted?.transcript || 
                        content?.content?.extracted?.content || 
                        content?.content?.extracted?.text || 
                        content?.content?.text || 
                        'No podcast content available';

  // Check for autostart from URL
  const urlParams = new URLSearchParams(window.location.search);
  const shouldAutoStart = urlParams.get('autostart') === 'true';

  const handleProgressUpdate = (sentenceIndex: number, totalSentences: number) => {
    const progress = (sentenceIndex / totalSentences) * 100;
    setPodcastProgress(sentenceIndex);
    
    // Save progress to localStorage
    localStorage.setItem(`podcast-progress-${contentId}`, JSON.stringify({
      sentenceIndex,
      totalSentences,
      completed: sentenceIndex >= totalSentences - 1,
      timestamp: Date.now()
    }));

    // Mark as completed if finished
    if (sentenceIndex >= totalSentences - 1) {
      setIsCompleted(true);
    }
  };

  const handleReturnToLesson = () => {
    // Navigate back to lesson page
    window.location.href = `/course/${courseId}/lesson/${content?.section || ''}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button asChild variant="outline" className="mb-6">
          <Link href="/courses">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Courses
          </Link>
        </Button>

        <Card className="mb-6">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎧</span>
            </div>
            <CardTitle className="text-2xl">
              {content?.title || 'Podcast Lesson'}
            </CardTitle>
            <p className="text-muted-foreground">
              Audio lesson with interactive transcript
            </p>
          </CardHeader>
        </Card>

        <PodcastPlayer 
          content={podcastContent} 
          autoStart={shouldAutoStart}
          initialProgress={podcastProgress}
          onProgressUpdate={handleProgressUpdate}
        />

        <Card className="mt-6">
          <CardContent className="p-6 text-center">
            <Button 
              className="w-full max-w-sm mx-auto"
              onClick={handleReturnToLesson}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Lesson {isCompleted && '(Completed)'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}