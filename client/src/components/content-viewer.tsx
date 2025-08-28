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
  Play, 
  Pause,
  Square,
  Volume2, 
  MessageSquare, 
  CheckCircle, 
  ExternalLink,
  RefreshCw,
  Loader2
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ContentViewerProps {
  contentId: string;
  contentType: string;
  title: string;
  courseId: string;
  sectionId?: string;
  onComplete?: () => void;
}

interface ExtractedContent {
  id: string;
  title: string;
  type: string;
  content: {
    extracted?: {
      html?: string;
      text?: string;
      questions?: any[];
      cards?: any[];
      keyPoints?: string[];
      audioUrl?: string;
      transcript?: string;
    };
    extractedAt?: string;
  };
  quizgeckoUrl?: string;
}

export default function ContentViewer({ contentId, contentType, title, courseId, sectionId, onComplete }: ContentViewerProps) {
  const [isCompleted, setIsCompleted] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: content, isLoading, error } = useQuery<ExtractedContent>({
    queryKey: [`/api/content/${contentId}/display`],
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSpeechSynthesis(window.speechSynthesis);
    }
  }, []);

  // Auto-start podcast audio for immediate playback
  useEffect(() => {
    if (contentType === 'podcast' && content?.content?.extracted?.transcript) {
      if (content?.content?.extracted?.audioUrl) {
        // If AI audio exists, play it
        setTimeout(() => {
          const audioElement = document.querySelector('audio') as HTMLAudioElement;
          if (audioElement) {
            audioElement.play().catch(error => {
              console.log('Auto-play prevented by browser:', error);
            });
          }
        }, 100);
      } else {
        // If no AI audio, immediately start browser TTS for instant playback
        setTimeout(() => {
          if (content.content.extracted.transcript) {
            playAudio(content.content.extracted.transcript);
          }
        }, 500); // Small delay to let component render
      }
    }
  }, [contentType, content?.content?.extracted?.transcript, content?.content?.extracted?.audioUrl]);

  const extractMutation = useMutation({
    mutationFn: () => fetch(`/api/extract-content/${contentId}`, { 
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/content/${contentId}/display`] });
    }
  });

  const generateAudioMutation = useMutation({
    mutationFn: () => fetch(`/api/generate-audio/${contentId}`, { 
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/content/${contentId}/display`] });
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 mb-4">Failed to load content</p>
        <Button onClick={() => extractMutation.mutate()} disabled={extractMutation.isPending}>
          {extractMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Try Again
        </Button>
      </div>
    );
  }

  const hasExtractedContent = content.content?.extracted;

  const handleComplete = () => {
    setIsCompleted(true);
    onComplete?.();
    
    // Navigate back to lesson page
    const lessonPath = sectionId 
      ? `/course/${courseId}/lesson/${sectionId}`
      : `/course/${courseId}/lesson`;
    setLocation(lessonPath);
  };

  const renderLessonContent = () => {
    const extracted = content.content?.extracted;
    
    if (!extracted?.html && !extracted?.text) {
      return (
        <div className="text-center p-6">
          <p className="mb-4">Content needs to be extracted from the source.</p>
          <Button onClick={() => extractMutation.mutate()} disabled={extractMutation.isPending}>
            {extractMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Extract Content
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {extracted.html && (
          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: extracted.html }}
          />
        )}
        {extracted.text && !extracted.html && (
          <div className="whitespace-pre-wrap text-foreground">
            {extracted.text}
          </div>
        )}
        
        <div className="flex items-center justify-between pt-6 border-t">
          <div className="flex items-center space-x-2">
            {isCompleted && <CheckCircle className="w-5 h-5 text-green-600" />}
            <span className="text-sm text-muted-foreground">
              {isCompleted ? "Completed" : "Mark as complete when finished reading"}
            </span>
          </div>
          <Button onClick={handleComplete} disabled={isCompleted}>
            {isCompleted ? "Completed" : "Mark Complete"}
          </Button>
        </div>
      </div>
    );
  };

  const renderQuizContent = () => {
    const questions = content.content?.extracted?.questions || [];
    
    if (questions.length === 0) {
      return (
        <div className="text-center p-6">
          <p className="mb-4">Quiz content needs to be extracted.</p>
          <Button onClick={() => extractMutation.mutate()} disabled={extractMutation.isPending}>
            {extractMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Extract Quiz
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold">Practice Quiz</h3>
          <p className="text-muted-foreground">{questions.length} questions</p>
        </div>
        
        {questions.map((question: any, index: number) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-lg">Question {index + 1}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">{question.question}</p>
              <div className="space-y-2">
                {question.options?.map((option: any, optIndex: number) => (
                  <div 
                    key={optIndex}
                    className={`p-3 rounded border cursor-pointer hover:bg-muted ${
                      option.isCorrect ? 'border-green-500 bg-green-50' : 'border-border'
                    }`}
                  >
                    {option.text}
                    {option.isCorrect && (
                      <CheckCircle className="w-4 h-4 text-green-600 inline ml-2" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        
        <Button onClick={handleComplete} className="w-full">
          Complete Quiz
        </Button>
      </div>
    );
  };

  const playAudio = (transcript: string) => {
    if (!speechSynthesis || !transcript) return;
    
    if (isPaused && currentUtterance) {
      speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    // Stop any existing speech
    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(transcript);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };
    
    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentUtterance(null);
    };
    
    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentUtterance(null);
    };
    
    setCurrentUtterance(utterance);
    speechSynthesis.speak(utterance);
  };

  const pauseAudio = () => {
    if (speechSynthesis && isPlaying) {
      speechSynthesis.pause();
      setIsPlaying(false);
      setIsPaused(true);
    }
  };

  const stopAudio = () => {
    if (speechSynthesis) {
      speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentUtterance(null);
    }
  };

  const renderPodcastContent = () => {
    const extracted = content.content?.extracted;

    const handlePlayAudio = () => {
      if (extracted?.transcript) {
        playAudio(extracted.transcript);
      }
    };
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-4">🎧 Audio Lesson</h3>
          
          {extracted?.transcript || extracted?.audioUrl ? (
            <div className="space-y-4">
              {extracted.audioUrl ? (
                <div className="space-y-4">
                  <Card className="bg-gradient-to-r from-green-50 to-emerald-50">
                    <CardContent className="p-6">
                      <div className="text-center mb-4">
                        <div className="inline-flex items-center space-x-2 text-green-600 mb-2">
                          <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                          <span className="text-sm font-medium">🎧 AI-Generated Audio Ready</span>
                        </div>
                      </div>
                      <audio 
                        controls 
                        className="w-full"
                        autoPlay
                        onPlay={() => setAudioPlaying(true)}
                        onPause={() => setAudioPlaying(false)}
                        onLoadedData={(e) => {
                          // Ensure auto-play starts when audio loads
                          const audio = e.target as HTMLAudioElement;
                          audio.play().catch(error => {
                            console.log('Auto-play prevented by browser:', error);
                          });
                        }}
                      >
                        <source src={extracted.audioUrl} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    </CardContent>
                  </Card>
                </div>
              ) : extracted.transcript ? (
                <div className="space-y-4">
                  <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardContent className="p-6">
                      <div className="text-center space-y-4">
                        <div className="flex items-center justify-center space-x-3">
                          {isPlaying ? (
                            <div className="w-6 h-6 bg-blue-600 rounded-full animate-pulse"></div>
                          ) : (
                            <Play className="w-6 h-6 text-blue-600" />
                          )}
                          <div>
                            <h4 className="font-medium text-gray-800">🎧 Audio Lesson Playing</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {isPlaying ? 'Now playing Louisiana Plumbing Code content' : 'Audio lesson ready to play'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-center space-x-4">
                          <Button
                            onClick={isPlaying ? pauseAudio : () => playAudio(extracted.transcript)}
                            size="lg"
                            className="flex items-center space-x-2"
                          >
                            {isPlaying ? (
                              <>
                                <Pause className="w-5 h-5" />
                                <span>Pause Audio</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-5 h-5" />
                                <span>{isPaused ? 'Resume Audio' : 'Play Audio'}</span>
                              </>
                            )}
                          </Button>
                          
                          {(isPlaying || isPaused) && (
                            <Button
                              onClick={stopAudio}
                              variant="outline"
                              size="lg"
                            >
                              <Square className="w-5 h-5 mr-2" />
                              Stop
                            </Button>
                          )}
                        </div>
                        
                        <div className="text-xs text-blue-600">
                          {isPlaying && "🔊 Playing audio lesson automatically"}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : null}
              
              {extracted.transcript && (
                <Card>
                  <CardHeader>
                    <CardTitle>📄 Transcript</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-left">{extracted.transcript}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center p-6">
              <p className="mb-4">Audio content needs to be extracted.</p>
              <Button onClick={() => extractMutation.mutate()} disabled={extractMutation.isPending}>
                {extractMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Extract Audio
              </Button>
            </div>
          )}
        </div>
        
        <Button onClick={handleComplete} className="w-full">
          Complete Lesson
        </Button>
      </div>
    );
  };

  const renderFlashcardsContent = () => {
    const cards = content.content?.extracted?.cards || [];
    const [currentCard, setCurrentCard] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    
    if (cards.length === 0) {
      return (
        <div className="text-center p-6">
          <p className="mb-4">Flashcards need to be extracted.</p>
          <Button onClick={() => extractMutation.mutate()} disabled={extractMutation.isPending}>
            {extractMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Extract Flashcards
          </Button>
        </div>
      );
    }

    const nextCard = () => {
      setCurrentCard((prev) => (prev + 1) % cards.length);
      setShowAnswer(false);
    };

    const prevCard = () => {
      setCurrentCard((prev) => (prev - 1 + cards.length) % cards.length);
      setShowAnswer(false);
    };

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold">Flashcards</h3>
          <p className="text-muted-foreground">Card {currentCard + 1} of {cards.length}</p>
        </div>
        
        <Card className="min-h-[200px] cursor-pointer" onClick={() => setShowAnswer(!showAnswer)}>
          <CardContent className="flex items-center justify-center h-full p-8">
            <div className="text-center">
              <p className="text-lg mb-4">
                {showAnswer ? cards[currentCard]?.back : cards[currentCard]?.front}
              </p>
              <p className="text-sm text-muted-foreground">
                Click to {showAnswer ? 'show question' : 'reveal answer'}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-between">
          <Button variant="outline" onClick={prevCard}>Previous</Button>
          <Button variant="outline" onClick={nextCard}>Next</Button>
        </div>
        
        <Progress value={(currentCard + 1) / cards.length * 100} />
        
        {currentCard === cards.length - 1 && (
          <Button onClick={handleComplete} className="w-full">
            Complete Flashcards
          </Button>
        )}
      </div>
    );
  };

  const renderStudyNotesContent = () => {
    const extracted = content.content?.extracted;
    
    if (!extracted?.keyPoints && !extracted?.html) {
      return (
        <div className="text-center p-6">
          <p className="mb-4">Study notes need to be extracted.</p>
          <Button onClick={() => extractMutation.mutate()} disabled={extractMutation.isPending}>
            {extractMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Extract Notes
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold">Study Notes</h3>
        
        {extracted.keyPoints && extracted.keyPoints.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Key Points</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {extracted.keyPoints.map((point: string, index: number) => (
                  <li key={index} className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
        
        {extracted.html && (
          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: extracted.html }}
          />
        )}
        
        <Button onClick={handleComplete} className="w-full">
          Complete Study Session
        </Button>
      </div>
    );
  };

  const renderChatContent = () => {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <MessageSquare className="w-16 h-16 mx-auto text-primary mb-4" />
          <h3 className="text-xl font-semibold">Interactive Learning Chat</h3>
          <p className="text-muted-foreground mb-6">Ask questions about {title}</p>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              Chat functionality coming soon! This will be integrated with the AI mentor system 
              to provide interactive Q&A about this specific lesson content.
            </p>
          </CardContent>
        </Card>
        
        {content.quizgeckoUrl && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              For now, you can access the interactive content at the source:
            </p>
            <Button asChild variant="outline">
              <a href={content.quizgeckoUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in QuizGecko
              </a>
            </Button>
          </div>
        )}
        
        <Button onClick={handleComplete} className="w-full">
          Complete Session
        </Button>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            <Badge variant="outline" className="mt-2">
              {contentType.charAt(0).toUpperCase() + contentType.slice(1)}
            </Badge>
          </div>
          
          {hasExtractedContent && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                Extracted {content.content?.extractedAt ? 
                  new Date(content.content.extractedAt).toLocaleDateString() : 
                  'recently'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          {contentType === 'lesson' && renderLessonContent()}
          {contentType === 'quiz' && renderQuizContent()}
          {contentType === 'podcast' && renderPodcastContent()}
          {contentType === 'flashcards' && renderFlashcardsContent()}
          {contentType === 'study-notes' && renderStudyNotesContent()}
          {contentType === 'chat' && renderChatContent()}
        </CardContent>
      </Card>
    </div>
  );
}