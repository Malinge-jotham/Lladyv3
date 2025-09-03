import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { FaHeart, FaShoppingCart, FaBolt } from "react-icons/fa";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description: string;
    price: string;
    imageUrls?: string[];
    likes?: number;
    user?: {
      firstName?: string;
      lastName?: string;
    };
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart(product.id);
  };

  const handleQuickBuy = () => {
    // TODO: Implement quick buy functionality
    console.log("Quick buy:", product.id);
  };

  const mainImage = product.imageUrls && product.imageUrls.length > 0 
    ? product.imageUrls[0] 
    : "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300";

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`product-card-${product.id}`}>
      <img
        src={mainImage}
        alt={product.name}
        className="w-full h-48 object-cover"
        data-testid={`product-image-${product.id}`}
      />
      <CardContent className="p-4">
        <h3 className="font-semibold mb-2" data-testid={`product-name-${product.id}`}>
          {product.name}
        </h3>
        <p className="text-muted-foreground text-sm mb-3 line-clamp-2" data-testid={`product-description-${product.id}`}>
          {product.description}
        </p>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xl font-bold text-primary" data-testid={`product-price-${product.id}`}>
            ${product.price}
          </span>
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <FaHeart className="text-accent" />
            <span data-testid={`product-likes-${product.id}`}>
              {product.likes || 0}
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <Button
            onClick={handleAddToCart}
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
            data-testid={`button-add-to-cart-${product.id}`}
          >
            <FaShoppingCart className="mr-2" />
            Add to Cart
          </Button>
          <Button
            onClick={handleQuickBuy}
            variant="outline"
            className="w-full hover:bg-muted"
            data-testid={`button-quick-buy-${product.id}`}
          >
            <FaBolt className="mr-2" />
            Buy Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
