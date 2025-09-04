import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { FaComments } from "react-icons/fa";

interface MessageSellerButtonProps {
  sellerId: string;
  sellerName?: string;
  productName?: string;
}

export default function MessageSellerButton({ 
  sellerId, 
  sellerName, 
  productName 
}: MessageSellerButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const startConversationMutation = useMutation({
    mutationFn: async () => {
      const initialMessage = `Hi! I'm interested in ${productName || 'your product'}.`;
      const response = await apiRequest("POST", "/api/messages/start", {
        receiverId: sellerId,
        content: initialMessage,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Conversation started",
        description: `Message sent to ${sellerName || 'seller'}!`,
      });
      // Navigate to messages page
      setLocation("/messages");
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

  // Don't show button if trying to message yourself
  if ((user as any)?.id === sellerId) {
    return null;
  }

  return (
    <Button
      onClick={() => startConversationMutation.mutate()}
      disabled={startConversationMutation.isPending}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
      data-testid="button-message-seller"
    >
      <FaComments className="h-4 w-4" />
      {startConversationMutation.isPending ? "Starting..." : "Message Seller"}
    </Button>
  );
}