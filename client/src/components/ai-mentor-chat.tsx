import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, Bot, User, Lightbulb, Timer, Download, Lock, Crown } from "lucide-react";
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

export default function AIMentorChat() {
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
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  // Check if user has AI mentor access (Professional/Master tiers only)
  const hasAIAccess = user ? AuthService.hasFeatureAccess(user, 'ai_mentor') : false;
  const userTier = user?.subscriptionTier || 'basic';

  const { data: conversations, isLoading } = useQuery({
    queryKey: ["/api/mentor/conversations"],
    enabled: hasAIAccess, // Only fetch conversations if user has AI access
  });

  const chatMutation = useMutation({
    mutationFn: ({ message, conversationId }: { message: string; conversationId?: string }) =>
      apiRequest("POST", "/api/mentor/chat", { message, conversationId }),
    onSuccess: (response) => {
      response.json().then((data) => {
        setSelectedConversation(data.conversationId);
        // Invalidate conversations to refetch updated data
        queryClient.invalidateQueries({ queryKey: ["/api/mentor/conversations"] });
      });
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
    if (!selectedConversation || !conversations) return null;
    return conversations.find((c: Conversation) => c.id === selectedConversation) || null;
  };

  const getQuickPrompts = () => [
    "What's the minimum pipe size for a 3-fixture bathroom?",
    "Explain water pressure requirements for residential buildings",
    "What are the Louisiana-specific fixture installation codes?",
    "How do I calculate pipe sizing for a commercial building?",
    "What's required for backflow prevention systems?",
    "Explain grease trap installation requirements",
  ];

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
    // Basic Plan: Downloadable Content Interface
    return (
      <div className="max-w-4xl mx-auto" data-testid="ai-mentor-chat">
        <Card className="min-h-[600px]">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-blue-600 flex items-center justify-center">
                  <Download className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Teach Me Chat - Study Materials
                    <Badge variant="secondary" className="text-xs">
                      <Download className="w-3 h-3 mr-1" />
                      Basic Plan
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Download comprehensive Louisiana plumbing code study materials
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Timer className="w-4 h-4" />
                <span>Session: {studySession.timeSpent}</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid gap-4">
              {getBasicContent().map((item, index) => (
                <Card key={index} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{item.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                    </div>
                    <Button 
                      asChild 
                      variant="outline" 
                      size="sm"
                      data-testid={`download-${index}`}
                    >
                      <a href={item.downloadUrl} download>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </a>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            <div className="mt-8 p-6 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-amber-600 flex items-center justify-center">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Unlock AI Mentor Chat
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Upgrade to Professional or Master plan to access our AI-powered mentor that provides instant, 
                    personalized answers to your plumbing code questions.
                  </p>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Bot className="w-4 h-4 text-orange-600" />
                      <span>Instant answers to any Louisiana plumbing code question</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Lightbulb className="w-4 h-4 text-orange-600" />
                      <span>Smart suggestions and code interpretation</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MessageCircle className="w-4 h-4 text-orange-600" />
                      <span>Interactive conversation-based learning</span>
                    </div>
                  </div>
                  <Button asChild className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700">
                    <Link href="/pricing">
                      Upgrade Now
                    </Link>
                  </Button>
                </div>
              </div>
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
                  AI Mentor Chat
                  <Badge variant="secondary" className="text-xs">
                    <Lightbulb className="w-3 h-3 mr-1" />
                    Smart Assistant
                  </Badge>
                  <Badge className="text-xs bg-gradient-to-r from-orange-500 to-amber-600">
                    <Crown className="w-3 h-3 mr-1" />
                    {userTier === 'master' ? 'Master' : 'Professional'}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Get instant help with Louisiana plumbing codes
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Timer className="w-4 h-4" />
              <span>Session: {studySession.timeSpent}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {/* Quick Action Prompts */}
          {!currentConversation && (
            <div className="p-4 border-b bg-muted/30">
              <h3 className="text-sm font-medium mb-3">Quick Start Prompts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {getQuickPrompts().map((prompt, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-xs justify-start h-auto py-2 px-3"
                    onClick={() => setCurrentMessage(prompt)}
                    data-testid={`quick-prompt-${index}`}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
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