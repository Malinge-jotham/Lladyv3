import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layouts/Sidebar";
import ChatArea from "@/components/chat/ChatArea";
import StartConversationModal from "@/components/messages/StartConversationModal";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { FaPlus, FaSearch, FaArrowLeft } from "react-icons/fa";

export default function Messages() {
  // ✅ Authentication and state hooks
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [showStartConversation, setShowStartConversation] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // ✅ Query for conversations
  const {
    data: conversations,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/messages/conversations"],
    retry: false,
  });

  // ✅ Remove duplicates
  const uniqueConversations = useMemo(() => {
    if (!Array.isArray(conversations)) return [];
    const seen = new Set<string>();
    return conversations.filter((conv: any) => {
      if (seen.has(conv.id)) return false;
      seen.add(conv.id);
      return true;
    });
  }, [conversations]);

  // ✅ Search filter
  const filteredConversations = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return uniqueConversations.filter((conversation: any) => {
      const fullName = `${conversation.user?.firstName || ""} ${
        conversation.user?.lastName || ""
      }`.toLowerCase();
      const lastMessage = conversation.lastMessage?.toLowerCase() || "";
      return fullName.includes(query) || lastMessage.includes(query);
    });
  }, [uniqueConversations, searchQuery]);

  // ✅ Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Redirecting to login...",
        variant: "destructive",
      });
      setTimeout(() => (window.location.href = "/api/login"), 500);
    }
  }, [authLoading, isAuthenticated, toast]);

  // ✅ Handle session expiry
  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Session expired",
        description: "Please log in again.",
        variant: "destructive",
      });
      setTimeout(() => (window.location.href = "/api/login"), 500);
    }
  }, [error, toast]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-8 w-32" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main content - full width on mobile, adjusted on desktop */}
      <div className="flex-1 w-full md:ml-20">
        <div className="flex h-screen">
          {/* Conversations List - hidden on mobile when chat is open */}
          <div className={`w-full md:w-80 border-r border-gray-300 bg-gray-50 shadow-lg ${
            selectedConversation ? 'hidden md:block' : 'block'
          }`}>
            {/* Header */}
            <div className="p-4 md:p-6 border-b border-gray-300 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Chats</h2>
                <Button
                  size="sm"
                  onClick={() => setShowStartConversation(true)}
                  className="bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 md:w-10 md:h-10 p-0 shadow-md"
                >
                  <FaPlus className="w-4 h-4 md:w-5 md:h-5" />
                </Button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 py-2 md:py-3 border-gray-300 rounded-xl bg-gray-100 focus:bg-white focus:border-gray-400 shadow-sm"
                />
              </div>
            </div>

            {/* Conversations */}
            <div className="overflow-y-auto bg-gray-50 h-[calc(100vh-140px)]">
              {isLoading ? (
                <div className="space-y-2 p-2">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="p-3 md:p-4 flex items-center space-x-3 md:space-x-4 bg-white rounded-xl mx-2 shadow-sm"
                    >
                      <Skeleton className="w-10 h-10 md:w-14 md:h-14 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-3 w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredConversations.length > 0 ? (
                <div className="p-2 space-y-2">
                  {filteredConversations.map(
                    (conversation: any, index: number) => {
                      const unreadCount =
                        Math.random() > 0.7
                          ? Math.floor(Math.random() * 5) + 1
                          : 0;

                      return (
                        <div
                          key={`${conversation.id}-${index}`}
                          className={`p-3 md:p-4 hover:bg-gray-100 transition-all duration-200 cursor-pointer rounded-xl mx-1 shadow-sm ${
                            selectedConversation?.id === conversation.id
                              ? "bg-blue-100 border-l-4 border-l-blue-500"
                              : "bg-white border-l-4 border-l-transparent"
                          }`}
                          onClick={() => setSelectedConversation(conversation)}
                        >
                          <div className="flex items-center space-x-3 md:space-x-4">
                            <div className="relative">
                              {conversation.user?.profileImageUrl ? (
                                <img
                                  src={conversation.user.profileImageUrl}
                                  alt="User avatar"
                                  className="w-10 h-10 md:w-14 md:h-14 rounded-full object-cover shadow-md"
                                />
                              ) : (
                                <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow-md">
                                  <span className="text-white font-bold text-sm md:text-lg">
                                    {conversation.user?.firstName?.[0] || "?"}
                                  </span>
                                </div>
                              )}
                              <div className="absolute bottom-0 right-0 w-2 h-2 md:w-3 md:h-3 bg-green-500 rounded-full border border-white shadow-sm" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-gray-900 truncate text-sm md:text-base">
                                    {conversation.user?.firstName}{" "}
                                    {conversation.user?.lastName}
                                  </p>
                                  <p className="text-xs md:text-sm text-gray-500 truncate mt-1">
                                    {conversation.lastMessage}
                                  </p>
                                </div>
                                <div className="flex flex-col items-end space-y-1 md:space-y-2 ml-2 md:ml-3">
                                  <span className="text-xs text-gray-400 font-medium">
                                    {conversation.lastMessageTime
                                      ? new Date(
                                          conversation.lastMessageTime
                                        ).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })
                                      : ""}
                                  </span>
                                  {unreadCount > 0 && (
                                    <div className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded-full min-w-[18px] h-5 md:h-6 flex items-center justify-center shadow-md">
                                      {unreadCount > 99 ? "99+" : unreadCount}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              ) : searchQuery ? (
                <div className="p-6 md:p-8 text-center text-gray-500">
                  <p>No conversations match "{searchQuery}"</p>
                </div>
              ) : (
                <div className="p-6 md:p-8 text-center text-gray-500">
                  <p>No conversations yet.</p>
                  <p className="text-sm mt-1">
                    Start chatting with product sellers!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ✅ Chat Area */}
          {selectedConversation ? (
            <div className={`flex-1 flex flex-col ${!selectedConversation ? 'hidden md:flex' : 'flex'}`}>
              {/* Mobile back button */}
              {selectedConversation && (
                <div className="md:hidden p-4 border-b border-gray-300 bg-white flex items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedConversation(null)}
                    className="mr-3"
                  >
                    <FaArrowLeft className="w-4 h-4" />
                  </Button>
                  <div className="flex items-center space-x-3">
                    {selectedConversation.user?.profileImageUrl ? (
                      <img
                        src={selectedConversation.user.profileImageUrl}
                        alt="User avatar"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {selectedConversation.user?.firstName?.[0] || "?"}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-gray-900 text-sm">
                        {selectedConversation.user?.firstName}{" "}
                        {selectedConversation.user?.lastName}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <ChatArea
                conversationId={selectedConversation.id}
                user={selectedConversation.user}
              />
            </div>
          ) : (
            <div className={`flex-1 flex-col items-center justify-center text-gray-500 bg-gray-50 ${
              selectedConversation ? 'hidden md:flex' : 'hidden md:flex'
            }`}>
              <div className="text-center">
                <div className="w-16 h-16 md:w-24 md:h-24 bg-white rounded-full flex items-center justify-center mb-4 md:mb-6 mx-auto shadow-lg">
                  <FaPlus className="w-6 h-6 md:w-10 md:h-10 text-gray-400" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 md:mb-3">
                  No conversation selected
                </h3>
                <p className="text-gray-500 text-sm md:text-base">
                  Choose a conversation from the list to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Start Conversation Modal */}
      <StartConversationModal
        isOpen={showStartConversation}
        onClose={() => setShowStartConversation(false)}
        onConversationStarted={(conversation) => {
          setSelectedConversation(conversation);
        }}
      />
    </div>
  );
}
