import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { FaUser, FaReply, FaTimes, FaComment, FaPaperPlane } from "react-icons/fa";

interface ProductCommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    description: string;
    price: string;
    imageUrls?: string[];
    user?: {
      id?: string;
      firstName?: string;
      lastName?: string;
      profileImageUrl?: string;
    };
  };
}

interface Comment {
  id: string;
  userId: string;
  productId: string;
  parentCommentId?: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  };
  replies: Comment[];
}

interface CommentProps {
  comment: Comment;
  productId: string;
  onReply: (parentId: string) => void;
  currentUserId?: string;
}

// Memoized comment item to prevent unnecessary re-renders
const CommentItem = ({ comment, productId, onReply, currentUserId }: CommentProps) => {
  const userName = useMemo(() => {
    return comment.user.firstName || comment.user.lastName 
      ? `${comment.user.firstName} ${comment.user.lastName}`.trim()
      : "Anonymous";
  }, [comment.user.firstName, comment.user.lastName]);

  const isOwn = currentUserId === comment.userId;
  const hasReplies = comment.replies && comment.replies.length > 0;

  const handleReplyClick = useCallback(() => {
    onReply(comment.id);
  }, [comment.id, onReply]);

  return (
    <div className="space-y-3" data-testid={`comment-${comment.id}`}>
      {/* Main Comment */}
      <div className="flex space-x-3">
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={comment.user.profileImageUrl} alt={`${userName}'s avatar`} />
          <AvatarFallback>
            <FaUser className="text-xs" />
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className={`rounded-2xl px-4 py-3 ${
            isOwn 
              ? "bg-primary text-primary-foreground ml-8" 
              : "bg-muted"
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className={`font-medium text-sm ${
                isOwn ? "text-primary-foreground" : "text-foreground"
              }`}>
                {userName}
              </span>
              <time 
                className={`text-xs ${
                  isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                }`}
                dateTime={comment.createdAt}
              >
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </time>
            </div>
            <p className={`text-sm leading-relaxed ${
              isOwn ? "text-primary-foreground" : "text-foreground"
            }`}>
              {comment.content}
            </p>
          </div>

          <div className="flex items-center mt-2 space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReplyClick}
              className="text-xs text-muted-foreground hover:text-foreground p-1 h-auto"
              data-testid={`button-reply-${comment.id}`}
              aria-label={`Reply to ${userName}'s comment`}
            >
              <FaReply className="w-3 h-3 mr-1" />
              Reply
            </Button>
          </div>
        </div>
      </div>

      {/* Replies */}
      {hasReplies && (
        <div className="ml-11 space-y-3 border-l-2 border-muted pl-4">
          {comment.replies.map((reply) => (
            <MemoizedCommentItem
              key={reply.id}
              comment={reply}
              productId={productId}
              onReply={onReply}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Memoized version to prevent unnecessary re-renders
const MemoizedCommentItem = React.memo(CommentItem);

export default function ProductCommentsModal({
  isOpen,
  onClose,
  product,
}: ProductCommentsModalProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Fetch comments
  const { 
    data: comments = [], 
    isLoading, 
    error 
  } = useQuery<Comment[]>({
    queryKey: ["/api/products", product.id, "comments"],
    enabled: isOpen,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error)) return false;
      return failureCount < 2;
    },
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
      queryClient.invalidateQueries({ queryKey: ["/api/products", product.id, "comments"] });
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

  // Calculate comment count with useMemo to prevent recalculations
  const commentCount = useMemo(() => {
    return comments.reduce((count, comment) => {
      return count + 1 + (comment.replies?.length || 0);
    }, 0);
  }, [comments]);

  const handleAddComment = useCallback(() => {
    if (!newComment.trim()) {
      toast({
        title: "Error",
        description: "Please write a comment",
        variant: "destructive",
      });
      return;
    }
    addCommentMutation.mutate({ content: newComment.trim() });
  }, [newComment, addCommentMutation, toast]);

  const handleReply = useCallback((parentId: string) => {
    setReplyingTo(parentId);
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, []);

  const handleSubmitReply = useCallback(() => {
    if (!replyContent.trim()) {
      toast({
        title: "Error",
        description: "Please write a reply",
        variant: "destructive",
      });
      return;
    }
    addCommentMutation.mutate({ 
      content: replyContent.trim(), 
      parentCommentId: replyingTo || undefined 
    });
  }, [replyContent, replyingTo, addCommentMutation, toast]);

  const handleClose = useCallback(() => {
    setNewComment("");
    setReplyContent("");
    setReplyingTo(null);
    onClose();
  }, [onClose]);

  // Auto-resize textarea and scroll to bottom when new comments are added
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [replyContent, newComment]);

  // Scroll to bottom when comments change
  useEffect(() => {
    if (commentsEndRef.current && !isLoading) {
      commentsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments, isLoading]);

  // Handle escape key to close reply
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && replyingTo) {
        setReplyingTo(null);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [replyingTo]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] p-0" 
        data-testid="comments-modal"
        aria-describedby="comments-description"
      >
        {/* Header */}
        <DialogHeader className="border-b p-4 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                {product.imageUrls && product.imageUrls[0] ? (
                  <img
                    src={product.imageUrls[0]}
                    alt={product.name}
                    className="w-full h-full object-cover rounded-lg"
                    loading="lazy"
                  />
                ) : (
                  <FaComment className="text-primary" aria-hidden="true" />
                )}
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold" data-testid="comments-title">
                  {product.name}
                </DialogTitle>
                <p className="text-sm text-muted-foreground" id="comments-description">
                  {commentCount} comment{commentCount !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              data-testid="button-close-comments"
              aria-label="Close comments"
            >
              <FaTimes aria-hidden="true" />
            </Button>
          </div>
        </DialogHeader>

        {/* Comments Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[60vh]">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex space-x-3">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-16 w-full rounded-2xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12 text-destructive">
              <FaTimes className="mx-auto text-4xl mb-3" aria-hidden="true" />
              <h3 className="font-medium mb-1">Failed to load comments</h3>
              <p className="text-sm">
                Please try again later
              </p>
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-6">
              {comments.map((comment) => (
                <MemoizedCommentItem
                  key={comment.id}
                  comment={comment}
                  productId={product.id}
                  onReply={handleReply}
                  currentUserId={user?.id}
                />
              ))}
              <div ref={commentsEndRef} />
            </div>
          ) : (
            <div className="text-center py-12">
              <FaComment className="mx-auto text-4xl text-muted-foreground mb-3" aria-hidden="true" />
              <h3 className="font-medium mb-1">No comments yet</h3>
              <p className="text-sm text-muted-foreground">
                Be the first to share your thoughts about this product!
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* Reply Section */}
        {replyingTo && (
          <div className="px-4 py-3 bg-muted/30 border-t">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Replying to comment</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyingTo(null)}
                className="h-auto p-1"
                aria-label="Cancel reply"
              >
                <FaTimes className="w-3 h-3" aria-hidden="true" />
              </Button>
            </div>
            <div className="flex space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.profileImageUrl} alt="Your avatar" />
                <AvatarFallback>
                  <FaUser className="text-xs" aria-hidden="true" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 flex space-x-2">
                <Textarea
                  ref={textareaRef}
                  placeholder="Write your reply..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="min-h-[40px] max-h-[120px] resize-none border-muted"
                  data-testid="textarea-reply"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.metaKey) {
                      handleSubmitReply();
                    }
                  }}
                />
                <Button
                  onClick={handleSubmitReply}
                  disabled={!replyContent.trim() || addCommentMutation.isPending}
                  size="sm"
                  data-testid="button-submit-reply"
                  aria-label="Submit reply"
                >
                  <FaPaperPlane className="w-3 h-3" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Add Comment Section */}
        {isAuthenticated && (
          <div className="border-t p-4">
            <div className="flex space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.profileImageUrl} alt="Your avatar" />
                <AvatarFallback>
                  <FaUser className="text-xs" aria-hidden="true" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <Textarea
                  placeholder="What do you think about this product?"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[60px] resize-none"
                  data-testid="textarea-comment"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.metaKey) {
                      handleAddComment();
                    }
                  }}
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || addCommentMutation.isPending}
                    data-testid="button-add-comment"
                  >
                    {addCommentMutation.isPending ? (
                      "Posting..."
                    ) : (
                      <>
                        <FaPaperPlane className="w-3 h-3 mr-2" aria-hidden="true" />
                        Comment
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Login prompt for unauthenticated users */}
        {!isAuthenticated && (
          <div className="border-t p-4 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Join the conversation about this product
            </p>
            <Button onClick={() => window.location.href = "/api/login"}>
              Sign in to comment
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}