import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageCircle, Reply, Send, ThumbsUp } from "lucide-react";
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

interface CommentWithUser extends ProductComment {
  user: User;
  replies: (ProductComment & { user: User })[];
  likedByUser?: boolean;
  likesCount?: number;
}

export default function ProductCommentsModal({
  product,
  isOpen,
  onClose,
}: ProductCommentsModalProps) {
  const [newComment, setNewComment] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const { toast } = useToast();

  // ✅ Fetch comments with proper JSON parsing
  const {
    data: comments = [],
    isLoading,
    error,
  } = useQuery<CommentWithUser[]>({
    queryKey: ["/api/products", product.id, "comments"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/products/${product.id}/comments`);
      if (!res.ok) {
        throw new Error("Failed to fetch comments");
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: isOpen && !!product.id,
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({
      content,
      parentCommentId,
    }: {
      content: string;
      parentCommentId?: string;
    }) => {
      return await apiRequest("POST", `/api/products/${product.id}/comment`, {
        content,
        parentCommentId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/products", product.id, "comments"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/products", product.id, "stats"],
      });
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

  // Like/Unlike mutation
  const toggleLikeMutation = useMutation({
    mutationFn: async (commentId: string) => {
      return await apiRequest(
        "POST",
        `/api/products/${product.id}/comments/${commentId}/like-toggle`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/products", product.id, "comments"],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to toggle like",
        variant: "destructive",
      });
    },
  });

  const handleSubmitComment = () => {
    if (!newComment.trim() || newComment.length > 1000) return;
    addCommentMutation.mutate({ content: newComment.trim() });
  };

  const handleSubmitReply = (parentCommentId: string) => {
    if (!replyContent.trim() || replyContent.length > 1000) return;
    addCommentMutation.mutate({
      content: replyContent.trim(),
      parentCommentId,
    });
  };

  const getUserDisplayName = (user: User | null | undefined): string => {
    if (!user) return "Unknown User";
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email?.split("@")[0] || "User";
  };

  const getUserAvatar = (
    user: User | null | undefined,
    size: number = 8
  ): JSX.Element => {
    if (!user) {
      return (
        <div
          className={`w-${size} h-${size} rounded-full bg-muted flex items-center justify-center text-xs`}
        >
          U
        </div>
      );
    }
    if (user.profileImageUrl) {
      return (
        <img
          src={user.profileImageUrl}
          alt={`${getUserDisplayName(user)}'s avatar`}
          className={`w-${size} h-${size} rounded-full object-cover`}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
          }}
        />
      );
    }
    const initial = user.firstName?.[0] || user.email?.[0] || "U";
    return (
      <div
        className={`w-${size} h-${size} rounded-full bg-primary flex items-center justify-center text-white text-xs`}
      >
        {initial.toUpperCase()}
      </div>
    );
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "";
    }
  };

  const renderComment = (comment: CommentWithUser) => (
    <div key={comment.id} className="space-y-2">
      <div className="flex items-start space-x-3 p-3 bg-muted/30 rounded-lg">
        <div className="flex-shrink-0">{getUserAvatar(comment.user, 8)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium text-foreground">
              {getUserDisplayName(comment.user)}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDate(comment.createdAt as string)}
            </p>
          </div>
          <p className="text-sm text-foreground mt-1">{comment.content || ""}</p>
          <div className="flex space-x-3 mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyingTo(comment.id)}
              className="h-7 px-2 text-xs"
            >
              <Reply className="w-3 h-3 mr-1" />
              Reply
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleLikeMutation.mutate(comment.id)}
              className={`h-7 px-2 text-xs flex items-center ${
                comment.likedByUser ? "text-primary font-semibold" : ""
              }`}
              disabled={toggleLikeMutation.isPending}
            >
              <ThumbsUp className="w-3 h-3 mr-1" />
              {comment.likesCount || 0}
            </Button>
          </div>
        </div>
      </div>

      {replyingTo === comment.id && (
        <div className="ml-11 space-y-2">
          <Textarea
            placeholder="Write a reply..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            className="min-h-[80px]"
            maxLength={1000}
          />
          <div className="flex space-x-2">
            <Button
              size="sm"
              onClick={() => handleSubmitReply(comment.id)}
              disabled={
                addCommentMutation.isPending || !replyContent.trim()
              }
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
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-11 space-y-2">
          {comment.replies.map((reply) => (
            <div
              key={reply.id}
              className="flex items-start space-x-3 p-2 bg-muted/20 rounded-lg"
            >
              <div className="flex-shrink-0">
                {getUserAvatar(reply.user, 6)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-xs font-medium text-foreground">
                    {getUserDisplayName(reply.user)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(reply.createdAt as string)}
                  </p>
                </div>
                <p className="text-xs text-foreground mt-1">
                  {reply.content || ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <MessageCircle className="w-5 h-5" />
              <span>Comments on {product.name}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8 text-destructive">
            Failed to load comments. Please check the API response format.
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5" />
            <span>Comments on {product.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading comments...
            </div>
          ) : !comments || comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            comments.map(renderComment)
          )}
        </div>

        <div className="border-t pt-4 space-y-3">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px]"
            maxLength={1000}
          />

          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              {newComment.length}/1000 characters
            </p>
            <Button
              onClick={handleSubmitComment}
              disabled={
                addCommentMutation.isPending ||
                !newComment.trim() ||
                newComment.length > 1000
              }
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
