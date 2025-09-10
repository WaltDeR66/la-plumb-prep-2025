import { useQuery } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ChevronRight, Headphones, Play, Pause, RotateCcw, SkipForward } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState, useRef, useEffect } from "react";

// Static audio file mapping for immediate functionality
function getStaticAudioUrl(courseSlug: string, section: string): string | null {
  const audioMapping: { [key: string]: { [key: string]: string } } = {
    'journeyman-prep': {
      '101': '/audio/journeyman-prep/101.mp3'
    }
  };
  
  return audioMapping[courseSlug]?.[section] || null;
}

// Static content mapping for lessons without API dependency
function getStaticLessonContent(courseSlug: string, section: string): any {
  const contentMapping: { [key: string]: { [key: string]: any } } = {
    'journeyman-prep': {
      '101': {
        title: 'Louisiana State Plumbing Code - Section 101: Administration',
        content: {
          text: `
            <h2>Section 101: Administration</h2>
            <p>This section deals with the general administration of the Louisiana State Plumbing Code (LSPC). Understanding the administrative framework is crucial for all plumbing professionals working in Louisiana.</p>
            
            <h3>Key Topics Covered:</h3>
            <ul>
              <li>Authority and jurisdiction of the Louisiana State Plumbing Code</li>
              <li>Adoption and enforcement procedures</li>
              <li>Administrative responsibilities and procedures</li>
              <li>Permit and inspection requirements</li>
              <li>Code compliance and violations</li>
            </ul>
            
            <h3>Learning Objectives:</h3>
            <p>By the end of this lesson, you will understand:</p>
            <ul>
              <li>The legal authority behind Louisiana's plumbing regulations</li>
              <li>How the code is administered and enforced</li>
              <li>Your responsibilities as a plumbing professional</li>
              <li>The permit and inspection process</li>
            </ul>
          `
        }
      }
    }
  };
  
  return contentMapping[courseSlug]?.[section] || null;
}

// Map friendly course identifiers to database UUIDs (kept for compatibility)
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
  section: number;
  content: any;
  duration?: number;
  isActive: boolean;
  sortOrder: number;
}

export default function LessonPodcast() {
  const [match, params] = useRoute("/lesson-podcast/:courseId/:section");
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

  // Get static audio and content first for immediate functionality
  const staticAudioUrl = getStaticAudioUrl(courseId, section);
  const staticContent = getStaticLessonContent(courseId, section);
  
  // Resolve friendly course ID to UUID for API calls (fallback only)
  const resolvedCourseId = getCourseUUID(courseId);

  // Only fetch API data if static content is not available and AI features are enabled
  const enableAIFeatures = import.meta.env.VITE_ENABLE_AI_AUDIO === 'true';
  
  // Fetch podcast audio info (fallback for AI-generated content)
  const { data: podcastData, isLoading: isPodcastLoading, refetch: refetchPodcast } = useQuery({
    queryKey: [`/api/podcast/${resolvedCourseId}/${section}`],
    enabled: !staticAudioUrl && enableAIFeatures && !!resolvedCourseId && !!section,
    retry: false
  }) as { data: { url?: string; duration?: number; title?: string } | undefined, isLoading: boolean, refetch: any };

  // Fetch course content for text display (fallback for static content)
  const { data: content, isLoading: isContentLoading } = useQuery({
    queryKey: [`/api/courses/${resolvedCourseId}/content`],
    enabled: !staticContent && !!resolvedCourseId,
  });

  // Find podcast content for this section (fallback)
  const podcastContent = staticContent || (Array.isArray(content) ? content.find((item: CourseContent) => 
    item.section === parseInt(section) && 
    (item.type === 'podcast' || item.title?.toLowerCase().includes('podcast'))
  ) : undefined);

  // State for audio generation
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Track lesson step progress with current position (optional, non-blocking)
  const trackProgress = async (completed = false, position = currentTime) => {
    // Only track progress if authentication is available
    if (!enableAIFeatures) return;
    
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

  // Load saved progress (optional, non-blocking)
  useEffect(() => {
    const loadProgress = async () => {
      if (!enableAIFeatures) return;
      
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
    
    if (resolvedCourseId && section && enableAIFeatures) {
      loadProgress();
    }
  }, [resolvedCourseId, section, enableAIFeatures]);

  // Save progress periodically (optional, non-blocking)
  useEffect(() => {
    if (isPlaying && enableAIFeatures) {
      const interval = setInterval(() => {
        trackProgress(false, currentTime);
      }, 30000); // Save every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [isPlaying, currentTime, enableAIFeatures]);

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

  const generatePodcast = async () => {
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      const response = await apiRequest("POST", "/api/podcast/generate", {
        courseId: resolvedCourseId,
        section: section
      });
      
      if (response.ok) {
        // Refetch podcast data to get the new audio URL
        await refetchPodcast();
        toast({
          title: "Audio Generated!",
          description: "Your podcast audio is ready to play.",
        });
      } else {
        throw new Error("Failed to generate audio");
      }
    } catch (error: any) {
      setGenerationError(error.message || "Failed to generate audio");
      toast({
        title: "Generation Failed",
        description: "Could not generate podcast audio. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleContinue = () => {
    // Try to track progress but don't block navigation if it fails
    trackProgress(true, currentTime).catch(() => {});
    navigate(`/lesson-flashcards/${courseId}/${section}`);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Show loading only if we're waiting for fallback content and no static content is available
  if (!staticContent && (isContentLoading || isPodcastLoading)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  
  // Determine which audio URL to use (static first, then API)
  const audioUrl = staticAudioUrl || podcastData?.url;
  
  // Determine which content to display (static first, then API)
  const displayContent = staticContent || podcastContent;

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
              {displayContent?.title || `Section ${section} Podcast`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {displayContent?.content?.text ? (
              <div className="space-y-6">
                {/* Display podcast content */}
                <div 
                  className="prose max-w-none text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-em:text-foreground prose-blockquote:text-muted-foreground prose-code:text-foreground"
                  dangerouslySetInnerHTML={{ __html: displayContent.content.text }}
                />
                
                {/* Audio Player or Generation */}
                {audioUrl ? (
                  <div className="space-y-4">
                    <audio
                      ref={audioRef}
                      src={audioUrl}
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                      onEnded={handleEnded}
                      className="hidden"
                    />
                    
                    {/* Audio Player Controls */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <Button
                            onClick={handlePlayPause}
                            size="lg"
                            className="w-12 h-12 rounded-full"
                            data-testid="button-play-pause-podcast"
                          >
                            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                          </Button>
                          
                          <div className="text-sm text-muted-foreground">
                            {formatTime(currentTime)} / {formatTime(duration)}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (audioRef.current) {
                                audioRef.current.currentTime = Math.max(0, currentTime - 15);
                              }
                            }}
                            data-testid="button-rewind-podcast"
                          >
                            <RotateCcw className="h-4 w-4" />
                            -15s
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (audioRef.current) {
                                audioRef.current.currentTime = Math.min(duration, currentTime + 15);
                              }
                            }}
                            data-testid="button-forward-podcast"
                          >
                            <SkipForward className="h-4 w-4" />
                            +15s
                          </Button>
                          
                          <select
                            value={audioRef.current?.playbackRate || 1}
                            onChange={(e) => {
                              if (audioRef.current) {
                                audioRef.current.playbackRate = parseFloat(e.target.value);
                              }
                            }}
                            className="text-sm border rounded px-2 py-1"
                          >
                            <option value="0.75">0.75x</option>
                            <option value="1">1x</option>
                            <option value="1.25">1.25x</option>
                            <option value="1.5">1.5x</option>
                          </select>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-200"
                          style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
                        />
                      </div>
                    </div>
                  </div>
                ) : enableAIFeatures ? (
                  <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-300">
                    <div className="text-center py-8">
                      <Headphones className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">Generate Audio Lesson</h3>
                      <p className="text-gray-600 mb-4">Convert this lesson text to a professional audio podcast using AI voice synthesis.</p>
                      
                      {generationError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 max-w-md mx-auto">
                          <p className="text-red-800 text-sm">{generationError}</p>
                        </div>
                      )}
                      
                      <Button 
                        onClick={generatePodcast}
                        disabled={isGenerating}
                        className="bg-blue-600 hover:bg-blue-700"
                        data-testid="button-generate-audio"
                      >
                        {isGenerating ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                            Generating Audio...
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Generate Audio Lesson
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                    <div className="text-center py-6">
                      <Headphones className="h-10 w-10 mx-auto mb-3 text-blue-500" />
                      <h3 className="text-lg font-semibold text-blue-900 mb-2">Audio Content Coming Soon</h3>
                      <p className="text-blue-700 mb-4">Audio content for this section is currently being prepared. You can continue studying with the comprehensive text content above.</p>
                      <div className="text-sm text-blue-600 bg-blue-100 rounded-lg p-3 max-w-md mx-auto">
                        💡 <strong>Study Tip:</strong> Reading through the content first helps you better understand the audio when it becomes available!
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