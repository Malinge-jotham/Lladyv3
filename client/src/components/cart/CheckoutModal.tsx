import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FaTimes, FaTruck } from "react-icons/fa";

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

  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shippingAddress.country || !shippingAddress.city || !shippingAddress.streetAddress) {
      toast({
        title: "Error",
        description: "Please fill in all shipping address fields",
        variant: "destructive",
      });
      return;
    }

    // Create orders for each cart item (since they might be from different sellers)
    cartItems.forEach(item => {
      if (item.product && item.product.userId) {
        createOrderMutation.mutate({
          sellerId: item.product.userId,
          productId: item.productId,
          quantity: item.quantity,
          totalAmount: (parseFloat(item.product.price) * item.quantity).toString(),
          shippingAddress,
        });
      }
    });
  };

  const handleClose = () => {
    setShippingAddress({
      country: "",
      city: "",
      streetAddress: "",
    });
    onClose();
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
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
            >
              <FaTimes />
            </Button>
          </div>
        </DialogHeader>
        
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
              {cartItems.map((item) => (
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
              disabled={createOrderMutation.isPending}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="button-place-order"
            >
              {createOrderMutation.isPending ? "Placing Order..." : "Place Order"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
