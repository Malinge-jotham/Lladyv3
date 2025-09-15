import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { FaSearch, FaComments, FaUserCircle, FaPaperPlane } from "react-icons/fa";

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
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-xl" data-testid="start-conversation-modal">
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-gray-800">
            <div className="p-2 bg-blue-100 rounded-full">
              <FaComments className="text-blue-600" />
            </div>
            Start New Conversation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 p-6">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-lg border-gray-300 focus:border-blue-400 focus:ring-blue-400"
              data-testid="input-search-users"
            />
          </div>

          <div className="max-h-72 overflow-y-auto space-y-2 mt-4">
            {searchQuery.length < 2 ? (
              <div className="text-center py-8">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <FaSearch className="text-gray-400 text-xl" />
                </div>
                <p className="text-gray-500 font-medium">Search for users</p>
                <p className="text-sm text-gray-400 mt-1">Type at least 2 characters to find users</p>
              </div>
            ) : isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-100">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            ) : searchResults && Array.isArray(searchResults) && searchResults.length > 0 ? (
              searchResults.map((user: any) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-blue-50 transition-all duration-200 group"
                  data-testid={`user-result-${user.id}`}
                >
                  <div className="flex items-center space-x-3">
                    {user.profileImageUrl ? (
                      <img
                        src={user.profileImageUrl}
                        alt="User avatar"
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center border-2 border-white shadow-sm">
                        <FaUserCircle className="text-blue-400 text-xl" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-800">
                        {user.firstName || user.lastName 
                          ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                          : user.email
                        }
                      </p>
                      {user.email && (user.firstName || user.lastName) && (
                        <p className="text-sm text-gray-500">{user.email}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleStartConversation(user)}
                    disabled={startConversationMutation.isPending}
                    className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors shadow-sm hover:shadow-md"
                    data-testid={`button-message-${user.id}`}
                  >
                    {startConversationMutation.isPending ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Starting...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <FaPaperPlane className="mr-1 text-xs" />
                        Message
                      </span>
                    )}
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <FaUserCircle className="text-gray-400 text-xl" />
                </div>
                <p className="text-gray-500 font-medium">No users found</p>
                <p className="text-sm text-gray-400 mt-1">No results for "{searchQuery}"</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}