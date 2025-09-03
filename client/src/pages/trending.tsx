import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import ProductCard from "@/components/product/ProductCard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FaFire, FaChartLine } from "react-icons/fa";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Trending() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const {
    data: trendingProducts,
    isLoading: productsLoading,
    error: productsError
  } = useQuery({
    queryKey: ["/api/products/trending"],
    retry: false,
  });

  const {
    data: trendingVrooms,
    isLoading: vroomsLoading,
    error: vroomsError
  } = useQuery({
    queryKey: ["/api/vrooms/trending"],
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
    if ((productsError && isUnauthorizedError(productsError as Error)) ||
        (vroomsError && isUnauthorizedError(vroomsError as Error))) {
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
  }, [productsError, vroomsError, toast]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-8 w-32" />
      </div>
    );
  }

  const trendingHashtags = [
    { tag: "#handmade", count: "2.4K products" },
    { tag: "#vintage", count: "1.8K products" },
    { tag: "#furniture", count: "1.2K products" },
    { tag: "#jewelry", count: "956 products" },
    { tag: "#art", count: "743 products" },
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8" data-testid="trending-header">
            <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
              <FaFire className="text-accent" />
              Trending
            </h1>
            <p className="text-muted-foreground">Discover what's popular in the Eldady community</p>
          </div>

          {/* Trending Hashtags */}
          <Card className="mb-8" data-testid="trending-hashtags">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FaChartLine className="text-accent" />
                Trending Hashtags
              </h2>
              <div className="space-y-3">
                {trendingHashtags.map((item, index) => (
                  <div
                    key={item.tag}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                    data-testid={`hashtag-${index}`}
                  >
                    <div>
                      <Badge variant="secondary" className="font-medium text-base">
                        {item.tag}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-1">{item.count}</p>
                    </div>
                    <FaChartLine className="text-accent" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Trending Products */}
          <div className="mb-8" data-testid="trending-products-section">
            <h2 className="text-2xl font-bold mb-6">Trending Products</h2>
            {productsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-80 w-full" />
                ))}
              </div>
            ) : trendingProducts && Array.isArray(trendingProducts) && trendingProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="trending-products-grid">
                {trendingProducts.map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground" data-testid="empty-trending-products">
                <p>No trending products found.</p>
              </div>
            )}
          </div>

          {/* Trending Vrooms */}
          <div data-testid="trending-vrooms-section">
            <h2 className="text-2xl font-bold mb-6">Popular Vrooms</h2>
            {vroomsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-40 w-full" />
                ))}
              </div>
            ) : trendingVrooms && Array.isArray(trendingVrooms) && trendingVrooms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="trending-vrooms-grid">
                {trendingVrooms.map((vroom: any) => (
                  <Card key={vroom.id} className="hover:shadow-lg transition-shadow cursor-pointer" data-testid={`vroom-card-${vroom.id}`}>
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        {vroom.coverImageUrl ? (
                          <img
                            src={vroom.coverImageUrl}
                            alt={vroom.name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                            <span className="text-2xl">🏪</span>
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1" data-testid={`vroom-name-${vroom.id}`}>
                            {vroom.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2" data-testid={`vroom-description-${vroom.id}`}>
                            {vroom.description}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {Math.floor(Math.random() * 200) + 50} products
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground" data-testid="empty-trending-vrooms">
                <p>No trending vrooms found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
