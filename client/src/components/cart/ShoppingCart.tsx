import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import CheckoutModal from "./CheckoutModal";
import { useState } from "react";
import { FaTimes, FaTrash } from "react-icons/fa";

interface ShoppingCartProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ShoppingCart({ isOpen, onClose }: ShoppingCartProps) {
  const [showCheckout, setShowCheckout] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cartItems, isLoading } = useQuery({
    queryKey: ["/api/cart"],
    enabled: isOpen,
    retry: false,
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (productId: string) => {
      await apiRequest("DELETE", `/api/cart/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Success",
        description: "Item removed from cart",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to remove item from cart",
        variant: "destructive",
      });
    },
  });

  const handleRemoveItem = (productId: string) => {
    removeFromCartMutation.mutate(productId);
  };

  const handleCheckout = () => {
    setShowCheckout(true);
  };

  const calculateTotal = () => {
    if (!cartItems || !Array.isArray(cartItems)) return "0.00";
    return cartItems.reduce((total: number, item: any) => {
      return total + (parseFloat(item.product?.price || 0) * item.quantity);
    }, 0).toFixed(2);
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-96" data-testid="shopping-cart">
          <SheetHeader className="border-b border-border pb-4">
            <div className="flex items-center justify-between">
              <SheetTitle data-testid="cart-title">Shopping Cart</SheetTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                data-testid="button-close-cart"
              >
                <FaTimes />
              </Button>
            </div>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto py-6">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-4 bg-muted rounded-lg animate-pulse">
                    <div className="w-16 h-16 bg-muted-foreground/20 rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted-foreground/20 rounded w-3/4"></div>
                      <div className="h-3 bg-muted-foreground/20 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : cartItems && Array.isArray(cartItems) && cartItems.length > 0 ? (
              <div className="space-y-4" data-testid="cart-items">
                {cartItems.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-4 p-4 bg-muted rounded-lg"
                    data-testid={`cart-item-${item.productId}`}
                  >
                    {item.product?.imageUrls && item.product.imageUrls.length > 0 ? (
                      <img
                        src={item.product.imageUrls[0]}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded-lg"
                        data-testid={`cart-item-image-${item.productId}`}
                      />
                    ) : (
                      <div className="w-16 h-16 bg-muted-foreground/20 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">📦</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium" data-testid={`cart-item-name-${item.productId}`}>
                        {item.product?.name}
                      </h4>
                      <p className="text-sm text-muted-foreground" data-testid={`cart-item-price-${item.productId}`}>
                        ${item.product?.price} × {item.quantity}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(item.productId)}
                      className="text-destructive hover:text-destructive/80"
                      data-testid={`button-remove-${item.productId}`}
                    >
                      <FaTrash />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground" data-testid="empty-cart">
                <p>Your cart is empty</p>
                <p className="text-sm mt-1">Add some products to get started!</p>
              </div>
            )}
          </div>
          
          {cartItems && Array.isArray(cartItems) && cartItems.length > 0 && (
            <div className="border-t border-border pt-4 mt-4">
              <div className="space-y-4">
                <div className="flex justify-between text-lg font-semibold" data-testid="cart-total">
                  <span>Total: ${calculateTotal()}</span>
                </div>
                <Button
                  onClick={handleCheckout}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  data-testid="button-checkout"
                >
                  Checkout
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <CheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        cartItems={cartItems || []}
      />
    </>
  );
}
