import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { FaPaperPlane, FaCheck, FaCheckDouble, FaPhone, FaPaperclip, FaSmile } from "react-icons/fa";

interface ChatAreaProps {
  userId: string;
}

// Helper function to format message timestamps like the mockup
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

// Check if messages are from today
const isToday = (date: string | Date) => {
  const messageDate = new Date(date);
  const today = new Date();
  return messageDate.toDateString() === today.toDateString();
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
      <div className="flex-1 flex flex-col bg-slate-900">
        <div className="p-4 border-b border-slate-700 bg-slate-800">
          <Skeleton className="h-12 w-64 bg-slate-700" />
        </div>
        <div className="flex-1 p-4 space-y-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
              <div className="flex items-start space-x-3 max-w-md">
                {i % 2 === 0 && <Skeleton className="w-10 h-10 rounded-full bg-slate-700" />}
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48 bg-slate-700" />
                  <Skeleton className="h-16 w-64 rounded-2xl bg-slate-700" />
                </div>
                {i % 2 !== 0 && <Skeleton className="w-10 h-10 rounded-full bg-slate-700" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const messageGroups = groupMessages(Array.isArray(messages) ? messages : []);
  const hasMessages = messageGroups.length > 0;
  const showTodayLabel = hasMessages && isToday(messageGroups[0][0].createdAt);

  return (
    <div className="flex-1 flex flex-col bg-slate-900" data-testid="chat-area">
      {/* Chat Header - Enhanced like the mockup */}
      <div className="p-4 border-b border-slate-700 bg-slate-800 sticky top-0 z-10" data-testid="chat-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              {(otherUser as any)?.profileImageUrl ? (
                <img
                  src={(otherUser as any).profileImageUrl}
                  alt="User avatar"
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
                  <span className="text-lg font-semibold text-white">
                    {(otherUser as any)?.firstName?.[0] || '?'}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-lg text-white" data-testid="chat-user-name">
                {(otherUser as any)?.firstName && (otherUser as any)?.lastName
                  ? `${(otherUser as any).firstName} ${(otherUser as any).lastName}`
                  : (otherUser as any)?.email || "Unknown User"}
              </p>
              <p className="text-sm text-slate-400 font-medium">
                {isTyping ? "typing..." : "online"}
              </p>
            </div>
          </div>
          
          {/* Call Button like in mockup */}
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-slate-700 rounded-full w-10 h-10 p-0"
          >
            <FaPhone className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-900" data-testid="chat-messages">
        {/* Today Label */}
        {showTodayLabel && (
          <div className="text-center mb-6">
            <span className="text-sm text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
              Today
            </span>
          </div>
        )}

        {messageGroups.length > 0 ? (
          <div className="space-y-6">
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
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
                          <span className="text-sm font-semibold text-white">
                            {(user as any)?.firstName?.[0] || (user as any)?.email?.[0] || '?'}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Message Group */}
                    <div className={`flex flex-col space-y-1 ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                      {/* Message Bubbles */}
                      <div className="space-y-1">
                        {group.map((message, messageIndex) => (
                          <div key={message.id} className={`relative group`}>
                            <div
                              className={`px-4 py-3 rounded-2xl max-w-md break-words shadow-sm ${
                                isOwnMessage
                                  ? 'bg-red-500 text-white rounded-br-md'
                                  : 'bg-slate-700 text-white rounded-bl-md'
                              }`}
                              data-testid={`message-${message.id}`}
                            >
                              <p className="text-sm leading-relaxed" data-testid={`message-content-${message.id}`}>
                                {message.content}
                              </p>
                              
                              {/* Message timestamp on last message */}
                              {messageIndex === group.length - 1 && (
                                <div className={`text-xs mt-1 ${isOwnMessage ? 'text-red-100' : 'text-slate-400'}`}>
                                  {formatMessageTime(message.createdAt)}
                                </div>
                              )}
                              
                              {/* Message Status for sent messages */}
                              {isOwnMessage && messageIndex === group.length - 1 && (
                                <div className="flex items-center justify-end mt-1">
                                  {message.isRead ? (
                                    <FaCheckDouble className="w-3 h-3 text-red-100" />
                                  ) : (
                                    <FaCheck className="w-3 h-3 text-red-100" />
                                  )}
                                </div>
                              )}
                            </div>
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
          <div className="text-center py-16 text-slate-400" data-testid="empty-chat">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-800 rounded-full flex items-center justify-center">
              <FaPaperPlane className="w-6 h-6" />
            </div>
            <p className="text-lg mb-2 text-white">Start the conversation</p>
            <p className="text-sm">Send a message to begin chatting with {(otherUser as any)?.firstName || "this user"}</p>
          </div>
        )}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start mt-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
                <span className="text-sm font-semibold text-white">
                  {(otherUser as any)?.firstName?.[0] || '?'}
                </span>
              </div>
              <div className="bg-slate-700 px-4 py-3 rounded-2xl rounded-bl-md max-w-xs">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input - Enhanced like mockup */}
      <div className="p-4 border-t border-slate-700 bg-slate-800" data-testid="message-input-area">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          {/* Attachment Button */}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-slate-400 hover:text-white hover:bg-slate-700 rounded-full w-10 h-10 p-0"
          >
            <FaPaperclip className="w-4 h-4" />
          </Button>
          
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type a message..."
              className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-slate-500 rounded-full py-3 px-4 pr-24"
              disabled={sendMessageMutation.isPending}
              data-testid="input-message"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
            
            {/* Emoji and Send buttons */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-slate-400 hover:text-white rounded-full w-8 h-8 p-0"
              >
                <FaSmile className="w-4 h-4" />
              </Button>
              
              <Button
                type="submit"
                disabled={sendMessageMutation.isPending || !messageText.trim()}
                className="bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 p-0"
                data-testid="button-send-message"
              >
                <FaPaperPlane className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}