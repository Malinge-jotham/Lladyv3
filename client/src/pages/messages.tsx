import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import ChatArea from "@/components/chat/ChatArea";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Messages() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

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
          {/* Conversations List */}
          <div className="w-80 border-r border-border bg-card" data-testid="conversations-list">
            <div className="p-4 border-b border-border">
              <h2 className="text-xl font-semibold">Messages</h2>
            </div>
            <div className="divide-y divide-border">
              {isLoading ? (
                <div className="space-y-4 p-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
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
                    className={`p-4 hover:bg-muted/30 transition-colors cursor-pointer ${
                      selectedUserId === conversation.userId ? 'bg-muted/20' : ''
                    }`}
                    onClick={() => setSelectedUserId(conversation.userId)}
                    data-testid={`conversation-${conversation.userId}`}
                  >
                    <div className="flex items-center space-x-3">
                      {conversation.user?.profileImageUrl ? (
                        <img
                          src={conversation.user.profileImageUrl}
                          alt="User avatar"
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-muted-foreground text-sm">
                            {conversation.user?.firstName?.[0] || '?'}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium" data-testid={`conversation-name-${conversation.userId}`}>
                            {conversation.user?.firstName} {conversation.user?.lastName}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {new Date(conversation.lastMessageTime).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate" data-testid={`conversation-preview-${conversation.userId}`}>
                          {conversation.lastMessage}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-muted-foreground" data-testid="empty-conversations">
                  <p>No conversations yet. Start chatting with product sellers!</p>
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
    </div>
  );
}
