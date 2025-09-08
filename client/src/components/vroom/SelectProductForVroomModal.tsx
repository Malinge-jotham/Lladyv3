import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { FaStore, FaPlus, FaCheck } from "react-icons/fa";

interface SelectProductForVroomModalProps {
  isOpen: boolean;
  onClose: () => void;
  vroomId: string;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  price: string;
  imageUrls: string[];
  userId: string;
  createdAt: string;
}

export default function SelectProductForVroomModal({ 
  isOpen, 
  onClose, 
  vroomId 
}: SelectProductForVroomModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  // Fetch user's products
  const { data: userProducts, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products/user"],
    enabled: isOpen && !!user,
    retry: false,
  });

  // Fetch products already in this vroom
  const { data: vroomProducts } = useQuery({
    queryKey: ["/api/vrooms", vroomId],
    enabled: isOpen && !!vroomId,
    retry: false,
  });

  const addProductsToVroomMutation = useMutation({
    mutationFn: async (productIds: string[]) => {
      const promises = productIds.map(productId => 
        apiRequest("POST", `/api/vrooms/${vroomId}/products`, { productId })
      );
      return await Promise.all(promises);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `${selectedProducts.length} product${selectedProducts.length > 1 ? 's' : ''} added to vroom successfully!`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vrooms", vroomId] });
      queryClient.invalidateQueries({ queryKey: ["/api/vrooms/user"] });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to add products to vroom",
        variant: "destructive",
      });
    },
  });

  const handleProductToggle = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleAddProducts = () => {
    if (selectedProducts.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one product",
        variant: "destructive",
      });
      return;
    }
    addProductsToVroomMutation.mutate(selectedProducts);
  };

  const handleClose = () => {
    setSelectedProducts([]);
    onClose();
  };

  if (!isOpen) return null;

  // Get products already in vroom
  const productsInVroom = (vroomProducts as any)?.products?.map((p: any) => p.id) || [];
  
  // Filter out products already in vroom
  const availableProducts = userProducts?.filter(product => !productsInVroom.includes(product.id)) || [];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" data-testid="select-product-modal">
        <DialogHeader>
          <DialogTitle data-testid="select-product-title">Add Products to Vroom</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-32 w-full mb-3" />
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : availableProducts.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FaStore className="mx-auto text-6xl text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No products available</h3>
                <p className="text-muted-foreground">
                  {userProducts?.length === 0 
                    ? "You haven't created any products yet. Create your first product to add it to this vroom."
                    : "All your products are already in this vroom."
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableProducts.map((product) => (
                  <Card 
                    key={product.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedProducts.includes(product.id) 
                        ? "ring-2 ring-primary bg-primary/5" 
                        : ""
                    }`}
                    onClick={() => handleProductToggle(product.id)}
                    data-testid={`product-card-${product.id}`}
                  >
                    <CardContent className="p-0">
                      {/* Product Image */}
                      <div className="relative h-32 overflow-hidden rounded-t-lg">
                        {product.imageUrls && product.imageUrls.length > 0 ? (
                          <img
                            src={product.imageUrls[0]}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                            <FaStore className="text-2xl text-muted-foreground" />
                          </div>
                        )}
                        
                        {/* Selection indicator */}
                        {selectedProducts.includes(product.id) && (
                          <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-2">
                            <FaCheck className="text-xs" />
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="p-3">
                        <h4 className="font-medium text-sm line-clamp-1 mb-1" data-testid="product-name">
                          {product.name}
                        </h4>
                        
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs">
                            ${parseFloat(product.price).toFixed(2)}
                          </Badge>
                        </div>

                        {product.description && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                            {product.description}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex justify-between pt-4 border-t">
                <Button variant="outline" onClick={handleClose} data-testid="button-cancel">
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddProducts}
                  disabled={selectedProducts.length === 0 || addProductsToVroomMutation.isPending}
                  data-testid="button-add-products"
                >
                  {addProductsToVroomMutation.isPending ? (
                    "Adding..."
                  ) : (
                    <>
                      <FaPlus className="mr-2" />
                      Add {selectedProducts.length > 0 ? `${selectedProducts.length} ` : ""}Products
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}