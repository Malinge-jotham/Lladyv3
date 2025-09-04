import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { FaPaperPlane, FaCheck, FaCheckDouble } from "react-icons/fa";

interface ChatAreaProps {
  userId: string;
}

// Helper function to format message timestamps like Twitter
const formatMessageTime = (timestamp: string | Date) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

// Group consecutive messages from the same sender
const groupMessages = (messages: any[]) => {
  if (!messages || messages.length === 0) return [];
  
  const groups: any[][] = [];
  let currentGroup = [messages[0]];
  
  for (let i = 1; i < messages.length; i++) {
    const current = messages[i];
    const previous = messages[i - 1];
    
    // Group if same sender and within 5 minutes
    const timeDiff = new Date(current.createdAt).getTime() - new Date(previous.createdAt).getTime();
    const withinTimeWindow = timeDiff < 5 * 60 * 1000; // 5 minutes
    
    if (current.senderId === previous.senderId && withinTimeWindow) {
      currentGroup.push(current);
    } else {
      groups.push(currentGroup);
      currentGroup = [current];
    }
  }
  
  groups.push(currentGroup);
  return groups;
};

export default function ChatArea({ userId }: ChatAreaProps) {
  const [messageText, setMessageText] = useState("");
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
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

  // WebSocket connection with typing indicators
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
          // Always refresh conversations list and unread count
          queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
          queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
        } else if (data.type === "typing") {
          if (data.userId === userId) {
            setIsTyping(data.isTyping);
          }
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

  // Focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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

  // Handle typing indicator
  const handleTyping = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: "typing",
        userId: (currentUser as any)?.id,
        isTyping: messageText.length > 0,
      }));
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleTyping();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [messageText]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col bg-background">
        <div className="p-4 border-b border-border bg-card">
          <Skeleton className="h-12 w-64" />
        </div>
        <div className="flex-1 p-4 space-y-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
              <div className="flex items-start space-x-3 max-w-md">
                {i % 2 === 0 && <Skeleton className="w-10 h-10 rounded-full" />}
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-16 w-64 rounded-2xl" />
                </div>
                {i % 2 !== 0 && <Skeleton className="w-10 h-10 rounded-full" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const messageGroups = groupMessages(Array.isArray(messages) ? messages : []);

  return (
    <div className="flex-1 flex flex-col bg-background" data-testid="chat-area">
      {/* Chat Header - Enhanced Twitter-like */}
      <div className="p-4 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10" data-testid="chat-header">
        <div className="flex items-center space-x-3">
          <div className="relative">
            {(otherUser as any)?.profileImageUrl ? (
              <img
                src={(otherUser as any).profileImageUrl}
                alt="User avatar"
                className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                <span className="text-lg font-semibold text-primary">
                  {(otherUser as any)?.firstName?.[0] || '?'}
                </span>
              </div>
            )}
            {/* Online status indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-card rounded-full"></div>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-lg" data-testid="chat-user-name">
              {(otherUser as any)?.firstName && (otherUser as any)?.lastName
                ? `${(otherUser as any).firstName} ${(otherUser as any).lastName}`
                : (otherUser as any)?.email || "Unknown User"}
            </p>
            <p className="text-sm text-green-600 font-medium">
              {isTyping ? "typing..." : "online"}
            </p>
          </div>
        </div>
      </div>

      {/* Messages - Twitter-like threading */}
      <div className="flex-1 overflow-y-auto p-4" data-testid="chat-messages">
        {messageGroups.length > 0 ? (
          <div className="space-y-8">
            {messageGroups.map((group, groupIndex) => {
              const isOwnMessage = group[0].senderId === (currentUser as any)?.id;
              const user = isOwnMessage ? currentUser : otherUser;
              
              return (
                <div key={groupIndex} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-start space-x-3 max-w-2xl ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {/* User Avatar */}
                    <div className="flex-shrink-0">
                      {(user as any)?.profileImageUrl ? (
                        <img
                          src={(user as any).profileImageUrl}
                          alt="User avatar"
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary">
                            {(user as any)?.firstName?.[0] || (user as any)?.email?.[0] || '?'}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Message Group */}
                    <div className={`flex flex-col space-y-1 ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                      {/* User Name and Time */}
                      <div className={`flex items-center space-x-2 mb-1 ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <span className="text-sm font-semibold text-foreground">
                          {isOwnMessage 
                            ? "You" 
                            : ((user as any)?.firstName && (user as any)?.lastName
                                ? `${(user as any).firstName} ${(user as any).lastName}`
                                : (user as any)?.email || "Unknown")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatMessageTime(group[0].createdAt)}
                        </span>
                      </div>
                      
                      {/* Message Bubbles */}
                      <div className="space-y-1">
                        {group.map((message, messageIndex) => (
                          <div key={message.id} className={`relative group`}>
                            <div
                              className={`px-4 py-2 rounded-2xl max-w-md break-words shadow-sm ${
                                isOwnMessage
                                  ? 'bg-primary text-primary-foreground rounded-br-md'
                                  : 'bg-muted text-foreground rounded-bl-md'
                              }`}
                              data-testid={`message-${message.id}`}
                            >
                              <p className="text-sm leading-relaxed" data-testid={`message-content-${message.id}`}>
                                {message.content}
                              </p>
                              
                              {/* Message Status for sent messages */}
                              {isOwnMessage && (
                                <div className="flex items-center justify-end mt-1">
                                  {message.isRead ? (
                                    <FaCheckDouble className="w-3 h-3 text-primary-foreground/60" />
                                  ) : (
                                    <FaCheck className="w-3 h-3 text-primary-foreground/60" />
                                  )}
                                </div>
                              )}
                            </div>
                            
                            {/* Timestamp on hover for individual messages */}
                            {group.length > 1 && (
                              <div className={`opacity-0 group-hover:opacity-100 transition-opacity text-xs text-muted-foreground mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                                {formatMessageTime(message.createdAt)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground" data-testid="empty-chat">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <FaPaperPlane className="w-6 h-6" />
            </div>
            <p className="text-lg mb-2">Start the conversation</p>
            <p className="text-sm">Send a message to begin chatting with {(otherUser as any)?.firstName || "this user"}</p>
          </div>
        )}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start mt-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">
                  {(otherUser as any)?.firstName?.[0] || '?'}
                </span>
              </div>
              <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-md max-w-xs">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input - Enhanced Twitter-like */}
      <div className="p-4 border-t border-border bg-card/80 backdrop-blur-sm" data-testid="message-input-area">
        <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder={`Message ${(otherUser as any)?.firstName || "user"}...`}
              className="min-h-[44px] py-3 px-4 pr-12 rounded-full border-2 focus:border-primary/30 resize-none"
              disabled={sendMessageMutation.isPending}
              data-testid="input-message"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
            
            {/* Send button integrated into input */}
            <Button
              type="submit"
              disabled={sendMessageMutation.isPending || !messageText.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 rounded-full"
              data-testid="button-send-message"
            >
              <FaPaperPlane className="w-3 h-3" />
            </Button>
          </div>
        </form>
        
        {/* Character count for longer messages */}
        {messageText.length > 200 && (
          <div className="text-right mt-2">
            <span className={`text-xs ${messageText.length > 500 ? 'text-destructive' : 'text-muted-foreground'}`}>
              {messageText.length}/500
            </span>
          </div>
        )}
      </div>
    </div>
  );
}