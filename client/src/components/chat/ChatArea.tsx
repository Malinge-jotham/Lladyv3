import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { FaPaperPlane } from "react-icons/fa";

interface ChatAreaProps {
  userId: string;
}

export default function ChatArea({ userId }: ChatAreaProps) {
  const [messageText, setMessageText] = useState("");
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useQuery({
    queryKey: ["/api/messages", userId],
    retry: false,
  });

  const { data: otherUser } = useQuery({
    queryKey: ["/api/users", userId],
    retry: false,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: any) => {
      const response = await apiRequest("POST", "/api/messages", messageData);
      return response.json();
    },
    onSuccess: (newMessage) => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages", userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
      setMessageText("");
      
      // Send via WebSocket for real-time updates
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: "message",
          message: newMessage,
        }));
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  // WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WebSocket connected");
      setSocket(ws);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "message") {
          // Only refresh if the message is relevant to current conversation
          if (data.message.senderId === userId || data.message.receiverId === userId) {
            queryClient.invalidateQueries({ queryKey: ["/api/messages", userId] });
          }
          // Always refresh conversations list for new message notifications
          queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setSocket(null);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      ws.close();
    };
  }, [userId, queryClient]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages && Array.isArray(messages) && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageText.trim()) return;

    sendMessageMutation.mutate({
      receiverId: userId,
      content: messageText.trim(),
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-border">
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="flex-1 p-4 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
              <Skeleton className="h-12 w-48 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background" data-testid="chat-area">
      {/* Chat Header - Modern Design */}
      <div className="p-6 border-b border-border/50 bg-card/20 backdrop-blur-sm" data-testid="chat-header">
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative">
            {(otherUser as any)?.profileImageUrl ? (
              <img
                src={(otherUser as any).profileImageUrl}
                alt="User avatar"
                className="w-12 h-12 rounded-full object-cover border-2 border-border/20"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center border-2 border-border/20">
                <span className="text-primary font-semibold text-lg">
                  {(otherUser as any)?.firstName?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
            )}
            {/* Online indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-background"></div>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-foreground" data-testid="chat-user-name">
              {(otherUser as any)?.firstName} {(otherUser as any)?.lastName}
            </h3>
            <p className="text-sm text-green-500 font-medium">Typing...</p>
          </div>
        </div>
      </div>

      {/* Messages - Modern Design */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-background to-muted/10" data-testid="chat-messages">
        {/* Today label */}
        <div className="flex justify-center">
          <div className="bg-muted/50 text-muted-foreground text-xs px-3 py-1 rounded-full font-medium">
            Today
          </div>
        </div>
        
        {messages && Array.isArray(messages) && messages.length > 0 ? (
          messages.map((message: any, index: number) => {
            const isOwnMessage = message.senderId === (currentUser as any)?.id;
            const prevMessage = index > 0 ? messages[index - 1] : null;
            const isConsecutive = prevMessage && prevMessage.senderId === message.senderId;
            
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} ${
                  isConsecutive ? 'mt-1' : 'mt-4'
                }`}
                data-testid={`message-${message.id}`}
              >
                <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-xs`}>
                  {!isConsecutive && !isOwnMessage && (
                    <span className="text-xs text-muted-foreground mb-1 ml-3">
                      {(otherUser as any)?.firstName}
                    </span>
                  )}
                  <div
                    className={`px-4 py-3 rounded-2xl shadow-sm ${
                      isOwnMessage
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-card border border-border/50 text-foreground rounded-bl-md'
                    } ${isConsecutive ? 'rounded-t-2xl' : ''}`}
                  >
                    <p className="text-sm leading-relaxed" data-testid={`message-content-${message.id}`}>
                      {message.content}
                    </p>
                  </div>
                  <span
                    className={`text-xs mt-1 px-2 ${
                      isOwnMessage
                        ? 'text-muted-foreground'
                        : 'text-muted-foreground'
                    }`}
                    data-testid={`message-time-${message.id}`}
                  >
                    {formatTime(message.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground" data-testid="no-messages">
            <div className="text-center">
              <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="font-medium mb-1">No messages yet</p>
              <p className="text-sm">Start the conversation!</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input - Modern Design */}
      <div className="p-6 border-t border-border/50 bg-card/20 backdrop-blur-sm" data-testid="message-input-area">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type a message"
              className="w-full bg-muted/50 border border-border/50 rounded-full px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 focus:bg-background transition-colors"
              disabled={sendMessageMutation.isPending}
              data-testid="input-message"
            />
            {/* Attachment button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 rounded-full w-8 h-8 p-0 text-muted-foreground hover:text-foreground"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </Button>
          </div>
          
          {/* Voice message button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-full w-12 h-12 p-0 bg-primary/10 hover:bg-primary/20 text-primary"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
          </Button>

          {/* Send button */}
          {messageText.trim() && (
            <Button
              type="submit"
              disabled={!messageText.trim() || sendMessageMutation.isPending}
              className="rounded-full w-12 h-12 p-0 bg-primary hover:bg-primary/90 text-primary-foreground"
              data-testid="button-send-message"
            >
              {sendMessageMutation.isPending ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <FaPaperPlane />
              )}
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}
