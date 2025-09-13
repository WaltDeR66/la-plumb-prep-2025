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
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
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

  const { data: conversations, isLoading } = useQuery({
    queryKey: ["/api/mentor/conversations"],
    enabled: hasAIAccess, // Only fetch conversations if user has AI access
  });

  const chatMutation = useMutation({
    mutationFn: ({ message, conversationId }: { message: string; conversationId?: string }) =>
      apiRequest("POST", "/api/mentor/chat", { 
        message, 
        conversationId,
        currentSection: currentSection || '101' // Add section context
      }),
    onSuccess: async (response) => {
      try {
        const data = await response.json();
        setSelectedConversation(data.conversationId);
        // Invalidate conversations to refetch updated data
        await queryClient.invalidateQueries({ queryKey: ["/api/mentor/conversations"] });
        // Force refetch to ensure we get the latest conversation data
        queryClient.refetchQueries({ queryKey: ["/api/mentor/conversations"] });
      } catch (error) {
        console.error('Error parsing chat response:', error);
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

    chatMutation.mutate({
      message: currentMessage,
      conversationId: selectedConversation || undefined,
    });

    setCurrentMessage("");
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
  }, [conversations, selectedConversation]);

  const getCurrentConversation = (): Conversation | null => {
    if (!selectedConversation || !conversations || !Array.isArray(conversations)) return null;
    return conversations.find((c: Conversation) => c.id === selectedConversation) || null;
  };

  const getQuickPrompts = (currentSection?: string, userTier: string = 'basic') => {
    if (userTier !== 'basic') {
      // Professional/Master users get complete codebook prompts
      return [
        "Explain the enforcement authority across all Louisiana plumbing code sections",
        "What are the permit requirements for different types of plumbing installations?",
        "How do inspection procedures differ between residential and commercial projects?",
        "What are the violation penalties and appeal processes in Louisiana?",
        "Explain pipe sizing requirements for medical gas systems",
        "What are the backflow prevention requirements for different applications?"
      ];
    }
    
    // Basic users get section-specific prompts
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

  const currentConversation = getCurrentConversation();

  if (isLoading && hasAIAccess) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

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
                  AI Mentor Chat {userTier === 'basic' ? `- Section ${currentSection || '101'}` : '- Complete Codebook'}
                  {userTier === 'basic' ? (
                    <Badge variant="secondary" className="text-xs">
                      <Lightbulb className="w-3 h-3 mr-1" />
                      Section-Specific
                    </Badge>
                  ) : (
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
                    : 'Ask questions about any section of the Louisiana State Plumbing Code'
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
          {!currentConversation && (
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
                      Upgrade to Professional or Master to ask questions about any Louisiana plumbing code section!
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
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            {/* Show thinking indicator when AI is processing */}
            {chatMutation.isPending && (
              <div className="flex justify-start mb-4">
                <div className="flex items-start space-x-2 max-w-[80%]">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs">
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg p-3 animate-pulse">
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
            
            {currentConversation ? (
              <div className="space-y-4">
                {currentConversation.messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start space-x-2 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className={message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
                          {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`p-3 rounded-lg ${
                        message.role === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {chatMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="bg-muted p-3 rounded-lg w-full">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
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
              AI mentor is trained on Louisiana plumbing codes and industry best practices.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}