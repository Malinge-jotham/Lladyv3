// components/product/ProductDetailPage.tsx
import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { FaShoppingCart, FaShare, FaHeart, FaArrowLeft, FaStore } from "react-icons/fa";
import MessageSellerButton from "@/components/product/MessageSellerButton";
import ProductCommentsModal from "@/components/product/ProductCommentsModal";
import AddProductToVroomModal from "@/components/vroom/AddProductToVroomModal";

// ✅ Layout
import Sidebar from "@/components/layout/Sidebar";
import RightSidebar from "@/components/layout/RightSidebar";

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  NGN: "₦",
  GHS: "₵",
  KES: "KSh",
  ZAR: "R",
  EGP: "£",
  XOF: "CFA",
};

export default function ProductDetailPage() {
  const [match, params] = useRoute("/products/:id");
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showVroomModal, setShowVroomModal] = useState(false);

  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (params?.id) {
      fetchProductData(params.id);
    }
  }, [params?.id]);

  const fetchProductData = async (productId: string) => {
    try {
      setLoading(true);
      const response = await apiRequest("GET", `/api/products/${productId}`);
      const productData = await response.json();
      setProduct(productData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load product",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product.id);
      toast({
        title: "Added to Cart",
        description: `${product.name} has been added to your cart.`,
      });
    }
  };

  const handleShare = async () => {
    try {
      const productUrl = `${window.location.origin}/products/${product.id}`;
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Product not found
      </div>
    );
  }

  const mainImage =
    product.imageUrls && product.imageUrls.length > 0
      ? product.imageUrls[selectedImage]
      : "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600";

  const currencySymbol = product.currency
    ? CURRENCY_SYMBOLS[product.currency] || "KSh"
    : "KSh";

  const displayPrice =
    typeof product.price === "number" ? product.price.toFixed(2) : product.price;

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      {/* Main Product Content - centered, compressed */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Back Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.history.back()}
            className="mb-6"
          >
            <FaArrowLeft className="mr-2" />
            Back
          </Button>

          {/* Product Image */}
          <div>
            <img
              src={mainImage}
              alt={product.name}
              className="w-full object-cover rounded-lg"
            />
            {product.imageUrls && product.imageUrls.length > 1 && (
              <div className="grid grid-cols-4 gap-2 mt-4">
                {product.imageUrls.map((url: string, index: number) => (
                  <img
                    key={index}
                    src={url}
                    alt={`${product.name} ${index + 1}`}
                    className={`w-full h-20 object-cover rounded cursor-pointer border-2 ${
                      selectedImage === index
                        ? "border-primary"
                        : "border-transparent"
                    }`}
                    onClick={() => setSelectedImage(index)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              <p className="text-2xl font-bold text-primary mb-4">
                {currencySymbol}
                {displayPrice}
              </p>
              <p className="text-muted-foreground mb-4">{product.description}</p>
            </div>

            {product.user && (
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                {product.user.profileImageUrl ? (
                  <img
                    src={product.user.profileImageUrl}
                    alt="Seller"
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-semibold">
                      {product.user.firstName?.[0]}
                      {product.user.lastName?.[0]}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-semibold">
                    {product.user.firstName} {product.user.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">Seller</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button onClick={handleAddToCart} className="w-full" size="lg">
                <FaShoppingCart className="mr-2" />
                Add to Cart
              </Button>

              <div className="flex gap-2">
                <Button onClick={handleShare} variant="outline" className="flex-1">
                  <FaShare className="mr-2" />
                  Share
                </Button>

                {isAuthenticated && (product.userId || product.user?.id) && (
                  <MessageSellerButton
                    sellerId={product.userId || product.user?.id || ""}
                    sellerName={
                      product.user
                        ? `${product.user.firstName} ${product.user.lastName}`
                        : undefined
                    }
                    productName={product.name}
                    variant="outline"
                    className="flex-1"
                  />
                )}
              </div>

              {isAuthenticated && (
                <Button
                  variant="ghost"
                  onClick={() => setShowVroomModal(true)}
                  className="w-full"
                >
                  <FaStore className="mr-2" />
                  Add to Vroom
                </Button>
              )}

              <Button
                variant="ghost"
                onClick={() => setShowCommentsModal(true)}
                className="w-full"
              >
                <FaHeart className="mr-2" />
                View Comments
              </Button>
            </div>

            {/* Product Stats */}
            {product.likes !== undefined && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <FaHeart />
                  {product.likes} likes
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        {showVroomModal && (
          <AddProductToVroomModal
            isOpen={showVroomModal}
            onClose={() => setShowVroomModal(false)}
            productId={product.id}
            productName={product.name}
          />
        )}

        {showCommentsModal && (
          <ProductCommentsModal
            isOpen={showCommentsModal}
            onClose={() => setShowCommentsModal(false)}
            product={product}
          />
        )}
      </div>

      <RightSidebar />
    </div>
  );
}
