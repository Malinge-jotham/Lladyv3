import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AddProductToVroomModal from "@/components/vroom/AddProductToVroomModal";
import MessageSellerButton from "@/components/product/MessageSellerButton";
import { FaHeart, FaShoppingCart, FaShare, FaStore, FaComment, FaEdit } from "react-icons/fa";
import ProductCommentsModal from "@/components/product/ProductCommentsModal";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description: string;
    price: string | number;
    imageUrls?: string[];
    likes?: number;
    userId?: string;
    user?: {
      id?: string;
      firstName?: string;
      lastName?: string;
    };
  };
  showAddToVroom?: boolean;
  className?: string;
}

interface ProductStats {
  likes: number;
  comments: number;
  recentComments: Array<{
    id: string;
    content: string;
    createdAt: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
    };
  }>;
}

export default function ProductCard({ product, showAddToVroom = true, className }: ProductCardProps) {
  const { addToCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [showVroomModal, setShowVroomModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);

  const { data: productStats, isLoading: statsLoading } = useQuery<ProductStats>({
    queryKey: [`/api/products/${product.id}/stats`],
    enabled: !!product.id,
    staleTime: 5 * 60 * 1000,
  });

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to like products",
        variant: "destructive",
      });
      return;
    }
    try {
      await apiRequest('POST', `/api/products/${product.id}/like`);
      toast({ title: "Liked!", description: "Product liked successfully" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to like product. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddToCart = () => addToCart(product.id);
  const handleShare = async () => {
    try {
      const productUrl = `${window.location.origin}/product/${product.id}`;
      await navigator.clipboard.writeText(productUrl);
      toast({ title: "Link Copied!", description: "Product link copied." });
    } catch {
      toast({ title: "Error", description: "Failed to copy link.", variant: "destructive" });
    }
  };
  const handleAddToVroom = () => setShowVroomModal(true);
  const handleShowComments = () => setShowCommentsModal(true);
  const handleEditProduct = () => { window.location.href = `/product/edit/${product.id}`; };

  const mainImage = product.imageUrls?.[0] ||
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&h=300";

  const displayPrice = typeof product.price === 'number' ? product.price.toFixed(2) : product.price;
  const isProductOwner = user?.id === (product.userId || product.user?.id);

  return (
    <>
      <Card className={`overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col ${className || ''}`} data-testid={`product-card-${product.id}`}>
        {/* Image section clickable */}
        <a href={`/product/${product.id}`} className="relative group block">
          <img
            src={mainImage}
            alt={product.name}
            className="w-full h-48 object-cover"
            data-testid={`product-image-${product.id}`}
          />

          {showAddToVroom && isAuthenticated && (
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAddToVroom(); }}
              data-testid={`button-add-to-vroom-${product.id}`}
            >
              <FaStore className="w-3 h-3" />
            </Button>
          )}

          {isProductOwner && (
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEditProduct(); }}
              data-testid={`button-edit-${product.id}`}
            >
              <FaEdit className="w-3 h-3" />
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleLike(); }}
            data-testid={`button-like-${product.id}`}
          >
            <FaHeart className="w-3 h-3" />
          </Button>
        </a>

        <CardContent className="p-4 flex flex-col flex-grow">
          <h3 className="font-semibold mb-2 line-clamp-2 h-10" data-testid={`product-name-${product.id}`}>{product.name}</h3>
          <p className="text-muted-foreground text-sm mb-3 line-clamp-3 flex-grow" data-testid={`product-description-${product.id}`}>{product.description}</p>

          <div className="flex items-center justify-between mb-3">
            <span className="text-xl font-bold text-primary" data-testid={`product-price-${product.id}`}>
              KSH{displayPrice}
            </span>

            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="flex items-center gap-1" title={`${productStats?.likes || 0} likes`}>
                <FaHeart className="w-3 h-3" />
                <span className="text-sm" data-testid={`product-likes-${product.id}`}>
                  {statsLoading ? '...' : (productStats?.likes || 0)}
                </span>
              </div>
              <div className="flex items-center gap-1" title={`${productStats?.comments || 0} comments`}>
                <FaComment className="w-3 h-3" />
                <span className="text-sm" data-testid={`product-comments-${product.id}`}>
                  {statsLoading ? '...' : (productStats?.comments || 0)}
                </span>
              </div>
            </div>
          </div>

          {product.user && (
            <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
              by {product.user.firstName} {product.user.lastName}
            </p>
          )}

          {productStats?.recentComments?.length ? (
            <div className="mb-3 border-t pt-2">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Recent Comments:</p>
              <div className="space-y-1 max-h-20 overflow-y-auto">
                {productStats.recentComments.slice(0, 2).map((comment) => (
                  <div key={comment.id} className="text-xs bg-muted/50 p-1 rounded">
                    <span className="font-medium">{comment.user.firstName}: </span>
                    <span className="text-muted-foreground line-clamp-1">{comment.content}</span>
                  </div>
                ))}
                {productStats.recentComments.length > 2 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{productStats.recentComments.length - 2} more comments
                  </p>
                )}
              </div>
            </div>
          ) : null}

          <div className="flex gap-2 mb-2">
            <Button onClick={handleAddToCart} className="flex-1 p-2" data-testid={`button-add-to-cart-${product.id}`} title="Add to Cart">
              <FaShoppingCart className="w-4 h-4" />
            </Button>
            <Button onClick={handleShare} variant="outline" className="flex-1 p-2" data-testid={`button-share-${product.id}`} title="Share">
              <FaShare className="w-4 h-4" />
            </Button>
            <Button onClick={handleShowComments} variant="outline" className="flex-1 p-2" data-testid={`button-comments-${product.id}`} title="Comments">
              <FaComment className="w-4 h-4" />
            </Button>
          </div>

          {isAuthenticated && (product.userId || product.user?.id) && !isProductOwner && (
            <div className="mt-2">
              <MessageSellerButton
                sellerId={product.userId || product.user?.id || ''}
                sellerName={product.user ? `${product.user.firstName} ${product.user.lastName}` : undefined}
                productName={product.name}
              />
            </div>
          )}

          {showAddToVroom && isAuthenticated && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAddToVroom}
              className="w-full mt-2 text-muted-foreground hover:text-foreground p-2"
              data-testid={`button-add-to-vroom-bottom-${product.id}`}
              title="Add to Vroom"
            >
              <FaStore className="w-3 h-3" />
            </Button>
          )}
        </CardContent>
      </Card>

      {showVroomModal && (
        <AddProductToVroomModal isOpen={showVroomModal} onClose={() => setShowVroomModal(false)} productId={product.id} productName={product.name} />
      )}

      {showCommentsModal && (
        <ProductCommentsModal isOpen={showCommentsModal} onClose={() => setShowCommentsModal(false)} product={product} initialStats={productStats} />
      )}
    </>
  );
}
