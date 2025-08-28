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
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [chatInputMessage, setChatInputMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const { data: content, isLoading, error } = useQuery<ExtractedContent>({
    queryKey: [`/api/content/${contentId}/display`],
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSpeechSynthesis(window.speechSynthesis);
      
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

  // Initialize chat with welcome message
  useEffect(() => {
    if (contentType === 'chat' && chatMessages.length === 0 && content?.content) {
      const extracted = content.content.extracted || content.content;
      const chatContent = extracted?.chatContent || extracted?.text;
      
      let welcomeMessage = `Welcome to the interactive chat for ${title}!\n\nI'm your AI tutor and I can help answer questions about Louisiana Plumbing Code Section 101 - Administration.`;
      
      if (chatContent) {
        // Extract key topics from the content
        welcomeMessage += `\n\nBased on the lesson content, here are the key areas we can discuss:\n\n• Who enforces the Louisiana State Plumbing Code (LSPC)\n• Legal basis and statutory authority (R.S. 36:258(B) and Title 40)\n• Historical notes (promulgated June 2002, amended November 2012)\n• Enforcement authority and delegation\n• Code violations and penalties\n\nWhat would you like to learn about?`;
      } else {
        welcomeMessage += `\n\nThis covers:\n\n• Code purpose and enforcement authority\n• Permit requirements and processes\n• Louisiana State Uniform Construction Code Council\n• Local jurisdiction requirements\n• Code violations and stop-work orders\n\nWhat would you like to learn about?`;
      }
      
      const initialMessage = {
        role: 'assistant' as const,
        content: welcomeMessage
      };
      setChatMessages([initialMessage]);
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
      const chatContent = extracted?.chatContent || extracted?.text || '';
      
      const response = await fetch('/api/mentor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: chatInputMessage,
          context: `Louisiana Plumbing Code lesson context: ${title}. Detailed lesson content: ${chatContent.substring(0, 1500)}. Student is learning about Section 101 Administration including enforcement authority (state health officer and delegation), legal basis (R.S. 36:258(B) and Title 40), historical notes (promulgated June 2002, amended November 2012), and code administration. Please provide educational responses focused on Louisiana plumbing code administration using the specific details from the lesson content.`
        })
      });
      
      const data = await response.json();
      const assistantMessage = { role: 'assistant' as const, content: data.response };
      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = { role: 'assistant' as const, content: 'Sorry, I encountered an error. Please try again or ask a different question about Louisiana Plumbing Code administration.' };
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

  const renderChatContent = () => {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <MessageSquare className="w-16 h-16 mx-auto text-primary mb-4" />
          <h3 className="text-xl font-semibold">Interactive Learning Chat</h3>
          <p className="text-muted-foreground mb-6">Ask questions about {title}</p>
        </div>
        
        <Card className="h-96 flex flex-col">
          <CardContent className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4">
              {chatMessages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
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
          {contentType === 'chat' && renderChatContent()}
        </CardContent>
      </Card>
    </div>
  );
}