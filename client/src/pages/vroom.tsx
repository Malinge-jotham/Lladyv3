import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import ProductCard from "@/components/product/ProductCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FaUser, FaStore, FaEye } from "react-icons/fa";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Vroom() {
  const { id } = useParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const {
    data: vroom,
    isLoading,
    error
  } = useQuery({
    queryKey: ["/api/vrooms", id],
    enabled: !!id,
    retry: false,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [error, toast]);

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 ml-64 p-6">
          <Skeleton className="h-32 w-full mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-80 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!vroom) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 ml-64 p-6">
          <div className="text-center py-12" data-testid="vroom-not-found">
            <p className="text-muted-foreground">Vroom not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        <div className="max-w-6xl mx-auto p-6">
          {/* Vroom Header */}
          <Card className="mb-6" data-testid="vroom-header">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                {vroom?.coverImageUrl ? (
                  <img
                    src={vroom.coverImageUrl}
                    alt={vroom?.name || 'Vroom'}
                    className="w-20 h-20 rounded-xl object-cover"
                    data-testid="vroom-cover-image"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center">
                    <FaStore className="text-2xl text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <h1 className="text-2xl font-bold mb-2" data-testid="vroom-name">
                    {vroom?.name || 'Unnamed Vroom'}
                  </h1>
                  <p className="text-muted-foreground mb-3" data-testid="vroom-description">
                    {vroom?.description || 'No description'}
                  </p>
                  <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                    <span data-testid="vroom-product-count">
                      {vroom?.products && Array.isArray(vroom.products) ? vroom.products.length : 0} products
                    </span>
                    <span data-testid="vroom-followers">
                      1.2K followers
                    </span>
                    <span data-testid="vroom-views">
                      45.8K views
                    </span>
                  </div>
                </div>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-follow-vroom">
                  <FaUser className="mr-2" />
                  Follow
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="vroom-products-grid">
            {vroom?.products && Array.isArray(vroom.products) && vroom.products.length > 0 ? (
              vroom.products.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-muted-foreground" data-testid="empty-vroom-products">
                <p>No products in this vroom yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
