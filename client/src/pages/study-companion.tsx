import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Send, Bot, User, Sparkles, BookOpen, Lightbulb, Zap } from "lucide-react";

interface ChatMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  emotion?: "happy" | "excited" | "helpful" | "thinking" | "encouraging";
}

export default function StudyCompanion() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [quizContext, setQuizContext] = useState<any>(null);

  // Fetch chat history
  const { data: chatHistory = [] } = useQuery<ChatMessage[]>({
    queryKey: ["/api/study-companion/chat"],
  });

  // Fetch user's current progress for context
  const { data: userProgress } = useQuery({
    queryKey: ["/api/user/progress"],
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      return await apiRequest("POST", "/api/mentor/chat", {
        message: userMessage,
        context: userProgress
      });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["/api/study-companion/chat"] });
      setIsTyping(false);
    },
    onError: (error: any) => {
      toast({
        title: "Chat Error",
        description: error.message || "Failed to send message",
        variant: "destructive"
      });
      setIsTyping(false);
    }
  });

  // Check for quiz review context on mount and auto-start conversation
  useEffect(() => {
    const storedContext = sessionStorage.getItem('aiMentorContext');
    if (storedContext) {
      try {
        const context = JSON.parse(storedContext);
        if (context.type === 'quiz_review') {
          setQuizContext(context);
          // Clear the context from session storage
          sessionStorage.removeItem('aiMentorContext');
          
          // Auto-start conversation with quiz context
          const quizMessage = `I just completed the ${context.title} and got ${context.incorrectCount} questions wrong out of ${context.totalQuestions} total (${context.score}% score). Can you help me understand the questions I missed?\n\nHere are the questions I got wrong:\n\n${context.questions}`;
          
          setIsTyping(true);
          sendMessageMutation.mutate(quizMessage);
        }
      } catch (error) {
        console.error('Error parsing quiz context:', error);
      }
    }
  }, [sendMessageMutation]);

  const handleSendMessage = async () => {
    if (!message.trim() || sendMessageMutation.isPending) return;

    const userMessage = message.trim();
    setMessage("");
    setIsTyping(true);

    try {
      await sendMessageMutation.mutateAsync(userMessage);
    } catch (error) {
      console.error("Error sending message:", error);
    }
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
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [chatHistory, isTyping]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const getCharacterEmoji = (emotion?: string) => {
    switch (emotion) {
      case "excited": return "🎉";
      case "helpful": return "🤝";
      case "thinking": return "🤔";
      case "encouraging": return "💪";
      default: return "🔧"; // Plumbing tool emoji as default
    }
  };

  const getCharacterName = () => "Pipe Buddy";

  const renderMessage = (msg: ChatMessage) => {
    const isUser = msg.role === "user";
    const characterEmoji = getCharacterEmoji(msg.emotion);
    
    return (
      <div
        key={msg.id}
        className={`flex gap-3 mb-4 ${isUser ? "flex-row-reverse" : "flex-row"}`}
      >
        <Avatar className="w-8 h-8 mt-1">
          {isUser ? (
            <AvatarFallback className="bg-blue-500 text-white">
              <User className="w-4 h-4" />
            </AvatarFallback>
          ) : (
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white">
              {characterEmoji}
            </AvatarFallback>
          )}
        </Avatar>
        
        <div className={`flex flex-col ${isUser ? "items-end" : "items-start"} max-w-[80%]`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-muted-foreground font-medium">
              {isUser ? "You" : getCharacterName()}
            </span>
            {!isUser && msg.emotion && (
              <Badge variant="secondary" className="text-xs px-2 py-0">
                {msg.emotion}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {new Date(msg.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </div>
          
          <div
            className={`rounded-lg px-4 py-2 ${
              isUser
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            }`}
          >
            <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xl">
              🔧
            </div>
            <div>
              <h1 className="text-3xl font-bold">Study Companion</h1>
              <p className="text-muted-foreground">
                Meet {getCharacterName()}, your friendly Louisiana plumbing study buddy!
              </p>
            </div>
          </div>
          
          {/* Character intro and quick actions */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-2xl">
                    🔧
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">
                    Hey there, future plumbing pro! 👋
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    I'm {getCharacterName()}, and I'm here to make learning the Louisiana State Plumbing Code 
                    fun and engaging! Ask me anything about pipes, codes, techniques, or just chat 
                    about your plumbing journey. I love helping students succeed! 
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMessage("Explain pipe sizing basics")}
                      className="text-xs"
                    >
                      <BookOpen className="w-3 h-3 mr-1" />
                      Pipe Sizing
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMessage("What are common code violations?")}
                      className="text-xs"
                    >
                      <Lightbulb className="w-3 h-3 mr-1" />
                      Code Tips
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMessage("Give me a study motivation boost!")}
                      className="text-xs"
                    >
                      <Zap className="w-3 h-3 mr-1" />
                      Motivation
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Interface */}
        <Card className="h-[600px] flex flex-col">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Chat with {getCharacterName()}
            </CardTitle>
            <CardDescription>
              Your personalized AI study companion for Louisiana plumbing certification
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
              <div className="space-y-4">
                {chatHistory.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bot className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">Start a conversation!</p>
                    <p className="text-sm">
                      Ask me anything about Louisiana plumbing codes, techniques, or just say hello!
                    </p>
                  </div>
                )}
                
                {chatHistory.map(renderMessage)}
                
                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex gap-3 mb-4">
                    <Avatar className="w-8 h-8 mt-1">
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                        🔧
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start max-w-[80%]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground font-medium">
                          {getCharacterName()}
                        </span>
                        <Badge variant="secondary" className="text-xs px-2 py-0">
                          thinking
                        </Badge>
                      </div>
                      <div className="bg-muted rounded-lg px-4 py-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            
            {/* Input Area */}
            <div className="p-6 border-t">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about Louisiana plumbing..."
                  disabled={sendMessageMutation.isPending}
                  className="flex-1"
                  data-testid="input-chat-message"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || sendMessageMutation.isPending}
                  size="icon"
                  data-testid="button-send-message"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                💡 Tip: Ask about specific code sections, pipe materials, installation techniques, or exam prep!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}