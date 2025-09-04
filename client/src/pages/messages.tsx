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
import { FaPlus, FaComments } from "react-icons/fa";

// Helper function to format message timestamps
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
        <div className="flex h-screen">
          {/* Main Chat Area - Left Side */}
          <div className="flex-1 flex flex-col" data-testid="chat-main-area">
            {selectedUserId ? (
              <ChatArea userId={selectedUserId} />
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground bg-background" data-testid="no-chat-selected">
                <div className="text-center max-w-md px-8">
                  <div className="w-16 h-16 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
                    <FaComments className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h2 className="text-2xl font-semibold mb-2">Your Messages</h2>
                  <p className="text-muted-foreground mb-6">
                    Select a conversation from the sidebar to start chatting, or create a new conversation
                  </p>
                  <Button
                    onClick={() => setShowStartConversation(true)}
                    size="lg"
                    data-testid="button-start-new-conversation"
                  >
                    <FaPlus className="w-4 h-4 mr-2" />
                    Start New Conversation
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Conversations Sidebar - Right Side */}
          <div className="w-80 border-l border-border bg-card/50" data-testid="conversations-sidebar">
            <div className="p-4 border-b border-border bg-card">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Conversations</h2>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowStartConversation(true)}
                  data-testid="button-start-conversation"
                >
                  <FaPlus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="overflow-y-auto h-full">
              {isLoading ? (
                <div className="space-y-1 p-2">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3 p-3 rounded-lg">
                      <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
                      <div className="space-y-2 flex-1 min-w-0">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-3 w-4/5" />
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <Skeleton className="h-3 w-8" />
                        <Skeleton className="h-4 w-4 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : conversations && Array.isArray(conversations) && conversations.length > 0 ? (
                <div className="divide-y divide-border/50">
                  {conversations.map((conversation: any) => (
                    <div
                      key={conversation.userId}
                      className={`p-3 hover:bg-muted/50 cursor-pointer transition-all duration-200 ${
                        selectedUserId === conversation.userId 
                          ? "bg-muted border-l-4 border-primary" 
                          : "hover:border-l-4 hover:border-muted-foreground/20"
                      }`}
                      onClick={() => setSelectedUserId(conversation.userId)}
                      data-testid={`conversation-${conversation.userId}`}
                    >
                      <div className="flex items-start space-x-3">
                        {/* User Avatar with Online Status */}
                        <div className="relative flex-shrink-0">
                          {conversation.user?.profileImageUrl ? (
                            <img
                              src={conversation.user.profileImageUrl}
                              alt="User avatar"
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                              <span className="text-sm font-semibold text-primary">
                                {conversation.user?.firstName?.[0] || conversation.user?.email?.[0] || "?"}
                              </span>
                            </div>
                          )}
                          {/* Online status indicator */}
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-card rounded-full opacity-75"></div>
                        </div>
                        
                        {/* Message Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-sm truncate">
                              {conversation.user?.firstName || conversation.user?.lastName
                                ? `${conversation.user.firstName || ""} ${conversation.user.lastName || ""}`.trim()
                                : conversation.user?.email || "Unknown User"}
                            </p>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              {conversation.lastMessageTime && (
                                <span className="text-xs text-muted-foreground">
                                  {formatMessageTime(conversation.lastMessageTime)}
                                </span>
                              )}
                              {/* Unread badge - temporary random for demo */}
                              {Math.random() > 0.6 && (
                                <div className="w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-semibold">
                                  {Math.floor(Math.random() * 9) + 1}
                                </div>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground truncate leading-tight">
                            {conversation.lastMessage || "No messages yet"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <div className="w-12 h-12 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center opacity-50">
                    <FaComments className="w-6 h-6" />
                  </div>
                  <p className="font-medium mb-1">No conversations yet</p>
                  <p className="text-sm mb-4">Start chatting with product sellers to see your conversations here</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowStartConversation(true)}
                  >
                    <FaPlus className="w-3 h-3 mr-2" />
                    Start Conversation
                  </Button>
                </div>
              )}
            </div>
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