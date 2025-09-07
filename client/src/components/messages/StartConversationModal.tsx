import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { FaSearch, FaComments } from "react-icons/fa";

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
  const { toast } = useToast();

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["/api/users/search", searchQuery],
    enabled: searchQuery.length >= 2 && isOpen,
    retry: false,
  });

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

  const handleStartConversation = (user: any) => {
    const userName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;
    startConversationMutation.mutate({
      receiverId: user.id,
      userName,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" data-testid="start-conversation-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FaComments />
            Start New Conversation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
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
            ) : isLoading ? (
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
        </div>
      </DialogContent>
    </Dialog>
  );
}