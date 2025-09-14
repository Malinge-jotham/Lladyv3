import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/Sidebar";
import RightSidebar from "@/components/layout/RightSidebar";
import ProductCard from "@/components/product/ProductCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FaSearch, 
  FaCompass, 
  FaFire, 
  FaHashtag, 
  FaStore, 
  FaUser, 
  FaShoppingBag,
  FaHeart,
  FaStar,
  FaFilter,
  FaChevronUp,
  FaSort,
  FaList
} from "react-icons/fa";

type SearchType = 'all' | 'products' | 'users' | 'vrooms';
type SortBy = 'recent' | 'popular' | 'price_low' | 'price_high' | 'likes' | 'views';

const categories = [
  { id: 'all', name: 'All Categories', icon: FaCompass },
  { id: 'handmade', name: 'Handmade', icon: FaHeart },
  { id: 'vintage', name: 'Vintage', icon: FaStar },
  { id: 'furniture', name: 'Furniture', icon: FaStore },
  { id: 'jewelry', name: 'Jewelry', icon: FaShoppingBag },
  { id: 'art', name: 'Art & Crafts', icon: FaHeart },
  { id: 'clothing', name: 'Clothing', icon: FaUser },
];

const trendingHashtags = [
  { tag: "#handmade", count: "2.4K" },
  { tag: "#vintage", count: "1.8K" },
  { tag: "#furniture", count: "1.2K" },
  { tag: "#jewelry", count: "956" },
  { tag: "#art", count: "743" },
  { tag: "#clothing", count: "634" },
  { tag: "#decor", count: "521" },
  { tag: "#accessories", count: "409" },
];

export default function Explore() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<SearchType>('all');
  const [sortBy, setSortBy] = useState<SortBy>('recent');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeSearchQuery, setActiveSearchQuery] = useState("");
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  // Calculate header height once it's rendered
  useEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.offsetHeight);
    }
  }, []);

  // Scroll handling for header visibility
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down
        setIsHeaderVisible(false);
      } else if (currentScrollY < lastScrollY || currentScrollY <= 100) {
        // Scrolling up or at top
        setIsHeaderVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Auth effect
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

  // Search products
  const { 
    data: searchResults, 
    isLoading: searchLoading,
    error: searchError 
  } = useQuery({
    queryKey: ["/api/products/search", activeSearchQuery],
    enabled: !!activeSearchQuery,
    retry: false,
  });

  // Featured products
  const { 
    data: featuredProducts, 
    isLoading: featuredLoading,
    error: featuredError 
  } = useQuery({
    queryKey: ["/api/products"],
    retry: false,
  });

  // Trending products
  const { 
    data: trendingProducts, 
    isLoading: trendingLoading,
    error: trendingError 
  } = useQuery({
    queryKey: ["/api/products/trending"],
    retry: false,
  });

  // Error handling
  useEffect(() => {
    const errors = [searchError, featuredError, trendingError].filter(Boolean);
    for (const error of errors) {
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
    }
  }, [searchError, featuredError, trendingError, toast]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setActiveSearchQuery(searchQuery.trim());
    } else {
      setActiveSearchQuery("");
    }
  };

  const handleHashtagClick = (hashtag: string) => {
    setSearchQuery(hashtag);
    setActiveSearchQuery(hashtag);
  };

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
    if (categoryId !== 'all') {
      setSearchQuery(`#${categoryId}`);
      setActiveSearchQuery(`#${categoryId}`);
    } else {
      setSearchQuery("");
      setActiveSearchQuery("");
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-8 w-32" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      {/* Main Content - Adjusted to use full available width */}
      <div className="flex-1 ml-16 lg:ml-64 mr-16 lg:mr-80"> {/* Responsive margins */}
        <div className="flex">
          {/* Center Content - Now uses full width between sidebars */}
          <div className="flex-1 w-full border-x border-border min-h-screen">
            {/* Header with scroll behavior */}
            <div 
              ref={headerRef}
              className={`sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border p-4 transition-transform duration-300 z-10 ${
                isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
              }`}
              data-testid="explore-header"
            >
              <div className="flex items-center gap-3 mb-4">
                <FaCompass className="text-primary text-xl" />
                <h2 className="text-xl font-bold">Explore</h2>
              </div>

              {/* Search Bar */}
              <div className="flex gap-2 mb-4">
                <div className="flex-1 relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search products, users, vrooms..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10"
                    data-testid="search-input"
                  />
                </div>
                <Button onClick={handleSearch} data-testid="search-button">
                  <FaSearch />
                </Button>
              </div>

              {/* Search Filters - Icons only */}
              <div className="flex gap-2 flex-wrap">
                <Select value={searchType} onValueChange={(value: SearchType) => setSearchType(value)}>
                  <SelectTrigger className="w-12 md:w-32">
                    <div className="hidden md:block">
                      <SelectValue />
                    </div>
                    <div className="md:hidden">
                      <FaList className="w-4 h-4" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="products">Products</SelectItem>
                    <SelectItem value="users">Users</SelectItem>
                    <SelectItem value="vrooms">Vrooms</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(value: SortBy) => setSortBy(value)}>
                  <SelectTrigger className="w-12 md:w-36">
                    <div className="hidden md:block">
                      <SelectValue />
                    </div>
                    <div className="md:hidden">
                      <FaSort className="w-4 h-4" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="likes">Most Liked</SelectItem>
                    <SelectItem value="views">Most Viewed</SelectItem>
                    <SelectItem value="price_low">Price: Low to High</SelectItem>
                    <SelectItem value="price_high">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Categories */}
            <div className="p-4 border-b border-border">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <FaFilter className="text-primary" />
                <span className="hidden sm:inline">Categories</span>
              </h3>
              <div className="flex gap-2 flex-wrap">
                {categories.map((category) => {
                  const Icon = category.icon;
                  const isSelected = selectedCategory === category.id;

                  return (
                    <Button
                      key={category.id}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleCategoryClick(category.id)}
                      className="flex items-center gap-2"
                      data-testid={`category-${category.id}`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{category.name}</span>
                      <span className="sm:hidden">{category.name.split(' ')[0]}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Content Tabs */}
            <Tabs defaultValue="discover" className="flex-1">
              <TabsList className="w-full justify-start border-b border-border rounded-none h-12 bg-transparent p-0 sticky top-0 z-10 bg-background" style={{ top: isHeaderVisible ? `${headerHeight}px` : '0' }}>
                <TabsTrigger 
                  value="discover" 
                  className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary bg-transparent px-3 sm:px-6"
                >
                  <FaCompass />
                  <span className="hidden sm:inline">Discover</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="trending" 
                  className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary bg-transparent px-3 sm:px-6"
                >
                  <FaFire />
                  <span className="hidden sm:inline">Trending</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="hashtags" 
                  className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary bg-transparent px-3 sm:px-6"
                >
                  <FaHashtag />
                  <span className="hidden sm:inline">Hashtags</span>
                </TabsTrigger>
              </TabsList>

              {/* Discover Tab */}
              <TabsContent value="discover" className="p-4">
                {activeSearchQuery ? (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      Search results for "{activeSearchQuery}"
                    </h3>
                    {searchLoading ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                          <Skeleton key={i} className="h-96 w-full" />
                        ))}
                      </div>
                    ) : searchResults && Array.isArray(searchResults) && searchResults.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="search-results">
                        {searchResults.map((product: any) => (
                          <ProductCard key={product.id} product={product} className="h-96" />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <FaSearch className="mx-auto text-4xl mb-4 opacity-50" />
                        <p>No results found for "{activeSearchQuery}"</p>
                        <p className="text-sm">Try different keywords or browse categories</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Featured Products</h3>
                    {featuredLoading ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                          <Skeleton key={i} className="h-96 w-full" />
                        ))}
                      </div>
                    ) : featuredProducts && Array.isArray(featuredProducts) && featuredProducts.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="featured-products">
                        {featuredProducts.slice(0, 15).map((product: any) => (
                          <ProductCard key={product.id} product={product} className="h-96" />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <FaCompass className="mx-auto text-4xl mb-4 opacity-50" />
                        <p>No products available</p>
                        <p className="text-sm">Check back later for new products</p>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* Trending Tab */}
              <TabsContent value="trending" className="p-4">
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FaFire className="text-accent" />
                    Trending Products
                  </h3>
                  {trendingLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-96 w-full" />
                      ))}
                    </div>
                  ) : trendingProducts && Array.isArray(trendingProducts) && trendingProducts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="trending-products">
                      {trendingProducts.map((product: any) => (
                        <ProductCard key={product.id} product={product} className="h-96" />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <FaFire className="mx-auto text-4xl mb-4 opacity-50" />
                      <p>No trending products yet</p>
                      <p className="text-sm">Check back later for trending content</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Hashtags Tab */}
              <TabsContent value="hashtags" className="p-4">
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FaHashtag className="text-primary" />
                    Trending Hashtags
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="trending-hashtags">
                    {trendingHashtags.map((hashtag, index) => (
                      <Card 
                        key={hashtag.tag}
                        className="hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => handleHashtagClick(hashtag.tag)}
                        data-testid={`hashtag-${hashtag.tag.slice(1)}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <FaHashtag className="text-primary" />
                              </div>
                              <div>
                                <p className="font-semibold text-primary">{hashtag.tag}</p>
                                <p className="text-sm text-muted-foreground">{hashtag.count} products</p>
                              </div>
                            </div>
                            <Badge variant="secondary">#{index + 1}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <RightSidebar />

      {/* Scroll to top button */}
      {!isHeaderVisible && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 rounded-full w-12 h-12 p-0 z-50"
          size="icon"
        >
          <FaChevronUp />
        </Button>
      )}
    </div>
  );
}