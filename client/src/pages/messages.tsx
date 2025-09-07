import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import ChatArea from "@/components/chat/ChatArea";
import StartConversationModal from "@/components/messages/StartConversationModal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { FaPlus, FaSearch } from "react-icons/fa";

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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-8 w-32" />
      </div>
    );
  }

  // Filter conversations based on search query
  const filteredConversations = conversations && Array.isArray(conversations) 
    ? conversations.filter((conversation: any) => {
        const fullName = `${conversation.user?.firstName || ''} ${conversation.user?.lastName || ''}`.toLowerCase();
        const lastMessage = conversation.lastMessage?.toLowerCase() || '';
        const query = searchQuery.toLowerCase();
        return fullName.includes(query) || lastMessage.includes(query);
      })
    : [];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        <div className="flex h-screen">
          {/* Conversations List */}
          <div className="w-80 border-r border-gray-200 bg-white shadow-sm" data-testid="conversations-list">
            {/* Header with title and new chat button */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Chats</h2>
                <Button
                  size="sm"
                  onClick={() => setShowStartConversation(true)}
                  className="bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 p-0"
                  data-testid="button-start-conversation"
                >
                  <FaPlus className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Search Bar */}
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-gray-300 rounded-lg bg-gray-100 focus:bg-white"
                  data-testid="input-search-conversations"
                />
              </div>
            </div>
            {/* Conversations List */}
            <div className="overflow-y-auto">
              {isLoading ? (
                <div className="space-y-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="p-4 flex items-center space-x-3">
                      <Skeleton className="w-12 h-12 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-3 w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredConversations.length > 0 ? (
                filteredConversations.map((conversation: any) => {
                  // Mock unread count (you can implement this based on your backend)
                  const unreadCount = Math.random() > 0.7 ? Math.floor(Math.random() * 5) + 1 : 0;
                  
                  return (
                    <div
                      key={conversation.userId}
                      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer border-l-4 ${
                        selectedUserId === conversation.userId 
                          ? 'bg-blue-50 border-l-blue-500' 
                          : 'border-l-transparent'
                      }`}
                      onClick={() => setSelectedUserId(conversation.userId)}
                      data-testid={`conversation-${conversation.userId}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          {conversation.user?.profileImageUrl ? (
                            <img
                              src={conversation.user.profileImageUrl}
                              alt="User avatar"
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                              <span className="text-white font-semibold text-lg">
                                {conversation.user?.firstName?.[0] || '?'}
                              </span>
                            </div>
                          )}
                          {/* Online status indicator */}
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-gray-900 truncate" data-testid={`conversation-name-${conversation.userId}`}>
                              {conversation.user?.firstName} {conversation.user?.lastName}
                            </p>
                            <div className="flex flex-col items-end space-y-1">
                              <span className="text-xs text-gray-500">
                                {new Date(conversation.lastMessageTime).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                              {unreadCount > 0 && (
                                <Badge className="bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] h-5 flex items-center justify-center">
                                  {unreadCount > 99 ? '99+' : unreadCount}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 truncate mt-1" data-testid={`conversation-preview-${conversation.userId}`}>
                            {conversation.lastMessage}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : searchQuery ? (
                <div className="p-8 text-center text-gray-500" data-testid="no-search-results">
                  <p>No conversations match "{searchQuery}"</p>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500" data-testid="empty-conversations">
                  <p>No conversations yet.</p>
                  <p className="text-sm mt-1">Start chatting with product sellers!</p>
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          {selectedUserId ? (
            <ChatArea userId={selectedUserId} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-white" data-testid="no-chat-selected">
              <div className="text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <FaPlus className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No conversation selected</h3>
                <p className="text-gray-500">Choose a conversation from the list to start messaging</p>
              </div>
            </div>
          )}
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
