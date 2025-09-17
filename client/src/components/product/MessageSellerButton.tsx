import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { FaComments, FaPaperPlane, FaTimes } from "react-icons/fa";

interface MessageSellerButtonProps {
  sellerId: string;
  sellerName?: string;
  productName?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export default function MessageSellerButton({ 
  sellerId, 
  sellerName = "the seller",
  productName = "your product",
  variant = "outline",
  size = "sm",
  className = ""
}: MessageSellerButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [messageContent, setMessageContent] = useState("");

  const startConversationMutation = useMutation({
    mutationFn: async (customMessage?: string) => {
      const message = customMessage || `Hi! I'm interested in ${productName}.`;

      const response = await apiRequest("POST", "/api/messages/start", {
        receiverId: sellerId,
        content: message,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to start conversation");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Message sent!",
        description: `Your message has been sent to ${sellerName}.`,
      });

      setIsDialogOpen(false);
      setMessageContent("");

      // Navigate to the specific conversation
      setLocation(`/messages/${data.conversationId}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    const finalMessage = messageContent.trim() || `Hi! I'm interested in ${productName}.`;
    startConversationMutation.mutate(finalMessage);
  };

  const handleOpenDialog = () => {
    setMessageContent(`Hi! I'm interested in ${productName}.`);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setMessageContent("");
  };

  // Don't show button if trying to message yourself or if user is not logged in
  if ((user as any)?.id === sellerId || !user) {
    return null;
  }

  return (
    <>
      <Button
        onClick={handleOpenDialog}
        disabled={startConversationMutation.isPending}
        variant={variant}
        size={size}
        className={`flex items-center gap-2 ${className}`}
        data-testid="button-message-seller"
      >
        <FaComments className="h-4 w-4" />
        {startConversationMutation.isPending ? "Sending..." : "Message Seller"}
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Message {sellerName}</DialogTitle>
            <DialogDescription>
              Send a message to inquire about {productName}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder={`Type your message to ${sellerName}...`}
              className="min-h-32 resize-none"
              disabled={startConversationMutation.isPending}
            />

            <div className="text-sm text-muted-foreground">
              Tip: Be specific about what you're interested in to get a faster response.
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseDialog}
              disabled={startConversationMutation.isPending}
              className="flex-1 sm:flex-initial"
            >
              <FaTimes className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSendMessage}
              disabled={startConversationMutation.isPending || !messageContent.trim()}
              className="flex-1 sm:flex-initial"
            >
              <FaPaperPlane className="h-4 w-4 mr-2" />
              {startConversationMutation.isPending ? "Sending..." : "Send Message"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}