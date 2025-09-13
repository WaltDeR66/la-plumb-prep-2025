import { useQuery } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ChevronRight, Headphones } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import PodcastSyncPlayer from "@/components/podcast-sync-player";

// Utility function to clean HTML content for display
function cleanHtmlContent(content: string): string {
  if (!content) return '';
  
  // If content contains HTML tags as text (not actual HTML), strip them
  if (content.includes('&lt;') || content.includes('&gt;') || 
      (content.includes('<') && content.includes('>') && 
       !content.match(/<\s*\w+[^>]*>/))) {
    // Remove HTML tags that are showing as text
    return content
      .replace(/<\/?[^>]+(>|$)/g, '') // Remove HTML tags
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }
  
  return content;
}

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
  
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

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
    (item.type === 'podcast' || item.title?.toLowerCase().includes('podcast')) &&
    (item.content?.extracted?.transcript || item.content?.extracted?.content || item.content?.text)
  ) : undefined;

  // Debug: Log the content to see what we're getting (remove after fixing)
  if (podcastContent) {
    console.log('Debug - Found podcast content for section:', section);
    console.log('Debug - Podcast has transcript:', !!podcastContent?.content?.extracted?.transcript);
    console.log('Debug - Transcript length:', podcastContent?.content?.extracted?.transcript?.length);
  } else {
    console.log('Debug - No podcast content found for section:', section);
    console.log('Debug - Available sections:', Array.isArray(content) ? content.map(item => ({section: item.section, type: item.type, title: item.title})) : []);
  }

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

  // Handle progress updates from the podcast player
  const handleProgressUpdate = (time: number, dur: number) => {
    setCurrentTime(time);
    if (dur && dur !== duration) {
      setDuration(dur);
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
    const interval = setInterval(() => {
      if (currentTime > 0) {
        trackProgress(false, currentTime);
      }
    }, 30000); // Save every 30 seconds
    
    return () => clearInterval(interval);
  }, [currentTime]);

  const handleContinue = () => {
    trackProgress(true, currentTime);
    navigate(`/course/${courseId}/lesson/${section}/flashcards`);
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
            {(podcastContent?.content?.extracted?.transcript || podcastContent?.content?.extracted?.content || podcastContent?.content?.text) ? (
              <div className="space-y-6">
                {/* Synchronized Audio Player and Transcript */}
                <PodcastSyncPlayer
                  audioSrc={podcastContent?.content?.audioUrl}
                  transcript={cleanHtmlContent(podcastContent.content.extracted?.transcript || podcastContent.content.extracted?.content || podcastContent.content.text || '')}
                  segments={podcastContent?.content?.segments}
                  onProgressUpdate={handleProgressUpdate}
                />

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