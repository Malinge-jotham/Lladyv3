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

export default function ProductCard({ product, showAddToVroom = true, className }: ProductCardProps) {
  const { addToCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [showVroomModal, setShowVroomModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);

  const handleAddToCart = () => {
    addToCart(product.id);
  };

  const handleShare = async () => {
    try {
      // Construct the product URL
      const productUrl = `${window.location.origin}/product/${product.id}`;

      // Use the Clipboard API to copy the URL
      await navigator.clipboard.writeText(productUrl);

      toast({
        title: "Link Copied!",
        description: "Product link has been copied to clipboard.",
      });
    } catch (err) {
      console.error('Failed to copy link:', err);
      toast({
        title: "Error",
        description: "Failed to copy link. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddToVroom = () => {
    setShowVroomModal(true);
  };

  const handleShowComments = () => {
    setShowCommentsModal(true);
  };

  const handleEditProduct = () => {
    // Navigate to edit product page
    window.location.href = `/product/edit/${product.id}`;
  };

  const mainImage = product.imageUrls && product.imageUrls.length > 0 
    ? product.imageUrls[0] 
    : "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300";

  // Convert price to string if it's a number
  const displayPrice = typeof product.price === 'number' ? product.price.toFixed(2) : product.price;

  // Check if current user is the product owner
  const isProductOwner = user?.id === (product.userId || product.user?.id);

  return (
    <>
      <Card className={`overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col ${className || ''}`} data-testid={`product-card-${product.id}`}>
        <div className="relative">
          <img
            src={mainImage}
            alt={product.name}
            className="w-full h-48 object-cover"
            data-testid={`product-image-${product.id}`}
          />
          {/* Add to Vroom button overlay */}
          {showAddToVroom && isAuthenticated && (
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAddToVroom();
              }}
              data-testid={`button-add-to-vroom-${product.id}`}
            >
              <FaStore className="w-3 h-3" />
            </Button>
          )}

          {/* Edit button for product owner */}
          {isProductOwner && (
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleEditProduct();
              }}
              data-testid={`button-edit-${product.id}`}
            >
              <FaEdit className="w-3 h-3" />
            </Button>
          )}
        </div>

        <CardContent className="p-4 flex flex-col flex-grow">
          <h3 className="font-semibold mb-2 line-clamp-2 h-10" data-testid={`product-name-${product.id}`}>
            {product.name}
          </h3>
          <p className="text-muted-foreground text-sm mb-3 line-clamp-3 flex-grow" data-testid={`product-description-${product.id}`}>
            {product.description}
          </p>

          <div className="flex items-center justify-between mb-3">
            <span className="text-xl font-bold text-primary" data-testid={`product-price-${product.id}`}>
              KSH{displayPrice}
            </span>
            {product.likes !== undefined && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <FaHeart className="w-3 h-3" />
                <span className="text-sm">{product.likes}</span>
              </div>
            )}
          </div>

          {product.user && (
            <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
              by {product.user.firstName} {product.user.lastName}
            </p>
          )}

          <div className="flex gap-2 mb-2">
            <Button 
              onClick={handleAddToCart}
              className="flex-1 p-2"
              data-testid={`button-add-to-cart-${product.id}`}
              title="Add to Cart"
            >
              <FaShoppingCart className="w-4 h-4" />
            </Button>

            <Button 
              onClick={handleShare}
              variant="outline"
              className="flex-1 p-2"
              data-testid={`button-share-${product.id}`}
              title="Share"
            >
              <FaShare className="w-4 h-4" />
            </Button>

            <Button
              onClick={handleShowComments}
              variant="outline"
              className="flex-1 p-2"
              data-testid={`button-comments-${product.id}`}
              title="Comments"
            >
              <FaComment className="w-4 h-4" />
            </Button>
          </div>

          {/* Message Seller Button - Keep text as requested */}
          {isAuthenticated && (product.userId || product.user?.id) && !isProductOwner && (
            <div className="mt-2">
              <MessageSellerButton
                sellerId={product.userId || product.user?.id || ''}
                sellerName={product.user ? `${product.user.firstName} ${product.user.lastName}` : undefined}
                productName={product.name}
              />
            </div>
          )}

          {/* Add to Vroom button (bottom action) */}
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

      {/* Add to Vroom Modal */}
      {showVroomModal && (
        <AddProductToVroomModal
          isOpen={showVroomModal}
          onClose={() => setShowVroomModal(false)}
          productId={product.id}
          productName={product.name}
        />
      )}

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