import { useQuery } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ChevronRight, Headphones, Play, Pause, RotateCcw, SkipForward } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState, useRef, useEffect } from "react";

// Map friendly course identifiers to database UUIDs
function getCourseUUID(courseSlug: string): string {
  const courseMapping: { [key: string]: string } = {
    'journeyman-prep': 'b83c6ebe-f5bd-4787-8fd5-e3b177d9e79b',
    'backflow-prevention': 'b06e5cc6-3cec-4fe6-81ae-5f7cf5ade62e',
    'natural-gas': 'ce9dfb3e-f6ef-40ed-b578-25bff53eb2dc',
    'medical-gas': '547ca2fb-e3b3-46c7-a3ef-9e082401b510',
    'master-plumber': '2b8778aa-c3ec-43cd-887a-77ca0824a294'
  };
  return courseMapping[courseSlug] || courseSlug;
}

interface CourseContent {
  id: string;
  title: string;
  type: string;
  chapter: number;
  section: string;
  content: any;
  duration?: number;
  isActive: boolean;
  sortOrder: number;
}

export default function LessonPodcast() {
  const [match, params] = useRoute("/course/:courseId/lesson/:section/podcast");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const courseId = params?.courseId;
  const section = params?.section;
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  if (!courseId || !section) {
    return <div>Lesson not found</div>;
  }

  // Resolve friendly course ID to UUID for API calls
  const resolvedCourseId = getCourseUUID(courseId);

  // Fetch course content for this section
  const { data: content, isLoading: isContentLoading } = useQuery({
    queryKey: [`/api/courses/${resolvedCourseId}/content`],
    enabled: !!resolvedCourseId,
  });

  // Find podcast content for this section
  const podcastContent = Array.isArray(content) ? content.find((item: CourseContent) => 
    String(item.section) === section && 
    (item.type === 'podcast' || item.title?.toLowerCase().includes('podcast'))
  ) : undefined;

  // Track lesson step progress with current position
  const trackProgress = async (completed = false, position = currentTime) => {
    try {
      await apiRequest("POST", "/api/lesson-progress/track", {
        courseId: resolvedCourseId,
        section: parseInt(section),
        stepType: "podcast",
        stepIndex: 1,
        isCompleted: completed,
        currentPosition: { timestamp: position, duration }
      });
    } catch (error) {
      console.error("Failed to track progress:", error);
    }
  };

  // Load saved progress
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const response = await apiRequest("GET", `/api/lesson-progress/${resolvedCourseId}/${section}/podcast`);
        if (response.ok) {
          const progress = await response.json();
          if (progress.currentPosition?.timestamp) {
            setCurrentTime(progress.currentPosition.timestamp);
            if (audioRef.current) {
              audioRef.current.currentTime = progress.currentPosition.timestamp;
            }
          }
        }
      } catch (error) {
        console.error("Failed to load progress:", error);
      }
    };
    
    if (resolvedCourseId && section) {
      loadProgress();
    }
  }, [resolvedCourseId, section]);

  // Save progress periodically
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        trackProgress(false, currentTime);
      }, 30000); // Save every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [isPlaying, currentTime]);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    trackProgress(true, duration);
  };

  const handleContinue = () => {
    trackProgress(true, currentTime);
    navigate(`/course/${courseId}/lesson/${section}/flashcards`);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isContentLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href={`/course/${courseId}/lesson/${section}`}>
            <Button variant="ghost" size="sm" data-testid="button-back-lesson-flow">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Lesson Flow
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Headphones className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold">Section {section} Podcast</h1>
            <Badge variant="secondary">Step 2 of 6</Badge>
          </div>
        </div>

        {/* Content */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Headphones className="h-5 w-5 text-green-600" />
              </div>
              {podcastContent?.title || `Section ${section} Podcast`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {podcastContent?.content?.text ? (
              <div className="space-y-6">
                {/* Display podcast content */}
                <div 
                  className="prose max-w-none text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-em:text-foreground prose-blockquote:text-muted-foreground prose-code:text-foreground"
                  dangerouslySetInnerHTML={{ __html: podcastContent.content.text }}
                />
                
                {/* Audio placeholder for future implementation */}
                {/* Future audio player implementation */}
                
                {/* Audio Player */}
                {podcastContent?.content?.audioUrl ? (
                  <div className="bg-white rounded-lg p-6 border shadow-sm">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <Headphones className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Audio Lesson</h3>
                          <p className="text-sm text-gray-600">Professional narration of Section {section}</p>
                        </div>
                      </div>
                      
                      <audio
                        ref={audioRef}
                        src={podcastContent.content.audioUrl}
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        onEnded={handleEnded}
                        className="w-full"
                        data-testid="audio-player"
                      />
                      
                      <div className="flex items-center gap-4">
                        <Button
                          onClick={handlePlayPause}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                          data-testid="button-play-pause"
                        >
                          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          {isPlaying ? 'Pause' : 'Play'}
                        </Button>
                        
                        <div className="flex-1 flex items-center gap-2 text-sm text-gray-600">
                          <span>{formatTime(currentTime)}</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                            />
                          </div>
                          <span>{formatTime(duration)}</span>
                        </div>
                        
                        <Button
                          onClick={() => {
                            if (audioRef.current) {
                              audioRef.current.currentTime += 10;
                            }
                          }}
                          variant="ghost"
                          size="sm"
                          data-testid="button-skip-forward"
                        >
                          <SkipForward className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          onClick={() => {
                            if (audioRef.current) {
                              audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
                            }
                          }}
                          variant="ghost"
                          size="sm"
                          data-testid="button-rewind"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-300">
                    <div className="text-center py-8">
                      <Headphones className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">Audio Content Coming Soon</h3>
                      <p className="text-gray-600 mb-4">Professional audio lessons for Section {section} are currently in production.</p>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                        <p className="text-blue-800 text-sm">
                          <strong>Study Tip:</strong> Review the written content above and take notes on key administrative concepts while we prepare the audio lessons.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Podcast learning objectives */}
                <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-r-lg">
                  <h3 className="font-semibold text-blue-900 mb-3">Learning Objectives</h3>
                  <p className="text-blue-800">After completing this lesson, you'll understand the administrative framework governing Louisiana plumbing work.</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Headphones className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Podcast content for Section {section} is being prepared.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Link href={`/course/${courseId}/lesson/${section}`}>
            <Button variant="outline" data-testid="button-back-lesson-flow-bottom">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Lesson Flow
            </Button>
          </Link>
          
          <Button onClick={handleContinue} data-testid="button-continue-flashcards">
            Continue to Flashcards
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}