import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FaTimes, FaTruck, FaExclamationTriangle } from "react-icons/fa";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: any[];
}

interface ShippingAddress {
  country: string;
  city: string;
  streetAddress: string;
}

export default function CheckoutModal({ isOpen, onClose, cartItems }: CheckoutModalProps) {
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    country: "",
    city: "",
    streetAddress: "",
  });
  const [hasOwnProducts, setHasOwnProducts] = useState(false);
  const [filteredCartItems, setFilteredCartItems] = useState<any[]>([]);

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Filter out user's own products and check if any were removed
  useEffect(() => {
    if (user && cartItems) {
      const filteredItems = cartItems.filter(item => 
        item.product && item.product.userId !== (user as any)?.id
      );

      setFilteredCartItems(filteredItems);
      setHasOwnProducts(filteredItems.length !== cartItems.length);
    }
  }, [cartItems, user]);

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await apiRequest("POST", "/api/orders", orderData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Order Placed!",
        description: "Your order has been placed successfully. The seller will contact you soon.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: any) => {
      const response = await apiRequest("POST", "/api/messages", messageData);
      return response.json();
    },
    onError: (error) => {
      console.error("Failed to send message:", error);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!shippingAddress.country || !shippingAddress.city || !shippingAddress.streetAddress) {
      toast({
        title: "Error",
        description: "Please fill in all shipping address fields",
        variant: "destructive",
      });
      return;
    }

    if (filteredCartItems.length === 0) {
      toast({
        title: "No items to purchase",
        description: "You cannot purchase your own products.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Group items by seller
      const itemsBySeller: { [sellerId: string]: any[] } = {};
      filteredCartItems.forEach(item => {
        if (item.product && item.product.userId) {
          const sellerId = item.product.userId;
          if (!itemsBySeller[sellerId]) {
            itemsBySeller[sellerId] = [];
          }
          itemsBySeller[sellerId].push(item);
        }
      });

      // Create separate orders for each product and send PRIVATE messages
      for (const [sellerId, sellerItems] of Object.entries(itemsBySeller)) {
        for (const item of sellerItems) {
          if (item.product) {
            // Create order
            const orderResponse = await createOrderMutation.mutateAsync({
              sellerId,
              productId: item.productId,
              quantity: item.quantity,
              totalAmount: (parseFloat(item.product.price) * item.quantity).toString(),
              shippingAddress,
            });

            // Send PRIVATE order notification to seller (only visible to seller)
            const sellerMessage = `
New Order Received!

Customer: ${user?.name || user?.email}
Shipping Address:
${shippingAddress.streetAddress}
${shippingAddress.city}, ${shippingAddress.country}

Product: ${item.product.name} × ${item.quantity}
Price: $${item.product.price} each
Total: $${(parseFloat(item.product.price) * item.quantity).toFixed(2)}

Order ID: ${orderResponse.id}
Please contact the customer to arrange delivery and payment.
            `.trim();

            await sendMessageMutation.mutateAsync({
              senderId: user?.id, // Buyer sends this notification
              receiverId: sellerId,
              content: sellerMessage,
              messageType: 'order_notification', // This type is only for sellers
              orderId: orderResponse.id,
              metadata: {
                orderId: orderResponse.id,
                productName: item.product.name,
                quantity: item.quantity,
                totalAmount: (parseFloat(item.product.price) * item.quantity).toFixed(2)
              }
            });
          }
        }
      }

      // Send PRIVATE order confirmation to buyer (only visible to buyer)
      const buyerMessage = `
Order Confirmation!

Thank you for your order with ELDADY MART.

Order Summary:
${filteredCartItems.map(item => `
- ${item.product.name} × ${item.quantity}
  Price: $${item.product.price} each
  Total: $${(parseFloat(item.product.price) * item.quantity).toFixed(2)}
`).join('')}

Grand Total: $${calculateTotal()}

Shipping Address:
${shippingAddress.streetAddress}
${shippingAddress.city}, ${shippingAddress.country}

Your sellers will contact you shortly to arrange delivery and payment.
Thank you for shopping with ELDADY MART!
      `.trim();

      // Use a system sender or the user themselves for the confirmation
      await sendMessageMutation.mutateAsync({
        senderId: user?.id, // Or use a system user ID if available
        receiverId: user?.id,
        content: buyerMessage,
        messageType: 'order_confirmation', // This type is only for buyers
        metadata: {
          orderCount: filteredCartItems.length,
          grandTotal: calculateTotal(),
          shippingAddress: shippingAddress
        }
      });

      toast({
        title: "Order Placed!",
        description: "Your order has been placed successfully. Check your messages for details.",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/orders/buyer"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/orders/seller"] });
      handleClose();

    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setShippingAddress({
      country: "",
      city: "",
      streetAddress: "",
    });
    setHasOwnProducts(false);
    onClose();
  };

  const calculateTotal = () => {
    return filteredCartItems.reduce((total, item) => {
      return total + (parseFloat(item.product?.price || 0) * item.quantity);
    }, 0).toFixed(2);
  };

  const countries = [
    "United States",
    "Canada",
    "United Kingdom",
    "Germany",
    "France",
    "Australia",
    "Japan",
    "Nigeria",
    "Ghana",
    "Kenya",
    "South Africa",
    "Egypt",
    "Other"
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" data-testid="checkout-modal">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle data-testid="checkout-title">Checkout Details</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              data-testid="button-close-checkout"
              className="h-8 w-8 p-0 rounded-full"
            >
              <FaTimes className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {hasOwnProducts && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-3">
            <FaExclamationTriangle className="text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Notice</p>
              <p>Your own products have been removed from the order. You cannot purchase items that you are selling.</p>
            </div>
          </div>
        )}

        {filteredCartItems.length === 0 ? (
          <div className="text-center py-8">
            <FaExclamationTriangle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="font-medium text-lg mb-2">No items to purchase</h3>
            <p className="text-muted-foreground mb-4">
              You cannot purchase your own products. Please add items from other sellers to your cart.
            </p>
            <Button onClick={handleClose} variant="outline">
              Continue Shopping
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="country">Country</Label>
              <Select
                value={shippingAddress.country}
                onValueChange={(value) => setShippingAddress(prev => ({ ...prev, country: value }))}
              >
                <SelectTrigger data-testid="select-country">
                  <SelectValue placeholder="Select Country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map(country => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="city">Town/City</Label>
              <Input
                id="city"
                value={shippingAddress.city}
                onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                placeholder="Enter your town or city"
                required
                data-testid="input-city"
              />
            </div>

            <div>
              <Label htmlFor="streetAddress">Street Address</Label>
              <Textarea
                id="streetAddress"
                value={shippingAddress.streetAddress}
                onChange={(e) => setShippingAddress(prev => ({ ...prev, streetAddress: e.target.value }))}
                placeholder="Enter your street address"
                className="h-20 resize-none"
                required
                data-testid="textarea-street-address"
              />
            </div>

            <div className="bg-accent/10 p-4 rounded-lg" data-testid="payment-method-info">
              <div className="flex items-center space-x-2 mb-2">
                <FaTruck className="text-accent" />
                <span className="font-medium">Payment Method</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Pay on Delivery - Cash payment when your order arrives
              </p>
            </div>

            {/* Order Summary */}
            <div className="bg-muted/30 p-4 rounded-lg" data-testid="order-summary">
              <h3 className="font-medium mb-3">Order Summary</h3>
              <div className="space-y-2">
                {filteredCartItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.product?.name} × {item.quantity}</span>
                    <span>${(parseFloat(item.product?.price || 0) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-border pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span data-testid="checkout-total">${calculateTotal()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                data-testid="button-cancel-checkout"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createOrderMutation.isPending || sendMessageMutation.isPending}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                data-testid="button-place-order"
              >
                {(createOrderMutation.isPending || sendMessageMutation.isPending) 
                  ? "Processing..." 
                  : "Place Order"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}