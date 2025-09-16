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
import VroomCard from "@/components/vroom/VroomCard";

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
  _count?: { followers: number; products: number; views: number };
  stats?: { followers: number; products: number; views: number };
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

  // Follow state for trending vrooms
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({});

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

  const trendingHashtags: Hashtag[] = [
    { tag: "#handmade", count: "2.4K products" },
    { tag: "#vintage", count: "1.8K products" },
    { tag: "#furniture", count: "1.2K products" },
    { tag: "#jewelry", count: "956 products" },
    { tag: "#art", count: "743 products" },
  ];

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

  useEffect(() => {
    if (shouldRedirect) {
      const timer = setTimeout(() => {
        window.location.href = "/api/login";
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [shouldRedirect]);

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

  // Format numbers like 1.2K
  const formatCount = (count: number): string => {
    if (!count) return "0";
    if (count < 1000) return count.toString();
    return (count / 1000).toFixed(1) + "K";
  };

  const handleFollowToggle = async (vroomId: string, currentlyFollowing: boolean) => {
    setFollowingStates(prev => ({ ...prev, [vroomId]: !currentlyFollowing }));

    try {
      const res = await fetch(`/api/vrooms/${vroomId}/follow`, {
        method: currentlyFollowing ? "DELETE" : "POST",
      });
      if (!res.ok) throw new Error("Failed to toggle follow");
    } catch (err) {
      console.error(err);
      setFollowingStates(prev => ({ ...prev, [vroomId]: currentlyFollowing }));
    }
  };

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
                <Button variant="outline" onClick={handleRetry} className="flex items-center gap-2">
                  <FaSync className="text-muted-foreground" />
                  Retry
                </Button>
              )}
            </div>
          </div>

          {/* Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="grid grid-cols-3 w-full max-w-md mb-6">
              <TabsTrigger value="products" className="flex items-center gap-2"><FaFire /> Products</TabsTrigger>
              <TabsTrigger value="vrooms" className="flex items-center gap-2"><FaChartLine /> Vrooms</TabsTrigger>
              <TabsTrigger value="hashtags" className="flex items-center gap-2"><FaHashtag /> Hashtags</TabsTrigger>
            </TabsList>

            {/* Products Tab */}
            <TabsContent value="products" data-testid="trending-products-section">
              {productsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-80 w-full rounded-lg" />)}
                </div>
              ) : trendingProducts && trendingProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {trendingProducts.map((product) => <ProductCard key={product.id} product={product} />)}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FaFire className="mx-auto text-4xl mb-4 opacity-50" />
                  <p>No trending products found.</p>
                </div>
              )}
            </TabsContent>

            {/* Vrooms Tab */}
            <TabsContent value="vrooms" data-testid="trending-vrooms-section">
              {vroomsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-lg" />)}
                </div>
              ) : trendingVrooms && trendingVrooms.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {trendingVrooms.map((vroom) => (
                    <VroomCard
                      key={vroom.id}
                      vroom={{
                        ...vroom,
                        stats: {
                          ...vroom.stats,
                          followers: vroom._count?.followers || vroom.stats?.followers || 0
                        }
                      }}
                      showFollowButton
                      isFollowing={followingStates[vroom.id] || false}
                      onFollowToggle={handleFollowToggle}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FaChartLine className="mx-auto text-4xl mb-4 opacity-50" />
                  <p>No trending vrooms found.</p>
                </div>
              )}
            </TabsContent>

            {/* Hashtags Tab */}
            <TabsContent value="hashtags" data-testid="trending-hashtags">
              <div className="space-y-3">
                {trendingHashtags.map((item, idx) => (
                  <Badge key={idx} variant="secondary">{item.tag} ({item.count})</Badge>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
