import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const CURRENCIES = [
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "NGN", label: "NGN (₦)" },
  { value: "GHS", label: "GHS (₵)" },
  { value: "KES", label: "KES (KSh)" },
  { value: "ZAR", label: "ZAR (R)" },
  { value: "EGP", label: "EGP (£)" },
  { value: "XOF", label: "XOF (CFA)" },
];

interface PostProductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PostProductModal({ isOpen, onClose }: PostProductModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    currency: "KES",
    imageUrl: "",
  });

  const mutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/products", formData);
    },
    onSuccess: async () => {
      toast({ title: "Success", description: "Product posted successfully" });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to post product",
        variant: "destructive",
      });
    },
  });

  const getCurrencySymbol = () => {
    const selected = CURRENCIES.find(c => c.value === formData.currency);
    if (!selected) return "KSh";
    if (selected.label.includes("(")) {
      return selected.label.split("(")[1].replace(")", "");
    }
    return selected.value;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Post a New Product</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              placeholder="Enter product name"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              required
              placeholder="Enter product description"
            />
          </div>

          {/* Price + Currency */}
          <div className="space-y-2">
            <Label htmlFor="price">Price *</Label>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center border rounded-md overflow-hidden">
                <span className="px-3 whitespace-nowrap text-gray-600 bg-gray-100">
                  {getCurrencySymbol()}
                </span>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="0.00"
                  required
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 flex-1"
                />
              </div>

              <div className="w-40">
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(currency => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Image URL */}
          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              value={formData.imageUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <Button type="submit" disabled={mutation.isPending} className="w-full">
            {mutation.isPending ? "Posting..." : "Post Product"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}