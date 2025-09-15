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
  const [activeTab, setActiveTab] = useState<"search" | "conversations">("conversations");
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

  // Start conversation
  const startConversationMutation = useMutation({
    mutationFn: async (data: { receiverId: string; userName: string }) => {
      const response = await apiRequest("POST", "/api/messages/start", {
        receiverId: data.receiverId,
        content: `Hi ${data.userName}! I'd like to connect.`,
      });
      return response.json();
    },
    onSuccess: (newConversation, variables) => {
      toast({
        title: "Conversation started",
        description: `Message sent to ${variables.userName}!`,
      });

      queryClient.setQueryData(["/api/messages/conversations"], (old: any) => {
        if (!old) return [newConversation];
        const exists = old.some((c: any) => c.id === newConversation.id);
        return exists ? old : [newConversation, ...old];
      });

      onConversationStarted?.(variables.receiverId);
      setSearchQuery("");
      setActiveTab("conversations");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start conversation.",
        variant: "destructive",
      });
    },
  });

  // Delete conversation
  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      await apiRequest("DELETE", `/api/messages/conversations/${conversationId}`);
    },
    onSuccess: (_, conversationId) => {
      queryClient.setQueryData(["/api/messages/conversations"], (old: any) => {
        if (!old) return [];
        return old.filter((c: any) => c.id !== conversationId);
      });
      toast({
        title: "Deleted",
        description: "Conversation removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Could not delete conversation.",
        variant: "destructive",
      });
    },
  });

  // Delete message
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      await apiRequest("DELETE", `/api/messages/${messageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
      toast({
        title: "Deleted",
        description: "Message removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Could not delete message.",
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FaComments /> Conversations
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex border-b mb-4">
          <button
            className={`flex-1 py-2 ${activeTab === "conversations" ? "border-b-2 border-primary font-medium" : "text-muted-foreground"}`}
            onClick={() => setActiveTab("conversations")}
          >
            Conversations
          </button>
          <button
            className={`flex-1 py-2 ${activeTab === "search" ? "border-b-2 border-primary font-medium" : "text-muted-foreground"}`}
            onClick={() => setActiveTab("search")}
          >
            New
          </button>
        </div>

        {/* Conversations list */}
        {activeTab === "conversations" && (
          <div className="max-h-72 overflow-y-auto space-y-2">
            {isLoadingConversations ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))
            ) : conversations && conversations.length > 0 ? (
              conversations.map((conv: any) => (
                <div key={conv.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3 flex-1">
                    {conv.otherUser?.profileImageUrl ? (
                      <img src={conv.otherUser.profileImageUrl} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <span>{conv.otherUser?.firstName?.[0] || "?"}</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium">
                        {conv.otherUser?.firstName || conv.otherUser?.email}
                      </p>
                      {conv.lastMessage && (
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span className="truncate">{conv.lastMessage.content}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => deleteMessageMutation.mutate(conv.lastMessage.id)}
                          >
                            <FaTrash className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => deleteConversationMutation.mutate(conv.id)}
                  >
                    <FaTrash />
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-6">No conversations yet.</p>
            )}
          </div>
        )}

        {/* Search tab */}
        {activeTab === "search" && (
          <div className="space-y-3">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="max-h-72 overflow-y-auto space-y-2">
              {searchQuery.length < 2 ? (
                <p className="text-center text-muted-foreground py-6">Type 2+ characters to search.</p>
              ) : isLoadingSearch ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))
              ) : searchResults && searchResults.length > 0 ? (
                searchResults.map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {user.profileImageUrl ? (
                        <img src={user.profileImageUrl} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <span>{user.firstName?.[0] || "?"}</span>
                        </div>
                      )}
                      <p className="font-medium">{user.firstName || user.email}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() =>
                        startConversationMutation.mutate({ receiverId: user.id, userName: user.firstName || user.email })
                      }
                    >
                      {startConversationMutation.isPending ? "..." : "Message"}
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-6">No users found.</p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
