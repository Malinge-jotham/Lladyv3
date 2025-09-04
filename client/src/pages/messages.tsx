import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import ChatArea from "@/components/chat/ChatArea";
import StartConversationModal from "@/components/messages/StartConversationModal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { FaPlus } from "react-icons/fa";

export default function Messages() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showStartConversation, setShowStartConversation] = useState(false);

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

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        <div className="flex h-screen bg-background">
          {/* Conversations List - Modern Design */}
          <div className="w-80 border-r border-border bg-card/30 backdrop-blur-sm" data-testid="conversations-list">
            {/* Header */}
            <div className="p-6 border-b border-border/50">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-foreground">Chats</h1>
                <Button
                  size="sm"
                  onClick={() => setShowStartConversation(true)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full w-10 h-10 p-0"
                  data-testid="button-start-conversation"
                >
                  <FaPlus className="w-4 h-4" />
                </Button>
              </div>
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search"
                  className="w-full bg-muted/50 border border-border/50 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                />
              </div>
            </div>

            {/* Conversations */}
            <div className="overflow-y-auto h-full">
              {isLoading ? (
                <div className="space-y-2 p-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3 p-3">
                      <Skeleton className="w-12 h-12 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-3 w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : conversations && Array.isArray(conversations) && conversations.length > 0 ? (
                conversations.map((conversation: any) => (
                  <div
                    key={conversation.userId}
                    className={`p-4 mx-2 my-1 rounded-xl cursor-pointer transition-all duration-200 hover:bg-muted/40 ${
                      selectedUserId === conversation.userId 
                        ? 'bg-primary/10 border border-primary/20 shadow-sm' 
                        : 'hover:shadow-sm'
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
                            className="w-12 h-12 rounded-full object-cover border-2 border-border/20"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center border-2 border-border/20">
                            <span className="text-primary font-semibold text-lg">
                              {conversation.user?.firstName?.[0]?.toUpperCase() || '?'}
                            </span>
                          </div>
                        )}
                        {/* Online indicator */}
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-background"></div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-foreground truncate" data-testid={`conversation-name-${conversation.userId}`}>
                            {conversation.user?.firstName} {conversation.user?.lastName}
                          </p>
                          <span className="text-xs text-muted-foreground font-medium">
                            {new Date(conversation.lastMessageTime).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground truncate" data-testid={`conversation-preview-${conversation.userId}`}>
                            {conversation.lastMessage}
                          </p>
                          {/* Unread count badge */}
                          {!conversation.isRead && (
                            <div className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-1 font-semibold ml-2">
                              1
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-muted-foreground" data-testid="empty-conversations">
                  <div className="mb-4">
                    <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaPlus className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">No conversations yet</h3>
                    <p className="text-sm">Start chatting with product sellers!</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          {selectedUserId ? (
            <ChatArea userId={selectedUserId} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground" data-testid="no-chat-selected">
              <p>Select a conversation to start messaging</p>
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
