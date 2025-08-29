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
  VolumeX, 
  MessageSquare, 
  CheckCircle, 
  ExternalLink,
  RefreshCw,
  Loader2,
  Settings,
  Clock
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
      content?: string;
      questions?: any[];
      cards?: any[];
      keyPoints?: string[];
      audioUrl?: string;
      transcript?: string;
      chatContent?: string;
      passingScore?: number;
    };
    chatContent?: string;
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
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'assistant', content: string, id?: string}>>([]);
  const [chatInputMessage, setChatInputMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<string>('auto');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null);
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [incorrectQuizAnswers, setIncorrectQuizAnswers] = useState<any[]>([]);

  const { data: content, isLoading, error } = useQuery<ExtractedContent>({
    queryKey: [`/api/content/${contentId}/display`],
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSpeechSynthesis(window.speechSynthesis);
      
      // Load available voices
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        const englishVoices = voices.filter(voice => 
          voice.lang.startsWith('en') && !voice.name.includes('eSpeak')
        );
        setAvailableVoices(englishVoices);
        
        // Load saved voice preference
        const savedVoice = localStorage.getItem('ai-mentor-voice');
        if (savedVoice) {
          setSelectedVoice(savedVoice);
        }
      };
      
      loadVoices();
      // Voices might not be loaded immediately, so listen for the voiceschanged event
      window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
      
      // Load voices if they're not ready yet
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.addEventListener('voiceschanged', () => {
          // Voices are now loaded
        });
      }
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

  // All content is pre-extracted and stored in the database
  const hasExtractedContent = !!content?.content?.extracted;
  
  // Helper function to get content text from various possible locations
  const getContentText = () => {
    const extracted = content?.content?.extracted;
    let text = extracted?.content || extracted?.html || extracted?.text || '';
    
    // Convert literal \n characters to actual HTML formatting
    if (text) {
      text = text
        .replace(/\\n\\n/g, '</p><p class="mb-4">')
        .replace(/\\n/g, '<br/>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/### (.*$)/gm, '<h3 class="text-lg font-semibold mt-6 mb-3">$1</h3>')
        .replace(/## (.*$)/gm, '<h2 class="text-xl font-bold mt-8 mb-4">$1</h2>')
        .replace(/# (.*$)/gm, '<h1 class="text-2xl font-bold mt-8 mb-6">$1</h1>');
      
      // Wrap in paragraph tags if not already HTML
      if (!text.includes('<')) {
        text = '<p class="mb-4">' + text + '</p>';
      }
    }
    
    return text;
  };

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
    
    const lessonContent = getContentText();
    if (!lessonContent) {
      return (
        <div className="text-center p-6">
          <p className="mb-4">No content available.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div 
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: lessonContent }}
        />
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
    const passingScore = content.content?.extracted?.passingScore || 70;
    
    
    if (questions.length === 0) {
      return (
        <div className="text-center p-6">
          <p className="mb-4">No quiz content available.</p>
          <Button onClick={() => extractMutation.mutate()} disabled={extractMutation.isPending}>
            {extractMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Extract Quiz
          </Button>
        </div>
      );
    }

    const handleAnswerSelect = (optionId: number) => {
      setSelectedQuizAnswer(optionId);
    };

    const nextQuestion = () => {
      if (selectedQuizAnswer !== null) {
        setUserAnswers(prev => ({
          ...prev,
          [currentQuestion]: selectedQuizAnswer
        }));
        setSelectedQuizAnswer(null);
        setCurrentQuestion(prev => prev + 1);
      }
    };

    const prevQuestion = () => {
      setCurrentQuestion(prev => prev - 1);
      setSelectedQuizAnswer(userAnswers[currentQuestion - 1] || null);
    };

    const submitQuiz = () => {
      // Record the last answer
      const finalAnswers = {
        ...userAnswers,
        [currentQuestion]: selectedQuizAnswer || -1
      };

      // Calculate score
      let correct = 0;
      const incorrect: any[] = [];

      questions.forEach((question: any, index: number) => {
        const userAnswer = finalAnswers[index];
        const correctAnswer = question.options.find((opt: any) => opt.isCorrect);
        
        if (userAnswer === correctAnswer?.id) {
          correct++;
        } else {
          incorrect.push({
            question: question.question,
            userAnswer: userAnswer !== -1 ? question.options[userAnswer]?.text || 'No answer' : 'No answer',
            correctAnswer: correctAnswer?.text,
            explanation: question.explanation,
            reference: question.reference
          });
        }
      });

      const score = Math.round((correct / questions.length) * 100);
      setQuizScore(score);
      setIncorrectQuizAnswers(incorrect);
      setShowQuizResults(true);
    };

    const restartQuiz = () => {
      setCurrentQuestion(0);
      setUserAnswers({});
      setSelectedQuizAnswer(null);
      setShowQuizResults(false);
      setQuizScore(0);
      setIncorrectQuizAnswers([]);
    };

    if (showQuizResults) {
      return (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-2">Quiz Results</h3>
            <div className={`text-4xl font-bold mb-4 ${quizScore >= passingScore ? 'text-green-600' : 'text-red-600'}`}>
              {quizScore}%
            </div>
            <p className="text-lg mb-4">
              You got {questions.length - incorrectQuizAnswers.length} out of {questions.length} questions correct
            </p>
            <p className={`text-lg font-semibold ${quizScore >= passingScore ? 'text-green-600' : 'text-red-600'}`}>
              {quizScore >= passingScore ? '🎉 PASSED!' : `❌ FAILED - Need ${passingScore}% to pass`}
            </p>
          </div>

          {incorrectQuizAnswers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Review Incorrect Answers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {incorrectQuizAnswers.map((item, index) => (
                  <div key={index} className="border-l-4 border-red-500 pl-4 space-y-2">
                    <p className="font-semibold">{item.question}</p>
                    <div className="space-y-1">
                      <p><span className="text-red-600 font-medium">Your answer:</span> {item.userAnswer}</p>
                      <p><span className="text-green-600 font-medium">Correct answer:</span> {item.correctAnswer}</p>
                      <p className="text-muted-foreground italic">{item.explanation}</p>
                      <p className="text-sm font-medium text-blue-600">📚 Reference: {item.reference}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="flex gap-4">
            <Button onClick={restartQuiz} variant="outline" className="flex-1">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retake Quiz
            </Button>
            <Button onClick={handleComplete} className="flex-1">
              {quizScore >= passingScore ? 'Continue to Next Lesson' : 'Study More'}
            </Button>
          </div>
        </div>
      );
    }

    const currentQ = questions[currentQuestion];
    const isLastQuestion = currentQuestion === questions.length - 1;

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">Louisiana Plumbing Code Quiz</h3>
          <Badge variant="outline">
            Question {currentQuestion + 1} of {questions.length}
          </Badge>
        </div>

        <Progress value={(currentQuestion / questions.length) * 100} />

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Question {currentQuestion + 1}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg mb-6">{currentQ.question}</p>
            <div className="space-y-3">
              {currentQ.options?.map((option: any, optIndex: number) => (
                <div
                  key={optIndex}
                  onClick={() => handleAnswerSelect(option.id)}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedQuizAnswer === option.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedQuizAnswer === option.id ? 'border-primary bg-primary' : 'border-muted-foreground'
                    }`}>
                      {selectedQuizAnswer === option.id && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                    <span className="text-base">{option.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={prevQuestion}
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>
          
          {isLastQuestion ? (
            <Button
              onClick={submitQuiz}
              disabled={selectedQuizAnswer === null}
              className="bg-green-600 hover:bg-green-700"
            >
              Submit Quiz
            </Button>
          ) : (
            <Button
              onClick={nextQuestion}
              disabled={selectedQuizAnswer === null}
            >
              Next Question
            </Button>
          )}
        </div>
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
    
    // Get available voices and select the best one
    const voices = speechSynthesis.getVoices();
    let selectedVoice = null;
    
    // Prefer high-quality voices in this order
    const preferredVoices = [
      'Microsoft Zira - English (United States)',
      'Microsoft David - English (United States)', 
      'Google US English Female',
      'Google US English Male',
      'Samantha',
      'Alex',
      'Victoria',
      'Daniel'
    ];
    
    for (const voiceName of preferredVoices) {
      selectedVoice = voices.find(voice => voice.name.includes(voiceName) || voice.name === voiceName);
      if (selectedVoice) break;
    }
    
    // Fallback to first English voice if no preferred voice found
    if (!selectedVoice) {
      selectedVoice = voices.find(voice => voice.lang.includes('en')) || voices[0];
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    // Optimize speech settings for educational content
    utterance.rate = 0.85; // Slightly slower for better comprehension
    utterance.pitch = 1.1; // Slightly higher pitch for engagement
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
    const podcastContent = getContentText();

    const handlePlayAudio = () => {
      if (podcastContent) {
        playAudio(podcastContent);
      }
    };
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-4">🎧 Audio Lesson</h3>
          
          {podcastContent || extracted?.audioUrl ? (
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
              ) : podcastContent ? (
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
                            onClick={isPlaying ? pauseAudio : () => playAudio(podcastContent)}
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
                    <div dangerouslySetInnerHTML={{ __html: podcastContent }} />
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center p-6">
              <p className="mb-4">No audio content available.</p>
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
          <p className="mb-4">No flashcards available.</p>
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
          <p className="mb-4">No study notes available.</p>
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
        
        <div 
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: lessonContent }}
        />
        
        <Button onClick={handleComplete} className="w-full">
          Complete Study Session
        </Button>
      </div>
    );
  };

  const renderStudyPlanContent = () => {
    if (!content?.content?.extracted) {
      return (
        <div className="text-center p-6">
          <p className="mb-4">No study plan available.</p>
          <Button onClick={() => extractMutation.mutate()} disabled={extractMutation.isPending}>
            {extractMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Extract Study Plan
          </Button>
        </div>
      );
    }

    const text = content.content.extracted.content || content.content.extracted.text;
    
    const parseMarkdownToHtml = (markdownText: string) => {
      return markdownText
        // First normalize line breaks
        .replace(/\\n/g, '\n')  // Convert \n literals to actual newlines
        .replace(/### (.*$)/gm, '<h3 class="text-lg font-semibold mt-6 mb-3 text-blue-700">$1</h3>')
        .replace(/## (.*$)/gm, '<h2 class="text-xl font-bold mt-8 mb-4 text-blue-800">$1</h2>')
        .replace(/# (.*$)/gm, '<h1 class="text-2xl font-bold mt-8 mb-6 text-blue-900">$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-800">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em class="italic text-gray-700">$1</em>')
        // Handle bullet points with proper spacing
        .replace(/^- (.*)$/gm, '<div class="flex items-start my-2"><span class="text-blue-600 mr-2">•</span><span class="text-gray-700">$1</span></div>')
        // Handle emojis
        .replace(/🕐|🕕/g, '<span class="text-2xl mr-2">⏰</span>')
        .replace(/✅/g, '<span class="text-green-500 font-bold text-lg">✓</span>')
        .replace(/🎯/g, '<span class="text-yellow-600 text-lg">🎯</span>')
        // Convert double newlines to paragraph breaks
        .replace(/\n\n/g, '</p><p class="mb-4">')
        // Convert single newlines to line breaks
        .replace(/\n/g, '<br/>')
        // Wrap in paragraph tags
        .replace(/^(.*)/, '<p class="mb-4">$1</p>');
    };

    return (
      <div className="space-y-6">
        <div className="text-center">
          <Clock className="w-16 h-16 mx-auto text-primary mb-4" />
          <h3 className="text-xl font-semibold mb-2">Time-Based Study Plans</h3>
          <p className="text-muted-foreground">Choose your available study time for a customized learning path</p>
        </div>

        <Card>
          <CardContent className="p-6">
            <div 
              className="prose prose-sm max-w-none study-plans-content"
              dangerouslySetInnerHTML={{ 
                __html: parseMarkdownToHtml(text || 'No study plan available.') 
              }}
            />
          </CardContent>
        </Card>

        <Button onClick={handleComplete} className="w-full">
          Complete Study Planning Session
        </Button>
      </div>
    );
  };

  // Initialize chat with welcome message
  useEffect(() => {
    if (contentType === 'chat' && chatMessages.length === 0 && content?.content) {
      const extracted = content.content?.extracted || content.content;
      const chatContent = extracted?.chatContent || extracted?.content || extracted?.text || '';
      
      let welcomeMessage = `Welcome to the interactive chat for ${title}!\n\nI'm your AI tutor and I can help answer questions about Louisiana Plumbing Code Section 101 - Administration.`;
      
      if (chatContent) {
        // Extract key topics from the content
        welcomeMessage += `\n\nBased on the lesson content, here are the key areas we can discuss:\n\n• Who enforces the Louisiana State Plumbing Code (LSPC)\n• Legal basis and statutory authority (R.S. 36:258(B) and Title 40)\n• Historical notes (promulgated June 2002, amended November 2012)\n• Enforcement authority and delegation\n• Code violations and penalties\n\nWhat would you like to learn about?`;
      } else {
        welcomeMessage += `\n\nThis covers:\n\n• Code purpose and enforcement authority\n• Permit requirements and processes\n• Louisiana State Uniform Construction Code Council\n• Local jurisdiction requirements\n• Code violations and stop-work orders\n\nWhat would you like to learn about?`;
      }
      
      const initialMessage = {
        role: 'assistant' as const,
        content: welcomeMessage,
        id: 'welcome-' + Date.now()
      };
      setChatMessages([initialMessage]);
      
      // Auto-play welcome message after a brief delay
      setTimeout(() => {
        if (autoPlayEnabled) {
          playMessageWithSpeech(welcomeMessage, initialMessage.id!);
        }
      }, 1000);
    }
  }, [contentType, chatMessages.length, title, content]);

  const sendChatMessage = async () => {
    if (!chatInputMessage.trim()) return;
    
    const userMessage = { role: 'user' as const, content: chatInputMessage };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInputMessage('');
    setIsChatLoading(true);

    try {
      const extracted = content?.content?.extracted || content?.content;
      const chatContent = extracted?.chatContent || extracted?.content || extracted?.text || '';
      
      const response = await fetch('/api/mentor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: chatInputMessage,
          context: `Louisiana Plumbing Code lesson context: ${title}. Detailed lesson content: ${chatContent.substring(0, 1500)}. Student is learning about Section 101 Administration including enforcement authority (state health officer and delegation), legal basis (R.S. 36:258(B) and Title 40), historical notes (promulgated June 2002, amended November 2012), and code administration. Please provide educational responses focused on Louisiana plumbing code administration using the specific details from the lesson content.`
        })
      });
      
      const data = await response.json();
      const assistantMessage = { role: 'assistant' as const, content: data.response, id: 'msg-' + Date.now() };
      setChatMessages(prev => [...prev, assistantMessage]);
      
      // Auto-play the response after a brief delay
      setTimeout(() => {
        if (autoPlayEnabled) {
          playMessageWithSpeech(data.response, assistantMessage.id!);
        }
      }, 500);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = { role: 'assistant' as const, content: 'Sorry, I encountered an error. Please try again or ask a different question about Louisiana Plumbing Code administration.', id: 'error-' + Date.now() };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const suggestedQuestions = [
    "Who enforces the Louisiana State Plumbing Code?",
    "What is the legal basis for the LSPC?",
    "Tell me about the historical notes and amendments",
    "How does enforcement authority delegation work?",
    "What happens if the code is violated?",
    "When was the code first promulgated?",
    "What are the key responsibilities of the state health officer?",
    "Can local jurisdictions add their own requirements?"
  ];

  const handleSuggestedQuestion = (question: string) => {
    setChatInputMessage(question);
    // Auto-send the question
    setTimeout(() => {
      const event = new KeyboardEvent('keypress', { key: 'Enter' });
      document.querySelector('input[type="text"]')?.dispatchEvent(event);
      sendChatMessage();
    }, 100);
  };

  const playMessageWithSpeech = (text: string, messageId: string) => {
    if (!speechSynthesis || !autoPlayEnabled) return;

    // Stop any currently playing speech
    speechSynthesis.cancel();
    
    // Enhanced text cleaning for more natural speech
    const cleanText = text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/•/g, '. ') // Replace bullet points with pauses
      .replace(/[🎓📅⚖️🏛️⬇️📋🔍📝👨‍⚖️🤝⚠️]/g, '') // Remove emojis
      .replace(/\n\n/g, '. ') // Replace double newlines with periods
      .replace(/\n/g, ', ') // Replace single newlines with commas for natural pauses
      .replace(/R\.S\./g, 'Revised Statute') // Make abbreviations readable
      .replace(/LSPC/g, 'Louisiana State Plumbing Code')
      .replace(/:/g, ', ') // Replace colons with commas for better flow
      .replace(/;/g, ', and ') // Replace semicolons for more natural speech
      .replace(/\.\s*\./g, '.') // Remove double periods
      .trim();

    // Split into sentences for more dynamic delivery
    const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    let currentSentenceIndex = 0;
    
    const speakNextSentence = () => {
      if (currentSentenceIndex >= sentences.length) {
        setCurrentPlayingId(null);
        return;
      }
      
      const sentence = sentences[currentSentenceIndex].trim();
      if (!sentence) {
        currentSentenceIndex++;
        speakNextSentence();
        return;
      }
      
      const utterance = new SpeechSynthesisUtterance(sentence);
      
      // Select voice based on user preference
      let preferredVoice = null;
      
      if (selectedVoice === 'auto') {
        // Auto-select best voice
        preferredVoice = availableVoices.find(voice => 
          voice.name.includes('Google') || 
          voice.name.includes('Microsoft') ||
          voice.name.includes('Alex') || 
          voice.name.includes('Samantha') || 
          voice.name.includes('Daniel') || 
          voice.quality === 'high' ||
          voice.localService === true
        ) || availableVoices[0];
      } else {
        // Use user-selected voice
        preferredVoice = availableVoices.find(voice => voice.name === selectedVoice) || availableVoices[0];
      }
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      // Dynamic speech parameters based on sentence content
      if (sentence.includes('Key') || sentence.includes('Important') || sentence.includes('Primary')) {
        utterance.rate = 0.8; // Slower for important points
        utterance.pitch = 1.1; // Slightly higher pitch for emphasis
      } else if (sentence.includes('?')) {
        utterance.rate = 0.9; // Normal speed for questions
        utterance.pitch = 1.2; // Higher pitch for questions
      } else {
        utterance.rate = 0.85; // Good educational pace
        utterance.pitch = 1.05; // Slightly varied pitch
      }
      
      utterance.volume = 0.85;
      
      utterance.onend = () => {
        currentSentenceIndex++;
        // Small pause between sentences
        setTimeout(speakNextSentence, 200);
      };
      
      utterance.onerror = () => {
        setCurrentPlayingId(null);
      };
      
      speechSynthesis.speak(utterance);
    };
    
    setCurrentPlayingId(messageId);
    setCurrentUtterance(null); // We'll manage multiple utterances
    speakNextSentence();
  };

  const stopSpeech = () => {
    if (speechSynthesis) {
      speechSynthesis.cancel();
      setCurrentPlayingId(null);
    }
  };

  const handleVoiceChange = (voiceName: string) => {
    setSelectedVoice(voiceName);
    localStorage.setItem('ai-mentor-voice', voiceName);
    
    // Preview the voice with a sample message
    setTimeout(() => {
      previewVoice(voiceName);
    }, 100);
  };

  const previewVoice = (voiceName: string) => {
    if (!speechSynthesis) return;
    
    speechSynthesis.cancel(); // Stop any current speech
    
    const previewText = "Hello! I'm your AI mentor for Louisiana Plumbing Code. I'm here to help you learn.";
    const utterance = new SpeechSynthesisUtterance(previewText);
    
    let voice = null;
    if (voiceName === 'auto') {
      voice = availableVoices.find(v => 
        v.name.includes('Google') || 
        v.name.includes('Microsoft') ||
        v.name.includes('Alex') || 
        v.localService === true
      ) || availableVoices[0];
    } else {
      voice = availableVoices.find(v => v.name === voiceName);
    }
    
    if (voice) {
      utterance.voice = voice;
    }
    
    utterance.rate = 0.85;
    utterance.pitch = 1.05;
    utterance.volume = 0.85;
    
    speechSynthesis.speak(utterance);
  };

  const renderChatContent = () => {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <MessageSquare className="w-16 h-16 mx-auto text-primary mb-4" />
          <h3 className="text-xl font-semibold">Interactive Learning Chat</h3>
          <p className="text-muted-foreground mb-4">Ask questions about {title}</p>
          
          {/* Audio controls */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoPlayEnabled(!autoPlayEnabled)}
                className="flex items-center gap-2"
              >
                {autoPlayEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                {autoPlayEnabled ? 'Auto-play ON' : 'Auto-play OFF'}
              </Button>
              {currentPlayingId && (
                <Button variant="outline" size="sm" onClick={stopSpeech}>
                  <Pause className="w-4 h-4 mr-1" />
                  Stop
                </Button>
              )}
            </div>
            
            {/* Voice selection */}
            <div className="flex items-center justify-center gap-2">
              <Settings className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">AI Mentor Voice:</span>
              <Select value={selectedVoice} onValueChange={handleVoiceChange}>
                <SelectTrigger className="w-52">
                  <SelectValue placeholder="Select voice" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">🤖 Auto (Best Quality)</SelectItem>
                  {availableVoices.map((voice) => {
                    const genderIcon = voice.name.includes('Samantha') || voice.name.includes('Victoria') ? '👩' : 
                                     voice.name.includes('Alex') || voice.name.includes('Daniel') ? '👨' : '🎙️';
                    const qualityLabel = voice.name.includes('Google') || voice.name.includes('Microsoft') || voice.localService ? ' ⭐' : '';
                    return (
                      <SelectItem key={voice.name} value={voice.name}>
                        {genderIcon} {voice.name.replace(' (Enhanced)', '')}{qualityLabel}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <Card className="h-96 flex flex-col">
          <CardContent className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4">
              {chatMessages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-2 max-w-[80%]`}>
                    <div
                      className={`p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                    
                    {/* Audio control for assistant messages */}
                    {message.role === 'assistant' && message.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => currentPlayingId === message.id ? stopSpeech() : playMessageWithSpeech(message.content, message.id!)}
                        className="mt-2 h-8 w-8 p-0"
                        data-testid={`audio-button-${message.id}`}
                      >
                        {currentPlayingId === message.id ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <input
                type="text"
                value={chatInputMessage}
                onChange={(e) => setChatInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                placeholder="Ask a question about Louisiana Plumbing Code administration..."
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isChatLoading}
              />
              <Button onClick={sendChatMessage} disabled={isChatLoading || !chatInputMessage.trim()}>
                Send
              </Button>
            </div>
          </div>
        </Card>
        
        {/* Suggested Questions */}
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold mb-3 text-sm text-muted-foreground">Suggested Questions to Explore:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {suggestedQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestedQuestion(question)}
                  disabled={isChatLoading}
                  className="text-left justify-start h-auto p-3 text-xs"
                >
                  {question}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
        
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
          {contentType === 'study-plan' && renderStudyPlanContent()}
          {contentType === 'chat' && renderChatContent()}
        </CardContent>
      </Card>
    </div>
  );
}