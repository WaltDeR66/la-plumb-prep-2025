import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, Bot, User, Lightbulb, Timer, Download, Lock, Crown, BookOpen } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useStudySession } from "@/hooks/use-study-session";
import { AuthService } from "@/lib/auth";
import { Link } from "wouter";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

interface AIMentorChatProps {
  currentSection?: string;
}

export default function AIMentorChat({ currentSection }: AIMentorChatProps = {}) {
  const [currentMessage, setCurrentMessage] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Initialize study session tracking for chat
  const studySession = useStudySession({
    contentId: 'ai-mentor-chat',
    contentType: 'chat',
    autoStart: true
  });

  // Get current user data
  const { data: user } = useQuery<any>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  // AI mentor access is available to all authenticated users
  const hasAIAccess = !!user;
  const userTier = user?.subscriptionTier || 'basic';


  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', content: string, timestamp: Date}>>([]);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch('/api/mentor/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          context: 'Louisiana Plumbing Code Section',
          currentSection: currentSection
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      return response;
    },
    onSuccess: async (response) => {
      try {
        const data = await response.json();
        // Add user message and AI response to local state
        setMessages(prev => [
          ...prev,
          { role: 'user', content: currentMessage, timestamp: new Date() },
          { role: 'assistant', content: data.response, timestamp: new Date() }
        ]);
      } catch (error) {
        console.error('Error parsing chat response:', error);
        toast({
          title: "Chat Error", 
          description: "Failed to parse response",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Chat Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!currentMessage.trim()) return;

    // Store the message before clearing it
    const messageToSend = currentMessage;
    setCurrentMessage("");
    
    chatMutation.mutate(messageToSend);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);


  const getQuickPrompts = (currentSection?: string, userTier: string = 'basic') => {
    // ALL users get section-specific prompts based on current lesson section
    const sectionSuggestions: { [key: string]: string[] } = {
      '101': [
        "Ask about the Louisiana State Health Officer's authority in plumbing code enforcement",
        "What are the key responsibilities of local plumbing inspectors under Section 101?", 
        "How does the delegation of authority work from state to local levels?",
        "What legal statutes support Louisiana plumbing code enforcement?"
      ],
      '103': [
        "What are the permit requirements for different types of plumbing work in Louisiana?",
        "When can plumbing work be done without a permit in Louisiana?",
        "What documentation must be submitted with a plumbing permit application?",
        "How long are plumbing permits valid in Louisiana?"
      ],
      '105': [
        "What qualifications are required for plumbing inspectors in Louisiana?",
        "How often must plumbing inspections be conducted during installation?",
        "What happens if a plumbing installation fails inspection?",
        "What records must be kept by plumbing inspectors?"
      ],
      '107': [
        "What are the violation notice procedures in Louisiana plumbing code?",
        "What penalties can be imposed for plumbing code violations?",
        "How are emergency situations handled under Louisiana plumbing enforcement?",
        "What is the process for appealing code violation citations?"
      ],
      '109': [
        "What are the requirements for plumbing plan approval in Louisiana?",
        "When must engineered drawings be submitted for plumbing systems?",
        "What technical standards must plumbing plans meet?",
        "How long does the plan review process typically take?"
      ]
    };

    return sectionSuggestions[currentSection || '101'] || sectionSuggestions['101'];
  };

  const getBasicContent = () => [
    {
      title: "Louisiana Plumbing Code Section 1: General Administration",
      description: "Complete overview of code administration and enforcement",
      downloadUrl: "/public-objects/louisiana-code-section-1.pdf"
    },
    {
      title: "Pipe Sizing Reference Guide",
      description: "Comprehensive tables and calculations for pipe sizing",
      downloadUrl: "/public-objects/pipe-sizing-guide.pdf"
    },
    {
      title: "Fixture Installation Standards",
      description: "Standard installation procedures for common fixtures",
      downloadUrl: "/public-objects/fixture-installation-guide.pdf"
    },
    {
      title: "Code Compliance Checklist",
      description: "Quick reference checklist for common inspections",
      downloadUrl: "/public-objects/compliance-checklist.pdf"
    },
  ];


  // Show different interface based on subscription tier
  if (!hasAIAccess) {
    // Redirect to upgrade - no download interface
    return (
      <div className="max-w-4xl mx-auto" data-testid="ai-mentor-chat">
        <Card className="min-h-[600px]">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-amber-600 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    AI Mentor Chat - Upgrade Required
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Get section-specific AI help with Louisiana plumbing codes
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 flex items-center justify-center">
            <div className="text-center max-w-md">
              <Crown className="w-16 h-16 mx-auto mb-4 text-orange-500" />
              <h3 className="text-xl font-semibold mb-2">Section-Specific AI Mentor</h3>
              <p className="text-muted-foreground mb-6">
                Get instant, intelligent answers about Section {currentSection || '101'} of Louisiana plumbing code.
                Our AI mentor provides contextual help specific to your current lesson.
              </p>
              <Button asChild className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700">
                <Link href="/pricing">
                  Upgrade to Access AI Mentor
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Professional/Master Plans: AI Chat Interface
  return (
    <div className="max-w-4xl mx-auto" data-testid="ai-mentor-chat">
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  AI Mentor Chat - Section {currentSection || '101'}
                  <Badge variant="secondary" className="text-xs">
                    <Lightbulb className="w-3 h-3 mr-1" />
                    Section {currentSection || '101'} Prompts
                  </Badge>
                  {userTier !== 'basic' && (
                    <Badge className="text-xs bg-gradient-to-r from-green-500 to-emerald-600">
                      <BookOpen className="w-3 h-3 mr-1" />
                      Complete Access
                    </Badge>
                  )}
                  <Badge className="text-xs bg-gradient-to-r from-blue-500 to-purple-600">
                    <Bot className="w-3 h-3 mr-1" />
                    AI-Powered
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {userTier === 'basic' 
                    ? `Get instant help with Louisiana plumbing code Section ${currentSection || '101'}`
                    : `Section ${currentSection || '101'} prompts shown - ask about any Louisiana plumbing code section`
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Timer className="w-4 h-4" />
              <span>Session: {studySession.formattedTime}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {/* Quick Action Prompts */}
          {messages.length === 0 && (
            <div className="p-4 border-b bg-muted/30">
              <h3 className="text-sm font-medium mb-3">Quick Start Prompts</h3>
              <div className="grid grid-cols-1 gap-2">
                {getQuickPrompts(currentSection, userTier).map((prompt, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-xs justify-start h-auto py-3 px-4 whitespace-normal text-left leading-relaxed min-h-[3rem]"
                    onClick={() => setCurrentMessage(prompt)}
                    data-testid={`quick-prompt-${index}`}
                  >
                    <span className="block">{prompt}</span>
                  </Button>
                ))}
                {userTier === 'basic' && (
                  <div className="mt-3 p-3 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 rounded-lg border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center gap-2 text-sm">
                      <Crown className="w-4 h-4 text-orange-500" />
                      <span className="font-medium text-orange-700 dark:text-orange-300">Want complete codebook access?</span>
                    </div>
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                      Professional and Master users can ask questions about any Louisiana plumbing code section, not just Section {currentSection || '101'}!
                    </p>
                    <Button asChild size="sm" className="mt-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white">
                      <Link href="/pricing">Upgrade Now</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Chat Messages */}
          <ScrollArea className="flex-1 p-4 overflow-x-hidden overflow-y-auto" ref={scrollAreaRef}>
            {messages.length > 0 ? (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start space-x-2 max-w-[80%] min-w-0 ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className={message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'}>
                          {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`p-3 rounded-lg min-w-0 max-w-full ${
                        message.role === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap break-words break-all">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Show thinking indicator when AI is processing */}
                {chatMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="flex items-start space-x-2 max-w-[80%] min-w-0">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                          <Bot className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-muted rounded-lg p-3 min-w-0 max-w-full">
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                          <span className="text-sm text-muted-foreground">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Start a conversation with your AI mentor!</p>
                <p className="text-sm">Ask about Louisiana plumbing codes, installation procedures, or code compliance.</p>
              </div>
            )}
          </ScrollArea>

          {/* Message Input */}
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <Input
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask your plumbing question..."
                disabled={chatMutation.isPending}
                className="flex-1"
                data-testid="message-input"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!currentMessage.trim() || chatMutation.isPending}
                data-testid="send-message"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {userTier === 'basic' 
                ? `AI mentor focused on Section ${currentSection || '101'} - upgrade for complete codebook access` 
                : 'AI mentor trained on complete Louisiana plumbing codes and industry best practices'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}