import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FaSearch, FaChartLine, FaStore } from "react-icons/fa";

export default function RightSidebar() {
  const { data: trendingVrooms, isLoading: vroomsLoading } = useQuery({
    queryKey: ["/api/vrooms/trending"],
    retry: false,
  });

  // Mock trending hashtags for now
  const trendingHashtags = [
    { tag: "#handmade", count: "2.4K products" },
    { tag: "#vintage", count: "1.8K products" },
    { tag: "#furniture", count: "1.2K products" },
  ];

  return (
    <div className="w-80 p-4 space-y-6" data-testid="right-sidebar">
      {/* Search */}
      <div className="bg-muted rounded-full p-3" data-testid="search-container">
        <div className="flex items-center space-x-3">
          <FaSearch className="text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search products and vrooms..."
            className="bg-transparent outline-none border-none focus-visible:ring-0 focus-visible:ring-offset-0"
            data-testid="input-search"
          />
        </div>
      </div>

      {/* Trending Products/Hashtags */}
      <Card data-testid="trending-hashtags-card">
        <div className="p-4 border-b border-border">
          <h3 className="text-lg font-semibold">Trending Products</h3>
        </div>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {trendingHashtags.map((item, index) => (
              <div
                key={item.tag}
                className="p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                data-testid={`trending-hashtag-${index}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.tag}</p>
                    <p className="text-sm text-muted-foreground">{item.count}</p>
                  </div>
                  <FaChartLine className="text-accent" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Popular Vrooms */}
      <Card data-testid="popular-vrooms-card">
        <div className="p-4 border-b border-border">
          <h3 className="text-lg font-semibold">Popular Vrooms</h3>
        </div>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {vroomsLoading ? (
              <div className="space-y-4 p-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                    <Skeleton className="h-6 w-12" />
                  </div>
                ))}
              </div>
            ) : trendingVrooms && Array.isArray(trendingVrooms) && trendingVrooms.length > 0 ? (
              trendingVrooms.slice(0, 3).map((vroom: any, index: number) => (
                <div
                  key={vroom.id}
                  className="p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                  data-testid={`popular-vroom-${index}`}
                >
                  <div className="flex items-center space-x-3">
                    {vroom.coverImageUrl ? (
                      <img
                        src={vroom.coverImageUrl}
                        alt={vroom.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <FaStore className="text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium" data-testid={`vroom-name-${index}`}>
                        {vroom.name}
                      </p>
                      <p className="text-sm text-muted-foreground" data-testid={`vroom-product-count-${index}`}>
                        {Math.floor(Math.random() * 200) + 50} products
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-primary hover:text-primary/80"
                      data-testid={`button-follow-vroom-${index}`}
                    >
                      Follow
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-muted-foreground" data-testid="empty-popular-vrooms">
                <p>No popular vrooms found.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
