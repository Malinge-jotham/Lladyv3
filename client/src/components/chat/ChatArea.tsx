import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { FaPaperPlane, FaSmile, FaPaperclip, FaArrowLeft, FaPhone, FaVideo } from "react-icons/fa";

interface ChatAreaProps {
  userId: string;
}

export default function ChatArea({ userId }: ChatAreaProps) {
  const [messageText, setMessageText] = useState("");
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
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

  // Handle typing indicator
  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      // Send typing indicator to other user via WebSocket
      if (socket) {
        socket.send(JSON.stringify({
          type: "typing",
          userId: (currentUser as any)?.id,
          targetUserId: userId,
          isTyping: true
        }));
      }
    }

    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    const timeout = setTimeout(() => {
      setIsTyping(false);
      if (socket) {
        socket.send(JSON.stringify({
          type: "typing",
          userId: (currentUser as any)?.id,
          targetUserId: userId,
          isTyping: false
        }));
      }
    }, 1000);

    setTypingTimeout(timeout);
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
      <div className="flex-1 flex flex-col bg-gray-50">
        <div className="p-6 border-b border-gray-300 bg-white shadow-sm">
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="flex-1 p-4 space-y-4 bg-gray-100">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
              <Skeleton className={`h-16 w-64 rounded-3xl ${
                i % 2 === 0 ? 'bg-red-200' : 'bg-gray-300'
              }`} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50" data-testid="chat-area">
      {/* Chat Header */}
      <div className="p-6 border-b border-gray-300 bg-white shadow-sm" data-testid="chat-header">
        {(otherUser as any) ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="p-2 lg:hidden hover:bg-gray-100 rounded-full"
                onClick={() => window.history.back()}
              >
                <FaArrowLeft className="w-5 h-5" />
              </Button>

              <div className="relative">
                {(otherUser as any).profileImageUrl ? (
                  <img
                    src={(otherUser as any).profileImageUrl}
                    alt="User avatar"
                    className="w-12 h-12 rounded-full object-cover shadow-md"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow-md">
                    <span className="text-white font-bold text-lg">
                      {(otherUser as any)?.firstName?.[0] || '?'}
                    </span>
                  </div>
                )}
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 text-lg" data-testid="chat-user-name">
                  {(otherUser as any)?.firstName} {(otherUser as any)?.lastName}
                </h3>
                <p className="text-sm text-green-600 font-medium">Online</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-3 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FaPhone className="w-5 h-5 text-gray-600" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-3 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FaVideo className="w-5 h-5 text-gray-600" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="animate-pulse flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-gray-300"></div>
            <div className="space-y-2">
              <div className="h-4 w-32 bg-gray-300 rounded"></div>
              <div className="h-3 w-20 bg-gray-300 rounded"></div>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-100" data-testid="chat-messages">
        {messages && Array.isArray(messages) && messages.length > 0 ? (
          messages.map((message: any, index: number) => {
            const isOwnMessage = message.senderId === (currentUser as any)?.id;
            const nextMessage = messages[index + 1];
            const isLastInGroup = !nextMessage || nextMessage.senderId !== message.senderId;

            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-2`}
                data-testid={`message-${message.id}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-5 py-3 rounded-3xl shadow-sm relative ${
                    isOwnMessage
                      ? 'bg-red-500 text-white rounded-br-lg'
                      : 'bg-gray-700 text-white rounded-bl-lg'
                  } ${isLastInGroup ? 'mb-4' : 'mb-1'}`}
                >
                  <p className="text-sm leading-relaxed pr-12" data-testid={`message-content-${message.id}`}>
                    {message.content}
                  </p>
                  <div className="absolute bottom-2 right-3">
                    <span className={`text-xs ${
                      isOwnMessage ? 'text-red-100' : 'text-gray-300'
                    }`} data-testid={`message-time-${message.id}`}>
                      {formatTime(message.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center text-gray-500 py-16" data-testid="empty-chat">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <FaPaperPlane className="w-8 h-8 text-gray-400" />
            </div>
            <p className="font-semibold text-lg">No messages yet</p>
            <p className="text-sm mt-2">Start the conversation!</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-6 border-t border-gray-300 bg-white" data-testid="message-input-area">
        <form onSubmit={handleSendMessage}>
          <div className="flex items-center space-x-4 bg-gray-100 rounded-full p-2 shadow-sm">
            {/* Attachment Button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors"
              data-testid="button-attachment"
            >
              <FaPaperclip className="w-5 h-5" />
            </Button>

            {/* Message Input Field */}
            <div className="flex-1 relative">
              <Input
                value={messageText}
                onChange={(e) => {
                  setMessageText(e.target.value);
                  handleTyping();
                }}
                placeholder="Type a message"
                className="bg-transparent border-none focus:ring-0 focus:border-none px-4 py-3 text-gray-900 placeholder-gray-500"
                disabled={sendMessageMutation.isPending}
                data-testid="input-message"
              />
            </div>

            {/* Emoji Button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors"
              data-testid="button-emoji"
            >
              <FaSmile className="w-5 h-5" />
            </Button>

            {/* Send Button */}
            <Button
              type="submit"
              disabled={sendMessageMutation.isPending || !messageText.trim()}
              className="p-4 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-send-message"
            >
              <FaPaperPlane className="w-5 h-5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}