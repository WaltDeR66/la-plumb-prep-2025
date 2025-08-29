import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, Bot, User, Lightbulb, Timer } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useStudySession } from "@/hooks/use-study-session";

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

  const { data: conversations, isLoading } = useQuery({
    queryKey: ["/api/mentor/conversations"],
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
    "How do I test a backflow prevention assembly?",
    "What are the Louisiana requirements for gas line pressure testing?",
    "Explain the difference between Type L and Type M copper pipe",
    "What clearances are required for water heater installation?",
  ];

  const currentConversation = getCurrentConversation();
  const messages = currentConversation?.messages || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[600px]" data-testid="ai-mentor-chat">
      {/* Conversation List */}
      <Card className="lg:col-span-1" data-testid="conversation-list">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5" />
            <span>Conversations</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <div className="space-y-2 p-4">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setSelectedConversation(null)}
                data-testid="new-conversation"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                New Conversation
              </Button>
              
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-12 bg-muted animate-pulse rounded"></div>
                  ))}
                </div>
              ) : conversations?.length > 0 ? (
                conversations.map((conversation: Conversation) => (
                  <Button
                    key={conversation.id}
                    variant={selectedConversation === conversation.id ? "default" : "ghost"}
                    className="w-full justify-start text-left h-auto p-3"
                    onClick={() => setSelectedConversation(conversation.id)}
                    data-testid={`conversation-${conversation.id}`}
                  >
                    <div className="truncate">
                      <p className="text-sm font-medium truncate">
                        {conversation.messages[0]?.content.substring(0, 30) || "New conversation"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(conversation.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </Button>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No conversations yet
                </p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Interface */}
      <Card className="lg:col-span-3" data-testid="chat-interface">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="w-5 h-5 text-primary" />
              <span>AI Plumbing Mentor</span>
              <Badge variant="secondary">Online</Badge>
            </div>
            {studySession.isActive && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Timer className="w-3 h-3" />
                {studySession.formattedTime}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Chat Messages */}
          <ScrollArea className="h-[400px] p-4" ref={scrollAreaRef} data-testid="chat-messages">
            {messages.length === 0 ? (
              <div className="text-center py-8 space-y-4">
                <Bot className="w-16 h-16 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Welcome to AI Mentor</h3>
                  <p className="text-muted-foreground">
                    Ask me anything about Louisiana plumbing codes, installation techniques, or exam preparation.
                  </p>
                </div>
                
                {/* Quick Prompts */}
                <div className="space-y-2 max-w-md mx-auto">
                  <p className="text-sm font-medium text-foreground">Quick questions to get started:</p>
                  {getQuickPrompts().map((prompt, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="w-full text-left text-xs h-auto p-2 justify-start"
                      onClick={() => setCurrentMessage(prompt)}
                      data-testid={`quick-prompt-${index}`}
                    >
                      <Lightbulb className="w-3 h-3 mr-2 flex-shrink-0" />
                      <span className="truncate">{prompt}</span>
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                    data-testid={`message-${index}`}
                  >
                    <div
                      className={`w-full p-3 rounded-lg ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
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
