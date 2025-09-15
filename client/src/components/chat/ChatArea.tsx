import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  FaPaperPlane, FaSmile, FaPaperclip, 
  FaArrowLeft, FaPhone, FaVideo, FaEllipsisV,
  FaCircle
} from "react-icons/fa";
import { EmojiPicker } from "@/components/emoji-picker";

interface ChatAreaProps {
  userId: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
}

interface WebSocketMessage {
  type: "message" | "typing";
  message?: Message;
  userId?: string;
  targetUserId?: string;
  isTyping?: boolean;
}

export default function ChatArea({ userId }: ChatAreaProps) {
  const [messageText, setMessageText] = useState("");
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ✅ Messages
  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages", userId],
    queryFn: () => apiRequest("GET", `/api/messages?userId=${userId}`).then(res => res.json()),
    retry: false,
  });

  // ✅ Other user info
  const { data: otherUser } = useQuery<User>({
    queryKey: ["/api/users", userId],
    queryFn: () => apiRequest("GET", `/api/users/${userId}`).then(res => res.json()),
    retry: false,
  });

  // ✅ Send message
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { receiverId: string; content: string }) => {
      const response = await apiRequest("POST", "/api/messages", messageData);
      return response.json();
    },
    onSuccess: (newMessage: Message) => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages", userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
      setMessageText("");

      // Push message via WS
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: "message",
          message: newMessage,
        }));
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  // ✅ WebSocket setup with auto-reconnect
  const connectWebSocket = useCallback(() => {
    const wsUrl = import.meta.env.VITE_WS_URL; // e.g. ws://localhost:3000/ws
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("✅ WebSocket connected");
    };

    ws.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);

        if (data.type === "message" && data.message) {
          if (data.message.senderId === userId || data.message.receiverId === userId) {
            queryClient.invalidateQueries({ queryKey: ["/api/messages", userId] });
          }
          queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
        } else if (data.type === "typing" && data.userId === userId) {
          setIsOtherUserTyping(data.isTyping || false);
        }
      } catch (err) {
        console.error("Error parsing WebSocket:", err);
      }
    };

    ws.onerror = () => {
      toast({
        title: "Connection Error",
        description: "Chat server disconnected",
        variant: "destructive",
      });
    };

    ws.onclose = () => {
      console.warn("⚠️ WebSocket closed, retrying...");
      setTimeout(connectWebSocket, 2000); // auto reconnect
    };

    socketRef.current = ws;
  }, [userId, queryClient, toast]);

  useEffect(() => {
    connectWebSocket();
    return () => {
      socketRef.current?.close();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [connectWebSocket]);

  // ✅ Auto-scroll
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // ✅ Typing indicator
  const handleTyping = useCallback(() => {
    if (!socketRef.current || !currentUser || !currentUser.id) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    socketRef.current.send(JSON.stringify({
      type: "typing",
      userId: currentUser.id,
      targetUserId: userId,
      isTyping: true,
    }));

    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.send(JSON.stringify({
        type: "typing",
        userId: currentUser.id,
        targetUserId: userId,
        isTyping: false,
      }));
    }, 1200);
  }, [userId, currentUser]);

  // ✅ Send message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !currentUser || !currentUser.id) return;
    sendMessageMutation.mutate({
      receiverId: userId,
      content: messageText.trim(),
    });
  };

  // ✅ Format time
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  // ✅ Add emoji to message
  const handleEmojiSelect = (emoji: string) => {
    setMessageText(prev => prev + emoji);
  };

  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-gray-50 to-gray-100" data-testid="chat-area">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 bg-white shadow-sm flex items-center justify-between">
        {otherUser ? (
          <>
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                className="p-2 lg:hidden text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                onClick={() => window.history.back()}
              >
                <FaArrowLeft className="text-sm" />
              </Button>

              <div className="relative">
                {otherUser.profileImageUrl ? (
                  <img
                    src={otherUser.profileImageUrl}
                    alt="User avatar"
                    className="w-10 h-10 rounded-full object-cover shadow-sm border-2 border-white"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-sm">
                    {otherUser.firstName?.[0] || "?"}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800">{otherUser.firstName} {otherUser.lastName}</h3>
                <p className="text-xs text-gray-500 flex items-center">
                  {isOtherUserTyping ? (
                    <span className="flex items-center text-blue-500">
                      <span className="typing-dots flex">
                        <span className="dot bg-blue-500"></span>
                        <span className="dot bg-blue-500"></span>
                        <span className="dot bg-blue-500"></span>
                      </span>
                      Typing...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <FaCircle className="text-green-500 text-[6px] mr-1" />
                      Online
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex space-x-1">
              <Button variant="ghost" size="sm" className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full">
                <FaPhone className="text-sm" />
              </Button>
              <Button variant="ghost" size="sm" className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full">
                <FaVideo className="text-sm" />
              </Button>
              <Button variant="ghost" size="sm" className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full">
                <FaEllipsisV className="text-sm" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex items-center space-x-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-gray-100/70">
        {sortedMessages.length ? (
          sortedMessages.map((m) => {
            const isMine = m.senderId === currentUser?.id;
            return (
              <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl flex flex-col ${
                  isMine 
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md" 
                    : "bg-white text-gray-800 border border-gray-200 rounded-bl-md shadow-sm"
                }`}>
                  <p className="text-sm">{m.content}</p>
                  <span className={`text-xs mt-1 self-end flex items-center ${isMine ? "text-blue-100" : "text-gray-500"}`}>
                    {formatTime(m.createdAt)}
                    {isMine && <FaPaperPlane className="ml-1 text-[10px]" />}
                  </span>
                </div>
              </div>
            );
          })
        ) : isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                <Skeleton className={`h-12 w-48 rounded-2xl ${i % 2 === 0 ? "rounded-bl-md" : "rounded-br-md"}`} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-4">
              <FaPaperPlane className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="font-medium text-gray-700 mb-1">No messages yet</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Start the conversation by sending a message to {otherUser?.firstName || "this user"}
            </p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-white">
        {isOtherUserTyping && (
          <div className="text-xs text-gray-500 mb-2 flex items-center">
            <span className="typing-dots flex mr-2">
              <span className="dot bg-gray-400"></span>
              <span className="dot bg-gray-400"></span>
              <span className="dot bg-gray-400"></span>
            </span>
            {otherUser?.firstName} is typing...
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex items-center space-x-2 bg-gray-100 rounded-xl p-1 pl-3">
          <Button 
            type="button" 
            variant="ghost" 
            size="sm"
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-200 rounded-full"
          >
            <FaPaperclip className="text-sm" />
          </Button>

          <Input
            type="text"
            value={messageText}
            onChange={(e) => {
              setMessageText(e.target.value);
              handleTyping();
            }}
            placeholder="Type a message..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-3"
          />

          <EmojiPicker onEmojiSelect={handleEmojiSelect}>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm"
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-200 rounded-full"
            >
              <FaSmile className="text-sm" />
            </Button>
          </EmojiPicker>

          <Button 
            type="submit" 
            disabled={!messageText.trim() || sendMessageMutation.isPending} 
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full p-2 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
          >
            {sendMessageMutation.isPending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <FaPaperPlane className="text-xs" />
            )}
          </Button>
        </form>
      </div>

      <style>
        {`.typing-dots {
          display: inline-flex;
          align-items: center;
          height: 17px;
        }
        .dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          margin: 0 1px;
          animation: typingAnimation 1.4s infinite ease-in-out;
        }
        .dot:nth-child(1) { animation-delay: 0s; }
        .dot:nth-child(2) { animation-delay: 0.2s; }
        .dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typingAnimation {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }`}
      </style>
    </div>
  );
}
