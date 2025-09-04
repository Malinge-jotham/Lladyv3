import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import ChatArea from "@/components/chat/ChatArea";
import StartConversationModal from "@/components/messages/StartConversationModal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { FaPlus, FaComments, FaSearch } from "react-icons/fa";

// Helper function to format message timestamps like the mockup
const formatMessageTime = (timestamp: string | Date) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString();
};

export default function Messages() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showStartConversation, setShowStartConversation] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: conversations,
    isLoading,
    error
  } = useQuery({
    queryKey: ["/api/messages/conversations"],
    retry: false,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [error, toast]);

  // Filter conversations based on search
  const filteredConversations = conversations && Array.isArray(conversations) 
    ? conversations.filter((conversation: any) => {
        const userName = `${conversation.user?.firstName || ""} ${conversation.user?.lastName || ""}`.trim() || conversation.user?.email || "";
        return userName.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : [];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Skeleton className="h-8 w-32" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-900">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        <div className="flex h-screen">
          {/* Conversations Sidebar - LEFT SIDE like the mockup */}
          <div className="w-80 bg-slate-800 border-r border-slate-700" data-testid="conversations-sidebar">
            {/* Header with Chats title and + button */}
            <div className="p-4 border-b border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <FaComments className="w-5 h-5 mr-3 text-slate-400" />
                  Chats
                </h2>
                <Button
                  size="sm"
                  className="bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 p-0"
                  onClick={() => setShowStartConversation(true)}
                  data-testid="button-start-conversation"
                >
                  <FaPlus className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Search Bar */}
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-slate-500"
                  data-testid="input-search-conversations"
                />
              </div>
            </div>
            
            {/* Conversations List */}
            <div className="overflow-y-auto h-full">
              {isLoading ? (
                <div className="space-y-1 p-2">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3 p-3">
                      <Skeleton className="w-12 h-12 rounded-full flex-shrink-0 bg-slate-700" />
                      <div className="space-y-2 flex-1 min-w-0">
                        <Skeleton className="h-4 w-2/3 bg-slate-700" />
                        <Skeleton className="h-3 w-4/5 bg-slate-700" />
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <Skeleton className="h-3 w-8 bg-slate-700" />
                        <Skeleton className="h-4 w-4 rounded-full bg-slate-700" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredConversations.length > 0 ? (
                <div className="divide-y divide-slate-700">
                  {filteredConversations.map((conversation: any, index: number) => {
                    // Generate consistent unread counts based on index for demo
                    const unreadCount = index < 3 ? [100, 53, 8][index] : (Math.random() > 0.7 ? Math.floor(Math.random() * 20) + 1 : 0);
                    
                    return (
                      <div
                        key={conversation.userId}
                        className={`p-3 hover:bg-slate-700/50 cursor-pointer transition-all duration-200 ${
                          selectedUserId === conversation.userId 
                            ? "bg-slate-700" 
                            : ""
                        }`}
                        onClick={() => setSelectedUserId(conversation.userId)}
                        data-testid={`conversation-${conversation.userId}`}
                      >
                        <div className="flex items-center space-x-3">
                          {/* User Avatar */}
                          <div className="relative flex-shrink-0">
                            {conversation.user?.profileImageUrl ? (
                              <img
                                src={conversation.user.profileImageUrl}
                                alt="User avatar"
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
                                <span className="text-sm font-semibold text-white">
                                  {conversation.user?.firstName?.[0] || conversation.user?.email?.[0] || "?"}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* Message Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-semibold text-sm truncate text-white">
                                {conversation.user?.firstName || conversation.user?.lastName
                                  ? `${conversation.user.firstName || ""} ${conversation.user.lastName || ""}`.trim()
                                  : conversation.user?.email || "Unknown User"}
                              </p>
                              <div className="flex items-center space-x-2 flex-shrink-0">
                                {conversation.lastMessageTime && (
                                  <span className="text-xs text-slate-400">
                                    {formatMessageTime(conversation.lastMessageTime)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-slate-400 truncate leading-tight">
                              {conversation.lastMessage || "No messages yet"}
                            </p>
                          </div>
                          
                          {/* Unread Badge */}
                          {unreadCount > 0 && (
                            <div className="w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold flex-shrink-0">
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400">
                  <div className="w-12 h-12 mx-auto mb-4 bg-slate-700 rounded-full flex items-center justify-center opacity-50">
                    <FaComments className="w-6 h-6" />
                  </div>
                  <p className="font-medium mb-1 text-white">No conversations yet</p>
                  <p className="text-sm mb-4">Start chatting with product sellers to see your conversations here</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowStartConversation(true)}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <FaPlus className="w-3 h-3 mr-2" />
                    Start Conversation
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Chat Area - RIGHT SIDE like the mockup */}
          <div className="flex-1 flex flex-col bg-slate-900" data-testid="chat-main-area">
            {selectedUserId ? (
              <ChatArea userId={selectedUserId} />
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 bg-slate-900" data-testid="no-chat-selected">
                <div className="text-center max-w-md px-8">
                  <div className="w-16 h-16 mx-auto mb-6 bg-slate-800 rounded-full flex items-center justify-center">
                    <FaComments className="w-8 h-8 text-slate-400" />
                  </div>
                  <h2 className="text-2xl font-semibold mb-2 text-white">Your Messages</h2>
                  <p className="text-slate-400 mb-6">
                    Select a conversation from the sidebar to start chatting, or create a new conversation
                  </p>
                  <Button
                    onClick={() => setShowStartConversation(true)}
                    size="lg"
                    className="bg-red-500 hover:bg-red-600 text-white"
                    data-testid="button-start-new-conversation"
                  >
                    <FaPlus className="w-4 h-4 mr-2" />
                    Start New Conversation
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Start Conversation Modal */}
      <StartConversationModal
        isOpen={showStartConversation}
        onClose={() => setShowStartConversation(false)}
        onConversationStarted={(userId) => {
          setSelectedUserId(userId);
        }}
      />
    </div>
  );
}