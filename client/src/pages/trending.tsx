import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/Sidebar";
import ProductCard from "@/components/product/ProductCard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FaFire, FaChartLine, FaHashtag, FaExclamationTriangle, FaSync } from "react-icons/fa";

// Define TypeScript interfaces
interface Product {
  id: string;
  title: string;
  description: string;
  image: string;
  price: number;
  likes: number;
  views: number;
  createdAt: string;
}

interface Vroom {
  id: string;
  name: string;
  description: string;
  coverImageUrl?: string;
  productCount: number;
}

interface Hashtag {
  tag: string;
  count: string;
}

export default function Trending() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [activeTab, setActiveTab] = useState("products");

  // Trending products query
  const {
    data: trendingProducts,
    isLoading: productsLoading,
    error: productsError,
    refetch: refetchProducts
  } = useQuery<Product[]>({
    queryKey: ["/api/products/trending"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Trending vrooms query
  const {
    data: trendingVrooms,
    isLoading: vroomsLoading,
    error: vroomsError,
    refetch: refetchVrooms
  } = useQuery<Vroom[]>({
    queryKey: ["/api/vrooms/trending"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Trending hashtags query (could be API-based in the future)
  const trendingHashtags: Hashtag[] = [
    { tag: "#handmade", count: "2.4K products" },
    { tag: "#vintage", count: "1.8K products" },
    { tag: "#furniture", count: "1.2K products" },
    { tag: "#jewelry", count: "956 products" },
    { tag: "#art", count: "743 products" },
  ];

  // Authentication effect
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "You need to log in to view trending content",
        variant: "destructive",
      });
      setShouldRedirect(true);
    }
  }, [isAuthenticated, authLoading, toast]);

  // Redirect effect
  useEffect(() => {
    if (shouldRedirect) {
      const timer = setTimeout(() => {
        window.location.href = "/api/login";
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [shouldRedirect]);

  // Error handling effect
  useEffect(() => {
    const errors = [productsError, vroomsError];

    for (const error of errors) {
      if (error && isUnauthorizedError(error as Error)) {
        toast({
          title: "Session expired",
          description: "Please log in again",
          variant: "destructive",
        });
        setShouldRedirect(true);
        return;
      }
    }

    // Handle other errors
    if (productsError && !isUnauthorizedError(productsError as Error)) {
      toast({
        title: "Error loading trending products",
        description: "Please try again later",
        variant: "destructive",
      });
    }

    if (vroomsError && !isUnauthorizedError(vroomsError as Error)) {
      toast({
        title: "Error loading trending vrooms",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  }, [productsError, vroomsError, toast]);

  const handleRetry = useCallback(() => {
    if (productsError) refetchProducts();
    if (vroomsError) refetchVrooms();
  }, [productsError, vroomsError, refetchProducts, refetchVrooms]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <Skeleton className="h-6 w-48 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || shouldRedirect) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Redirecting to login...</h2>
          <p>Please wait while we redirect you to the login page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 ml-64">
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8" data-testid="trending-header">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
                  <FaFire className="text-accent" />
                  Trending
                </h1>
                <p className="text-muted-foreground">Discover what's popular in the Eldady community</p>
              </div>

              {(productsError || vroomsError) && (
                <Button 
                  variant="outline" 
                  onClick={handleRetry}
                  className="flex items-center gap-2"
                >
                  <FaSync className="text-muted-foreground" />
                  Retry
                </Button>
              )}
            </div>
          </div>

          {/* Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="grid grid-cols-3 w-full max-w-md mb-6">
              <TabsTrigger value="products" className="flex items-center gap-2">
                <FaFire />
                Products
              </TabsTrigger>
              <TabsTrigger value="vrooms" className="flex items-center gap-2">
                <FaChartLine />
                Vrooms
              </TabsTrigger>
              <TabsTrigger value="hashtags" className="flex items-center gap-2">
                <FaHashtag />
                Hashtags
              </TabsTrigger>
            </TabsList>

            {/* Products Tab */}
            <TabsContent value="products" data-testid="trending-products-section">
              <h2 className="text-2xl font-bold mb-6">Trending Products</h2>
              {productsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-80 w-full rounded-lg" />
                  ))}
                </div>
              ) : productsError ? (
                <div className="text-center py-12" data-testid="products-error">
                  <FaExclamationTriangle className="mx-auto text-4xl text-destructive mb-4" />
                  <p className="text-destructive mb-2">Failed to load trending products</p>
                  <Button onClick={() => refetchProducts()} className="mt-4">
                    Try Again
                  </Button>
                </div>
              ) : trendingProducts && trendingProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="trending-products-grid">
                  {trendingProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground" data-testid="empty-trending-products">
                  <FaFire className="mx-auto text-4xl mb-4 opacity-50" />
                  <p>No trending products found.</p>
                  <p className="text-sm">Check back later for trending content</p>
                </div>
              )}
            </TabsContent>

            {/* Vrooms Tab */}
            <TabsContent value="vrooms" data-testid="trending-vrooms-section">
              <h2 className="text-2xl font-bold mb-6">Popular Vrooms</h2>
              {vroomsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-40 w-full rounded-lg" />
                  ))}
                </div>
              ) : vroomsError ? (
                <div className="text-center py-12" data-testid="vrooms-error">
                  <FaExclamationTriangle className="mx-auto text-4xl text-destructive mb-4" />
                  <p className="text-destructive mb-2">Failed to load trending vrooms</p>
                  <Button onClick={() => refetchVrooms()} className="mt-4">
                    Try Again
                  </Button>
                </div>
              ) : trendingVrooms && trendingVrooms.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="trending-vrooms-grid">
                  {trendingVrooms.map((vroom) => (
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
                              {vroom.productCount} products
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground" data-testid="empty-trending-vrooms">
                  <FaChartLine className="mx-auto text-4xl mb-4 opacity-50" />
                  <p>No trending vrooms found.</p>
                  <p className="text-sm">Check back later for trending content</p>
                </div>
              )}
            </TabsContent>

            {/* Hashtags Tab */}
            <TabsContent value="hashtags" data-testid="trending-hashtags">
              <h2 className="text-2xl font-bold mb-6">Trending Hashtags</h2>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <FaChartLine className="text-accent" />
                    <h3 className="text-xl font-semibold">Trending Hashtags</h3>
                  </div>
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
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}