import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import AddProductToVroomModal from "@/components/vroom/AddProductToVroomModal";
import MessageSellerButton from "@/components/product/MessageSellerButton";
import { FaHeart, FaShoppingCart, FaBolt, FaStore, FaComment } from "react-icons/fa";
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
}

export default function ProductCard({ product, showAddToVroom = true }: ProductCardProps) {
  const { addToCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const [showVroomModal, setShowVroomModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);

  const handleAddToCart = () => {
    addToCart(product.id);
  };

  const handleQuickBuy = () => {
    // TODO: Implement quick buy functionality
    console.log("Quick buy:", product.id);
  };

  const handleAddToVroom = () => {
    setShowVroomModal(true);
  };

  const handleShowComments = () => {
    setShowCommentsModal(true);
  };

  const mainImage = product.imageUrls && product.imageUrls.length > 0 
    ? product.imageUrls[0] 
    : "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300";

  // Convert price to string if it's a number
  const displayPrice = typeof product.price === 'number' ? product.price.toFixed(2) : product.price;

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`product-card-${product.id}`}>
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
        </div>
        
        <CardContent className="p-4">
          <h3 className="font-semibold mb-2" data-testid={`product-name-${product.id}`}>
            {product.name}
          </h3>
          <p className="text-muted-foreground text-sm mb-3 line-clamp-2" data-testid={`product-description-${product.id}`}>
            {product.description}
          </p>
          
          <div className="flex items-center justify-between mb-3">
            <span className="text-xl font-bold text-primary" data-testid={`product-price-${product.id}`}>
              ${displayPrice}
            </span>
            {product.likes !== undefined && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <FaHeart className="w-3 h-3" />
                <span className="text-sm">{product.likes}</span>
              </div>
            )}
          </div>

          {product.user && (
            <p className="text-xs text-muted-foreground mb-3">
              by {product.user.firstName} {product.user.lastName}
            </p>
          )}

          <div className="flex gap-2 mb-2">
            <Button 
              onClick={handleAddToCart}
              className="flex-1"
              data-testid={`button-add-to-cart-${product.id}`}
            >
              <FaShoppingCart className="w-4 h-4 mr-2" />
              Add to Cart
            </Button>
            
            <Button 
              onClick={handleQuickBuy}
              variant="outline"
              className="flex-1"
              data-testid={`button-quick-buy-${product.id}`}
            >
              <FaBolt className="w-4 h-4 mr-2" />
              Buy Now
            </Button>
          </div>
          
          {/* Comment button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShowComments}
            className="w-full text-muted-foreground hover:text-foreground"
            data-testid={`button-comments-${product.id}`}
          >
            <FaComment className="w-3 h-3 mr-2" />
            Comments
          </Button>

          {/* Message Seller Button */}
          {isAuthenticated && (product.userId || product.user?.id) && (
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
              className="w-full mt-2 text-muted-foreground hover:text-foreground"
              data-testid={`button-add-to-vroom-bottom-${product.id}`}
            >
              <FaStore className="w-3 h-3 mr-2" />
              Add to Vroom
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