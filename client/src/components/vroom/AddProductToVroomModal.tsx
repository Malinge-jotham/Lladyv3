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
import { FaStore, FaPlus, FaCheck } from "react-icons/fa";

interface AddProductToVroomModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
}

export default function AddProductToVroomModal({ 
  isOpen, 
  onClose, 
  productId, 
  productName 
}: AddProductToVroomModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedVrooms, setSelectedVrooms] = useState<string[]>([]);

  // Fetch user's vrooms
  const { data: userVrooms, isLoading } = useQuery({
    queryKey: ["/api/vrooms/user"],
    enabled: isOpen && !!user,
    retry: false,
  });

  // Fetch current product's vrooms
  const { data: productVrooms } = useQuery({
    queryKey: ["/api/products", productId, "vrooms"],
    enabled: isOpen && !!productId,
    retry: false,
  });

  const addToVroomMutation = useMutation({
    mutationFn: async ({ vroomId, productId }: { vroomId: string; productId: string }) => {
      return await apiRequest("POST", `/api/vrooms/${vroomId}/products`, { productId });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product added to vroom successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vrooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products", productId, "vrooms"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to add product to vroom",
        variant: "destructive",
      });
    },
  });

  const removeFromVroomMutation = useMutation({
    mutationFn: async ({ vroomId, productId }: { vroomId: string; productId: string }) => {
      return await apiRequest("DELETE", `/api/vrooms/${vroomId}/products/${productId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product removed from vroom successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vrooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products", productId, "vrooms"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to remove product from vroom",
        variant: "destructive",
      });
    },
  });

  const handleVroomToggle = (vroomId: string) => {
    const currentProductVrooms = Array.isArray(productVrooms) ? productVrooms.map((v: any) => v.id) : [];
    const isCurrentlyInVroom = currentProductVrooms.includes(vroomId);

    if (isCurrentlyInVroom) {
      removeFromVroomMutation.mutate({ vroomId, productId });
    } else {
      addToVroomMutation.mutate({ vroomId, productId });
    }
  };

  const isProductInVroom = (vroomId: string) => {
    if (!Array.isArray(productVrooms)) return false;
    return productVrooms.some((v: any) => v.id === vroomId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto" data-testid="add-product-to-vroom-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FaStore className="text-primary" />
            Add "{productName}" to Vroom
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : userVrooms && Array.isArray(userVrooms) && userVrooms.length > 0 ? (
            <div className="space-y-3">
              {userVrooms.map((vroom: any) => {
                const isInVroom = isProductInVroom(vroom.id);
                const isProcessing = addToVroomMutation.isPending || removeFromVroomMutation.isPending;
                
                return (
                  <Card
                    key={vroom.id}
                    className={`cursor-pointer transition-all ${
                      isInVroom ? 'ring-2 ring-primary' : 'hover:shadow-md'
                    }`}
                    onClick={() => !isProcessing && handleVroomToggle(vroom.id)}
                    data-testid={`vroom-option-${vroom.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        {vroom.coverImageUrl ? (
                          <img
                            src={vroom.coverImageUrl}
                            alt={vroom.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                            <FaStore className="text-muted-foreground" />
                          </div>
                        )}
                        
                        <div className="flex-1">
                          <h4 className="font-medium">{vroom.name}</h4>
                          {vroom.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {vroom.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center">
                          {isInVroom ? (
                            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                              <FaCheck className="text-primary-foreground text-xs" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/30" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FaStore className="mx-auto text-4xl mb-4 opacity-50" />
              <p>You don't have any vrooms yet.</p>
              <p className="text-sm">Create a vroom first to organize your products!</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
              data-testid="button-close-add-to-vroom"
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}