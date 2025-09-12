import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { FaSearch, FaComments, FaTrash } from "react-icons/fa";

interface StartConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationStarted?: (userId: string) => void;
}

export default function StartConversationModal({
  isOpen,
  onClose,
  onConversationStarted,
}: StartConversationModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"search" | "conversations">("search");
  const { toast } = useToast();

  // Fetch existing conversations
  const { data: conversations, isLoading: isLoadingConversations } = useQuery({
    queryKey: ["/api/messages/conversations"],
    enabled: isOpen,
    retry: false,
  });

  // Search users query
  const { data: searchResults, isLoading: isLoadingSearch } = useQuery({
    queryKey: ["/api/users/search", searchQuery],
    enabled: searchQuery.length >= 2 && isOpen && activeTab === "search",
    retry: false,
  });

  // Mutation to start a new conversation
  const startConversationMutation = useMutation({
    mutationFn: async (data: { receiverId: string; userName: string }) => {
      const response = await apiRequest("POST", "/api/messages/start", {
        receiverId: data.receiverId,
        content: `Hi ${data.userName}! I'd like to connect.`,
      });
      return response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Conversation started",
        description: `Message sent to ${variables.userName}!`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
      onConversationStarted?.(variables.receiverId);
      onClose();
      setSearchQuery("");
    },
    onError: (error) => {
      console.error("Error starting conversation:", error);
      toast({
        title: "Error",
        description: "Failed to start conversation. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation to delete a conversation
  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      await apiRequest("DELETE", `/api/messages/conversations/${conversationId}`);
    },
    onSuccess: () => {
      toast({
        title: "Conversation deleted",
        description: "The conversation has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
    },
    onError: (error) => {
      console.error("Error deleting conversation:", error);
      toast({
        title: "Error",
        description: "Failed to delete conversation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleStartConversation = (user: any) => {
    const userName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;
    startConversationMutation.mutate({
      receiverId: user.id,
      userName,
    });
  };

  const handleDeleteConversation = (conversationId: string) => {
    if (window.confirm("Are you sure you want to delete this conversation? This action cannot be undone.")) {
      deleteConversationMutation.mutate(conversationId);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" data-testid="start-conversation-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FaComments />
            Messages
          </DialogTitle>
        </DialogHeader>

        {/* Tabs for Search and Existing Conversations */}
        <div className="flex border-b">
          <button
            className={`flex-1 py-2 text-center ${activeTab === "search" ? "border-b-2 border-primary font-medium" : "text-muted-foreground"}`}
            onClick={() => setActiveTab("search")}
            data-testid="tab-search"
          >
            New Conversation
          </button>
          <button
            className={`flex-1 py-2 text-center ${activeTab === "conversations" ? "border-b-2 border-primary font-medium" : "text-muted-foreground"}`}
            onClick={() => setActiveTab("conversations")}
            data-testid="tab-conversations"
          >
            Your Conversations
          </button>
        </div>

        <div className="space-y-4">
          {activeTab === "search" ? (
            <>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-users"
                />
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2">
                {searchQuery.length < 2 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Type at least 2 characters to search for users
                  </p>
                ) : isLoadingSearch ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-3 p-3">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="space-y-1 flex-1">
                          <Skeleton className="h-4 w-1/2" />
                          <Skeleton className="h-3 w-3/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchResults && Array.isArray(searchResults) && searchResults.length > 0 ? (
                  searchResults.map((user: any) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors"
                      data-testid={`user-result-${user.id}`}
                    >
                      <div className="flex items-center space-x-3">
                        {user.profileImageUrl ? (
                          <img
                            src={user.profileImageUrl}
                            alt="User avatar"
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <span className="text-muted-foreground text-sm">
                              {user.firstName?.[0] || user.email?.[0] || '?'}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium">
                            {user.firstName || user.lastName 
                              ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                              : user.email
                            }
                          </p>
                          {user.email && (user.firstName || user.lastName) && (
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleStartConversation(user)}
                        disabled={startConversationMutation.isPending}
                        data-testid={`button-message-${user.id}`}
                      >
                        {startConversationMutation.isPending ? "Starting..." : "Message"}
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No users found matching "{searchQuery}"
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="max-h-60 overflow-y-auto space-y-2">
              {isLoadingConversations ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                  ))}
                </div>
              ) : conversations && Array.isArray(conversations) && conversations.length > 0 ? (
                conversations.map((conversation: any) => (
                  <div
                    key={conversation.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors"
                    data-testid={`conversation-${conversation.id}`}
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      {conversation.otherUser?.profileImageUrl ? (
                        <img
                          src={conversation.otherUser.profileImageUrl}
                          alt="User avatar"
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-muted-foreground text-sm">
                            {conversation.otherUser?.firstName?.[0] || conversation.otherUser?.email?.[0] || '?'}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium">
                          {conversation.otherUser?.firstName || conversation.otherUser?.lastName 
                            ? `${conversation.otherUser?.firstName || ""} ${conversation.otherUser?.lastName || ""}`.trim()
                            : conversation.otherUser?.email || 'Unknown User'
                          }
                        </p>
                        {conversation.lastMessage && (
                          <p className="text-sm text-muted-foreground truncate">
                            {conversation.lastMessage.content}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteConversation(conversation.id)}
                      disabled={deleteConversationMutation.isPending}
                      className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                      data-testid={`button-delete-${conversation.id}`}
                    >
                      <FaTrash className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  You don't have any conversations yet.
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}