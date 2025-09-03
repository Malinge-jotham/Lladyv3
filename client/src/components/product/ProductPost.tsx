import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FaHeart, FaRegHeart, FaComment, FaRetweet, FaBookmark, FaShoppingCart } from "react-icons/fa";

interface ProductPostProps {
  product: {
    id: string;
    name: string;
    description: string;
    price: string;
    imageUrls?: string[];
    likes?: number;
    comments?: number;
    shares?: number;
    createdAt: string;
    user?: {
      id: string;
      firstName?: string;
      lastName?: string;
      username?: string;
      profileImageUrl?: string;
    };
  };
}

export default function ProductPost({ product }: ProductPostProps) {
  const [isLiked, setIsLiked] = useState(false);
  const { addToCart } = useCart();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (isLiked) {
        await apiRequest("DELETE", `/api/products/${product.id}/like`);
      } else {
        await apiRequest("POST", `/api/products/${product.id}/like`);
      }
    },
    onSuccess: () => {
      setIsLiked(!isLiked);
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to like product",
        variant: "destructive",
      });
    },
  });

  const shareMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/products/${product.id}/share`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product shared!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to share product",
        variant: "destructive",
      });
    },
  });

  const handleLike = () => {
    likeMutation.mutate();
  };

  const handleShare = () => {
    shareMutation.mutate();
  };

  const handleAddToCart = () => {
    addToCart(product.id);
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "now";
    if (diffInHours < 24) return `${diffInHours}h`;
    return `${Math.floor(diffInHours / 24)}d`;
  };

  const mainImage = product.imageUrls && product.imageUrls.length > 0 
    ? product.imageUrls[0] 
    : "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400";

  return (
    <div className="p-6 hover:bg-muted/30 transition-colors" data-testid={`product-post-${product.id}`}>
      <div className="flex space-x-3">
        {/* Profile Picture */}
        {product.user?.profileImageUrl ? (
          <img
            src={product.user.profileImageUrl}
            alt="User avatar"
            className="w-10 h-10 rounded-full object-cover"
            data-testid={`user-avatar-${product.user.id}`}
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground text-sm">
              {product.user?.firstName?.[0] || '?'}
            </span>
          </div>
        )}
        
        <div className="flex-1 space-y-3">
          {/* User Info */}
          <div className="flex items-center space-x-2">
            <span className="font-semibold" data-testid={`user-name-${product.id}`}>
              {product.user?.firstName} {product.user?.lastName}
            </span>
            <span className="text-muted-foreground text-sm" data-testid={`user-handle-${product.id}`}>
              @{product.user?.username || 'user'}
            </span>
            <span className="text-muted-foreground text-sm">·</span>
            <span className="text-muted-foreground text-sm" data-testid={`post-timestamp-${product.id}`}>
              {getTimeAgo(product.createdAt)}
            </span>
          </div>

          {/* Product Content */}
          <div className="space-y-3">
            <p data-testid={`product-description-${product.id}`}>
              {product.description}
            </p>
            
            {/* Product Image */}
            <img
              src={mainImage}
              alt={product.name}
              className="rounded-xl w-full object-cover max-h-96"
              data-testid={`product-image-${product.id}`}
            />
            
            {/* Product Details */}
            <div className="bg-secondary/50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-lg" data-testid={`product-name-${product.id}`}>
                  {product.name}
                </h4>
                <span className="text-xl font-bold text-primary" data-testid={`product-price-${product.id}`}>
                  ${product.price}
                </span>
              </div>
              <Button
                onClick={handleAddToCart}
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                data-testid={`button-add-to-cart-${product.id}`}
              >
                <FaShoppingCart className="mr-2" />
                Add to Cart
              </Button>
            </div>
          </div>

          {/* Social Actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleLike}
              className="flex items-center space-x-2 text-muted-foreground hover:text-accent transition-colors"
              disabled={likeMutation.isPending}
              data-testid={`button-like-${product.id}`}
            >
              {isLiked ? <FaHeart className="text-accent" /> : <FaRegHeart />}
              <span data-testid={`like-count-${product.id}`}>
                {(product.likes || 0) + (isLiked ? 1 : 0)}
              </span>
            </button>
            <button
              className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors"
              data-testid={`button-comment-${product.id}`}
            >
              <FaComment />
              <span data-testid={`comment-count-${product.id}`}>
                {product.comments || 0}
              </span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors"
              disabled={shareMutation.isPending}
              data-testid={`button-share-${product.id}`}
            >
              <FaRetweet />
              <span data-testid={`share-count-${product.id}`}>
                {product.shares || 0}
              </span>
            </button>
            <button
              className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors"
              data-testid={`button-bookmark-${product.id}`}
            >
              <FaBookmark />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
