import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import RightSidebar from "@/components/layout/RightSidebar";
import ProductPost from "@/components/product/ProductPost";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Home() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const {
    data: products,
    isLoading: productsLoading,
    error
  } = useQuery({
    queryKey: ["/api/products"],
    retry: false,
  });

  useEffect(() => {
    if (authLoading) return;

    // Handle both auth error and API error cases
    if (!isAuthenticated || (error && isUnauthorizedError(error as Error))) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });

      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading, error, toast]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="h-8 w-32 mx-auto mb-4" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 ml-64">
        <div className="flex">
          {/* Center Feed */}
          <div className="flex-1 max-w-2xl mx-auto border-x border-border min-h-screen">
            {/* Header */}
            <div className="sticky top-0 bg-card/80 backdrop-blur-sm border-b border-border p-4" data-testid="feed-header">
              <h2 className="text-xl font-bold">Home</h2>
            </div>

            {/* Product Posts Feed */}
            <div className="divide-y divide-border" data-testid="product-feed">
              {productsLoading ? (
                <div className="space-y-6 p-6">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="p-6">
                      <CardContent className="space-y-4">
                        <div className="flex space-x-3">
                          <Skeleton className="w-10 h-10 rounded-full" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                          </div>
                        </div>
                        <Skeleton className="h-48 w-full rounded-xl" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : products && Array.isArray(products) && products.length > 0 ? (
                products.map((product: any) => (
                  <ProductPost key={product.id} product={product} />
                ))
              ) : (
                <div className="p-12 text-center text-muted-foreground" data-testid="empty-feed">
                  <p>No products found. Start following users or explore trending products!</p>
                </div>
              )}
            </div>
          </div>

          <RightSidebar />
        </div>
      </div>
    </div>
  );
}