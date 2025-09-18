import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, Bot, User, Timer, Lock, Crown, BookOpen } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useStudySession } from "@/hooks/use-study-session";
import { Link, useLocation } from "wouter";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface StandaloneAIMentorChatProps {
  className?: string;
}

export default function StandaloneAIMentorChat({ className }: StandaloneAIMentorChatProps) {
  const [currentMessage, setCurrentMessage] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Initialize study session tracking for chat
  const studySession = useStudySession({
    contentId: 'standalone-ai-mentor-chat',
    contentType: 'chat',
    autoStart: true
  });

  // Get current user data
  const { data: user } = useQuery<any>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const userTier = user?.subscriptionTier || 'basic';
  
  // AI Mentor Chat is only available to professional and master users
  const hasAIAccess = userTier === 'professional' || userTier === 'master';

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
          context: 'Complete Louisiana Plumbing Code',
          // No currentSection - this is complete codebook access
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

  // Redirect basic authenticated users to pricing page
  useEffect(() => {
    if (user && !hasAIAccess) {
      setLocation('/pricing');
    }
  }, [user, hasAIAccess, setLocation]);

  // Show upgrade prompt for unauthenticated users
  if (!user || !hasAIAccess) {
    return (
      <div className={`max-w-4xl mx-auto ${className}`} data-testid="standalone-ai-mentor-chat">
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
                    Complete Louisiana plumbing codebook access with AI mentor
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 flex items-center justify-center">
            <div className="text-center max-w-md">
              <Crown className="w-16 h-16 mx-auto mb-4 text-orange-500" />
              <h3 className="text-xl font-semibold mb-2">Complete Codebook AI Mentor</h3>
              <p className="text-muted-foreground mb-6">
                Get instant answers about any Louisiana plumbing code section, regulation, or installation procedure. 
                Our AI mentor has complete knowledge of the entire Louisiana State Plumbing Code.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BookOpen className="w-4 h-4 text-green-500" />
                  <span>Access to all Louisiana plumbing code sections</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Bot className="w-4 h-4 text-blue-500" />
                  <span>Intelligent AI responses with code references</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageCircle className="w-4 h-4 text-purple-500" />
                  <span>Unlimited questions and conversations</span>
                </div>
              </div>
              <Button asChild className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700">
                <Link href="/pricing">
                  Upgrade to Professional Plan
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
    <div className={`max-w-4xl mx-auto ${className}`} data-testid="standalone-ai-mentor-chat">
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
                  <Badge className="text-xs bg-gradient-to-r from-green-500 to-emerald-600">
                    <BookOpen className="w-3 h-3 mr-1" />
                    Complete Codebook
                  </Badge>
                  <Badge className="text-xs bg-gradient-to-r from-blue-500 to-purple-600">
                    <Bot className="w-3 h-3 mr-1" />
                    AI-Powered
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Ask about any Louisiana plumbing code section, installation procedures, or code compliance
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
          {/* Chat Messages */}
          <ScrollArea className="flex-1 p-4 overflow-hidden" ref={scrollAreaRef}>
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
                        <p className="text-sm whitespace-pre-wrap break-anywhere">{message.content}</p>
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
                <p className="text-lg font-medium mb-2">Start a conversation with your AI mentor!</p>
                <p className="text-sm">Ask about any Louisiana plumbing codes, installation procedures, or code compliance.</p>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                  <div className="text-left p-3 bg-muted/30 rounded-lg">
                    <p className="font-medium text-sm">Example questions:</p>
                    <ul className="text-xs space-y-1 mt-2 text-muted-foreground">
                      <li>• What are the pipe sizing requirements for 3-inch waste lines?</li>
                      <li>• How do I calculate water pressure for a 4-story building?</li>
                    </ul>
                  </div>
                  <div className="text-left p-3 bg-muted/30 rounded-lg">
                    <p className="font-medium text-sm">Ask about any topic:</p>
                    <ul className="text-xs space-y-1 mt-2 text-muted-foreground">
                      <li>• Installation procedures</li>
                      <li>• Code compliance requirements</li>
                    </ul>
                  </div>
                </div>
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
              AI mentor trained on complete Louisiana plumbing codes and industry best practices
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}