import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageCircle, Reply, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { User, ProductComment } from "@shared/schema";

interface ProductCommentsModalProps {
  product: {
    id: string;
    name: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductCommentsModal({ product, isOpen, onClose }: ProductCommentsModalProps) {
  const [newComment, setNewComment] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch comments
  const { data: comments = [], isLoading } = useQuery<(ProductComment & { user: User; replies: (ProductComment & { user: User })[] })[]>({
    queryKey: ["/api/products", product.id, "comments"],
    enabled: isOpen,
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({ content, parentCommentId }: { content: string; parentCommentId?: string }) => {
      return await apiRequest("POST", `/api/products/${product.id}/comment`, {
        content,
        parentCommentId,
      });
    },
    onSuccess: () => {
      // ✅ Refresh comments list
      queryClient.invalidateQueries({ queryKey: ["/api/products", product.id, "comments"] });

      // ✅ Also refresh product stats so counts in ProductPostActions update
      queryClient.invalidateQueries({ queryKey: ["/api/products", product.id, "stats"] });

      setNewComment("");
      setReplyContent("");
      setReplyingTo(null);
      toast({
        title: "Success",
        description: "Comment added successfully!",
      });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: error?.message || "Failed to add comment",
        variant: "destructive",
      });
    },
  });

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    
    addCommentMutation.mutate({
      content: newComment.trim(),
    });
  };

  const handleSubmitReply = (parentCommentId: string) => {
    if (!replyContent.trim()) return;
    
    addCommentMutation.mutate({
      content: replyContent.trim(),
      parentCommentId,
    });
  };

  const renderComment = (comment: ProductComment & { user: User; replies: (ProductComment & { user: User })[] }) => (
    <div key={comment.id} className="space-y-2">
      <div className="flex items-start space-x-3 p-3 bg-muted/30 rounded-lg">
        <div className="flex-shrink-0">
          {comment.user.profileImageUrl ? (
            <img
              src={comment.user.profileImageUrl}
              alt={`${comment.user.firstName || 'User'}'s avatar`}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm">
              {comment.user.firstName?.[0] || comment.user.email?.[0] || 'U'}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium text-foreground">
              {comment.user.firstName && comment.user.lastName
                ? `${comment.user.firstName} ${comment.user.lastName}`
                : comment.user.email}
            </p>
            <p className="text-xs text-muted-foreground">
              {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : ''}
            </p>
          </div>
          
          <p className="text-sm text-foreground mt-1">{comment.content}</p>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setReplyingTo(comment.id)}
            className="mt-2 h-7 px-2 text-xs"
          >
            <Reply className="w-3 h-3 mr-1" />
            Reply
          </Button>
        </div>
      </div>

      {/* Reply form */}
      {replyingTo === comment.id && (
        <div className="ml-11 space-y-2">
          <Textarea
            placeholder="Write a reply..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            className="min-h-[80px]"
            data-testid={`textarea-reply-${comment.id}`}
          />
          <div className="flex space-x-2">
            <Button
              size="sm"
              onClick={() => handleSubmitReply(comment.id)}
              disabled={addCommentMutation.isPending || !replyContent.trim()}
              data-testid={`button-submit-reply-${comment.id}`}
            >
              <Send className="w-3 h-3 mr-1" />
              Reply
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setReplyingTo(null);
                setReplyContent("");
              }}
              data-testid={`button-cancel-reply-${comment.id}`}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-11 space-y-2">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="flex items-start space-x-3 p-2 bg-muted/20 rounded-lg">
              <div className="flex-shrink-0">
                {reply.user.profileImageUrl ? (
                  <img
                    src={reply.user.profileImageUrl}
                    alt={`${reply.user.firstName || 'User'}'s avatar`}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-xs">
                    {reply.user.firstName?.[0] || reply.user.email?.[0] || 'U'}
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-xs font-medium text-foreground">
                    {reply.user.firstName && reply.user.lastName
                      ? `${reply.user.firstName} ${reply.user.lastName}`
                      : reply.user.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {reply.createdAt ? new Date(reply.createdAt).toLocaleDateString() : ''}
                  </p>
                </div>
                
                <p className="text-xs text-foreground mt-1">{reply.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col" data-testid="modal-comments">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5" />
            <span>Comments on {product.name}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading comments...
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            comments.map(renderComment)
          )}
        </div>

        {/* Add comment form */}
        <div className="border-t pt-4 space-y-3">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px]"
            data-testid="textarea-new-comment"
          />
          
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              {newComment.length}/1000 characters
            </p>
            
            <Button
              onClick={handleSubmitComment}
              disabled={addCommentMutation.isPending || !newComment.trim()}
              data-testid="button-submit-comment"
            >
              <Send className="w-4 h-4 mr-2" />
              {addCommentMutation.isPending ? "Posting..." : "Post Comment"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}