import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import ChatArea from "@/components/chat/ChatArea";
import StartConversationModal from "@/components/messages/StartConversationModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { FaPlus, FaSearch, FaComment, FaExclamationTriangle } from "react-icons/fa";

export default function Messages() {
  const { isAuthenticated, isLoading: authLoading, user: currentUser } = useAuth();
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showStartConversation, setShowStartConversation] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  // Fetch conversations for the current user only
  const {
    data: conversations,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["/api/messages/conversations"],
    retry: false,
    enabled: !!currentUser?.id, // Only fetch if we have a current user ID
  });

  // Fetch unread counts for the current user's conversations
  const { data: unreadData } = useQuery({
    queryKey: ["/api/messages/unread-counts"],
    enabled: !!currentUser?.id && !!conversations && conversations.length > 0,
  });

  // Update unread counts when data is fetched
  useEffect(() => {
    if (unreadData && Array.isArray(unreadData)) {
      const countsMap: Record<string, number> = {};
      unreadData.forEach((item: { userId: string; count: number }) => {
        countsMap[item.userId] = item.count;
      });
      setUnreadCounts(countsMap);
    }
  }, [unreadData]);

  // Handle authentication and authorization errors
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "You need to be logged in to view messages",
        variant: "destructive",
        action: (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.location.href = "/api/login"}
          >
            Login
          </Button>
        ),
      });
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  useEffect(() => {
    if (error) {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Session expired",
          description: "Please login again to continue",
          variant: "destructive",
          action: (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.href = "/api/login"}
            >
              Login
            </Button>
          ),
        });
      } else {
        toast({
          title: "Failed to load conversations",
          description: "Please try again later",
          variant: "destructive",
          action: (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()}
            >
              Retry
            </Button>
          ),
        });
      }
    }
  }, [error, toast, refetch]);

  // Function to mark messages as read when a conversation is selected
  const handleSelectConversation = async (userId: string) => {
    setSelectedUserId(userId);

    // If there are unread messages, mark them as read
    if (unreadCounts[userId] > 0) {
      try {
        const response = await fetch(`/api/messages/mark-read/${userId}`, {
          method: 'POST',
        });

        if (response.ok) {
          // Update local state to reflect that messages are now read
          setUnreadCounts(prev => ({
            ...prev,
            [userId]: 0
          }));
        }
      } catch (error) {
        console.error("Failed to mark messages as read:", error);
      }
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
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
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <div className="flex-1 ml-64">
        <div className="flex h-screen">
          {/* Conversations List */}
          <div className="w-96 border-r bg-muted/40 shadow-sm" data-testid="conversations-list">
            {/* Header with title and new chat button */}
            <div className="p-6 border-b bg-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-foreground">Messages</h2>
                <Button
                  size="icon"
                  onClick={() => setShowStartConversation(true)}
                  className="rounded-full h-10 w-10 shadow-sm"
                  data-testid="button-start-conversation"
                  aria-label="Start new conversation"
                >
                  <FaPlus className="w-4 h-4" />
                </Button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 py-2 rounded-lg bg-background"
                  data-testid="input-search-conversations"
                  aria-label="Search conversations"
                />
              </div>
            </div>

            {/* Conversations List */}
            <div className="overflow-y-auto h-[calc(100vh-136px)]">
              {isLoading ? (
                <div className="space-y-2 p-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="p-3 flex items-center space-x-3 bg-card rounded-lg">
                      <Skeleton className="w-12 h-12 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <FaExclamationTriangle className="w-12 h-12 text-destructive mb-4" />
                  <h3 className="text-lg font-medium mb-2">Failed to load conversations</h3>
                  <p className="text-muted-foreground mb-4">There was a problem loading your messages</p>
                  <Button onClick={() => refetch()} variant="outline">
                    Try Again
                  </Button>
                </div>
              ) : filteredConversations.length > 0 ? (
                <div className="p-2 space-y-1">
                  {filteredConversations.map((conversation: any) => {
                    // Get actual unread count from API
                    const unreadCount = unreadCounts[conversation.userId] || 0;

                    return (
                      <div
                        key={conversation.userId}
                        className={`p-3 transition-all duration-200 cursor-pointer rounded-lg ${
                          selectedUserId === conversation.userId 
                            ? 'bg-primary/10 border-l-4 border-l-primary' 
                            : 'bg-card hover:bg-accent border-l-4 border-l-transparent'
                        }`}
                        onClick={() => handleSelectConversation(conversation.userId)}
                        data-testid={`conversation-${conversation.userId}`}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            handleSelectConversation(conversation.userId);
                          }
                        }}
                        aria-label={`Conversation with ${conversation.user?.firstName} ${conversation.user?.lastName}. ${unreadCount} unread messages`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative flex-shrink-0">
                            {conversation.user?.profileImageUrl ? (
                              <img
                                src={conversation.user.profileImageUrl}
                                alt={`${conversation.user.firstName} ${conversation.user.lastName}`}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                                <span className="text-white font-medium text-sm">
                                  {conversation.user?.firstName?.[0] || 'U'}
                                  {conversation.user?.lastName?.[0] || ''}
                                </span>
                              </div>
                            )}
                            {/* Online status indicator */}
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center">
                                  <p className="font-medium text-foreground truncate text-sm" data-testid={`conversation-name-${conversation.userId}`}>
                                    {conversation.user?.firstName} {conversation.user?.lastName}
                                  </p>
                                  {unreadCount > 0 && (
                                    <Badge 
                                      variant="destructive" 
                                      className="ml-2 h-5 min-w-[20px] flex items-center justify-center px-1 rounded-full text-xs"
                                    >
                                      {unreadCount > 99 ? '99+' : unreadCount}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-muted-foreground truncate text-xs mt-1" data-testid={`conversation-preview-${conversation.userId}`}>
                                  {conversation.lastMessage || "No messages yet"}
                                </p>
                              </div>

                              <div className="flex flex-col items-end space-y-1 ml-2">
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {conversation.lastMessageTime 
                                    ? new Date(conversation.lastMessageTime).toLocaleTimeString([], { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                      })
                                    : ''
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : searchQuery ? (
                <div className="p-8 text-center text-muted-foreground" data-testid="no-search-results">
                  <p>No conversations found for "{searchQuery}"</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSearchQuery('')}
                    className="mt-2"
                  >
                    Clear search
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center" data-testid="empty-conversations">
                  <FaComment className="w-12 h-12 text-muted-foreground/60 mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-1">No conversations yet</h3>
                  <p className="text-muted-foreground mb-4">Start a conversation with other users!</p>
                  <Button onClick={() => setShowStartConversation(true)}>
                    Start Chatting
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          {selectedUserId ? (
            <ChatArea 
              userId={selectedUserId} 
              onMessagesRead={() => {
                // Update unread count when messages are read in the chat area
                setUnreadCounts(prev => ({
                  ...prev,
                  [selectedUserId]: 0
                }));
              }}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-background" data-testid="no-chat-selected">
              <div className="text-center max-w-md mx-4">
                <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mb-6 mx-auto">
                  <FaComment className="w-8 h-8 text-muted-foreground/70" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">Select a conversation</h3>
                <p className="text-muted-foreground mb-6">
                  Choose a conversation from the list to view messages or start a new conversation
                </p>
                <Button onClick={() => setShowStartConversation(true)}>
                  Start New Conversation
                </Button>
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
          setShowStartConversation(false);
          // Refetch conversations to include the new one
          refetch();
        }}
      />
    </div>
  );
}