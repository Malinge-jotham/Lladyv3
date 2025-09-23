import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import ProductCommentsModal from "@/components/product/ProductCommentsModal";
import { 
  FaHeart, 
  FaRegHeart, 
  FaComment, 
  FaShare, 
  FaBookmark, 
  FaShoppingCart 
} from "react-icons/fa";

interface ProductPostActionsProps {
  product: {
    id: string;
    name: string;
    likes?: number;
    comments?: number;
    shares?: number;
  };
}

export default function ProductPostActions({ product }: ProductPostActionsProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const { addToCart } = useCart();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ✅ Fetch product stats (likes, comments, shares)
  const { data: stats } = useQuery({
    queryKey: ["/api/products", product.id, "stats"],
    queryFn: () =>
      apiRequest("GET", `/api/products/${product.id}/stats`).then((r) => r.json()),
    initialData: {
      likes: product.likes ?? 0,
      comments: product.comments ?? 0,
      shares: product.shares ?? 0,
    },
  });

  // ✅ Fetch initial like/bookmark state
  useEffect(() => {
    async function fetchUserState() {
      try {
        const [liked, bookmarked] = await Promise.all([
          apiRequest("GET", `/api/products/${product.id}/isLiked`).then((r) => r.json()),
          apiRequest("GET", `/api/products/${product.id}/isBookmarked`).then((r) => r.json()),
        ]);
        setIsLiked(liked);
        setIsBookmarked(bookmarked);
      } catch (err) {
        console.error("Failed to fetch user state:", err);
      }
    }
    fetchUserState();
  }, [product.id]);

  // ✅ LIKE mutation with optimistic update
  const likeMutation = useMutation({
    mutationFn: async () => {
      if (isLiked) {
        await apiRequest("DELETE", `/api/products/${product.id}/like`);
      } else {
        await apiRequest("POST", `/api/products/${product.id}/like`);
      }
    },
    onMutate: () => {
      setIsLiked((prev) => !prev);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", product.id, "stats"] });
    },
    onError: () => {
      setIsLiked((prev) => !prev); // rollback
      toast({
        title: "Error",
        description: "Failed to like product",
        variant: "destructive",
      });
    },
  });

  // ✅ BOOKMARK mutation with optimistic update
  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      if (isBookmarked) {
        await apiRequest("DELETE", `/api/products/${product.id}/bookmark`);
      } else {
        await apiRequest("POST", `/api/products/${product.id}/bookmark`);
      }
    },
    onMutate: () => {
      setIsBookmarked((prev) => !prev);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", product.id, "stats"] });
    },
    onError: () => {
      setIsBookmarked((prev) => !prev); // rollback
      toast({
        title: "Error",
        description: "Failed to update bookmark",
        variant: "destructive",
      });
    },
  });

  // ✅ SHARE
  const handleShare = async () => {
    try {
      const productUrl = `${window.location.origin}/product/${product.id}`;
      await navigator.clipboard.writeText(productUrl);
      toast({
        title: "Link Copied!",
        description: "Product link has been copied to clipboard.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy link. Please try again.",
        variant: "destructive",
      });
    }
  };

  // ✅ ADD TO CART
  const handleAddToCart = () => {
    addToCart(product.id);
    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  return (
    <>
      <div className="flex gap-2 mb-2">
        {/* Add to Cart */}
        <button
          onClick={handleAddToCart}
          className="flex-1 p-2 rounded-md bg-accent text-accent-foreground hover:bg-accent/90"
          data-testid={`button-add-to-cart-${product.id}`}
          title="Add to Cart"
        >
          <FaShoppingCart className="w-4 h-4 mx-auto" />
        </button>

        {/* Like */}
        <button
          onClick={() => likeMutation.mutate()}
          className="flex-1 p-2 rounded-md border hover:text-accent transition-colors"
          disabled={likeMutation.isPending}
          data-testid={`button-like-${product.id}`}
          title="Like"
        >
          {isLiked ? (
            <FaHeart className="w-4 h-4 mx-auto text-accent" />
          ) : (
            <FaRegHeart className="w-4 h-4 mx-auto" />
          )}
          <span className="ml-1 text-xs">{stats?.likes ?? 0}</span>
        </button>

        {/* Comment */}
        <button
          onClick={() => setShowCommentsModal(true)}
          className="flex-1 p-2 rounded-md border hover:text-primary transition-colors"
          data-testid={`button-comment-${product.id}`}
          title="Comments"
        >
          <FaComment className="w-4 h-4 mx-auto" />
          <span className="ml-1 text-xs">{stats?.comments ?? 0}</span>
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          className="flex-1 p-2 rounded-md border hover:text-primary transition-colors"
          data-testid={`button-share-${product.id}`}
          title="Share"
        >
          <FaShare className="w-4 h-4 mx-auto" />
          <span className="ml-1 text-xs">{stats?.shares ?? 0}</span>
        </button>

        {/* Bookmark */}
        <button
          onClick={() => bookmarkMutation.mutate()}
          className="flex-1 p-2 rounded-md border hover:text-primary transition-colors"
          data-testid={`button-bookmark-${product.id}`}
          title="Bookmark"
        >
          <FaBookmark
            className={`w-4 h-4 mx-auto ${isBookmarked ? "text-primary" : ""}`}
          />
        </button>
      </div>

      {/* Comments Modal */}
      {showCommentsModal && (
        <ProductCommentsModal
          isOpen={showCommentsModal}
          onClose={() => setShowCommentsModal(false)}
          product={product}
        />
      )}
    </>
  );
}
