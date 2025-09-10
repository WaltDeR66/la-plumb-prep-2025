import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ChevronRight, RotateCcw, ChevronLeft, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";

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

interface Flashcard {
  id: string;
  front: string;
  back: string;
  difficulty?: string;
  chapter?: number;
  section?: number;
  codeReference?: string;
  category?: string;
}

export default function LessonFlashcards() {
  const [match, params] = useRoute("/lesson-flashcards/:courseId/:section");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const courseId = params?.courseId;
  const section = params?.section;
  
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [studiedCards, setStudiedCards] = useState<Set<string>>(new Set());

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

  // Find flashcards content for this section
  const flashcardsContent = Array.isArray(content) ? content.find((item: CourseContent) => 
    item.section === parseInt(section) && 
    (item.type === 'flashcards' || item.title?.toLowerCase().includes('flashcards'))
  ) : undefined;

  const flashcardsArray: Flashcard[] = flashcardsContent?.content?.flashcards || [];
  const currentCard = flashcardsArray[currentCardIndex];

  // Track lesson step progress
  const trackProgress = async (completed = false) => {
    try {
      await apiRequest("POST", "/api/lesson-progress/track", {
        courseId: resolvedCourseId,
        section: parseInt(section),
        stepType: "flashcards",
        stepIndex: 2,
        isCompleted: completed,
        currentPosition: { 
          cardIndex: currentCardIndex, 
          totalCards: flashcardsArray.length,
          studiedCount: studiedCards.size
        }
      });
    } catch (error) {
      console.error("Failed to track progress:", error);
    }
  };

  // Load saved progress
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const response = await apiRequest("GET", `/api/lesson-progress/${resolvedCourseId}/${section}/flashcards`);
        if (response.ok) {
          const progress = await response.json();
          if (progress.currentPosition?.cardIndex !== undefined) {
            setCurrentCardIndex(progress.currentPosition.cardIndex);
          }
          if (progress.currentPosition?.studiedCount) {
            // You might want to load which specific cards were studied
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

  // Save progress when card changes
  useEffect(() => {
    if (flashcardsArray.length > 0 && currentCardIndex >= 0) {
      trackProgress(false);
    }
  }, [currentCardIndex, studiedCards.size, flashcardsArray.length]);

  const handleNextCard = () => {
    if (currentCard) {
      setStudiedCards(prev => new Set(prev).add(currentCard.id));
    }
    
    if (currentCardIndex < flashcardsArray.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
      setShowAnswer(false);
    }
  };

  const handlePrevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(prev => prev - 1);
      setShowAnswer(false);
    }
  };

  const handleContinue = () => {
    const allStudied = studiedCards.size === flashcardsArray.length;
    trackProgress(allStudied);
    navigate(`/lesson-ai-chat/${courseId}/${section}`);
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
            <RotateCcw className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold">Section {section} Flashcards</h1>
            <Badge variant="secondary">Step 3 of 6</Badge>
          </div>
        </div>

        {/* Progress */}
        {flashcardsArray.length > 0 && (
          <div className="mb-6">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Card {currentCardIndex + 1} of {flashcardsArray.length}</span>
              <span>{studiedCards.size} studied</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentCardIndex + 1) / flashcardsArray.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Flashcard */}
        {currentCard ? (
          <Card className="mb-8 min-h-[400px]">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <RotateCcw className="h-5 w-5 text-purple-600" />
                  </div>
                  Louisiana Plumbing Code Flashcard
                </div>
                {currentCard.codeReference && (
                  <Badge variant="outline">{currentCard.codeReference}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Question */}
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-3">Question:</h3>
                  <p className="text-blue-800 text-lg leading-relaxed">{currentCard.front}</p>
                </div>

                {/* Answer */}
                <div className="bg-green-50 p-6 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-green-900">Answer:</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAnswer(!showAnswer)}
                      data-testid="button-toggle-answer"
                    >
                      {showAnswer ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                      {showAnswer ? "Hide" : "Reveal"} Answer
                    </Button>
                  </div>
                  
                  {showAnswer ? (
                    <p className="text-green-800 text-lg leading-relaxed">{currentCard.back}</p>
                  ) : (
                    <p className="text-green-600 italic">Click "Reveal Answer" to see the solution</p>
                  )}
                </div>

                {/* Card Navigation */}
                <div className="flex justify-between items-center pt-4">
                  <Button
                    variant="outline"
                    onClick={handlePrevCard}
                    disabled={currentCardIndex === 0}
                    data-testid="button-prev-card"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>

                  <div className="text-center">
                    {studiedCards.has(currentCard.id) && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        ✓ Studied
                      </Badge>
                    )}
                  </div>

                  <Button
                    onClick={handleNextCard}
                    disabled={currentCardIndex === flashcardsArray.length - 1}
                    data-testid="button-next-card"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-8">
            <CardContent className="text-center py-12">
              <RotateCcw className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <p className="text-muted-foreground">Flashcards for Section {section} are being prepared.</p>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <Link href={`/course/${courseId}/lesson/${section}`}>
            <Button variant="outline" data-testid="button-back-lesson-flow-bottom">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Lesson Flow
            </Button>
          </Link>
          
          <Button onClick={handleContinue} data-testid="button-continue-ai-chat">
            Continue to AI Chat
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}