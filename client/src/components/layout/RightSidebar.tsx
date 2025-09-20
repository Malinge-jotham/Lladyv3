import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FaSearch, FaChartLine, FaStore } from "react-icons/fa";
import { useState } from "react";
import { Link } from "wouter";

export default function RightSidebar() {
  const { data: trendingVrooms, isLoading: vroomsLoading } = useQuery({
    queryKey: ["/api/vrooms/trending"],
    queryFn: async () => {
      const res = await fetch("/api/vrooms/trending");
      return res.json();
    },
    retry: false,
  });

  const { data: trendingHashtags, isLoading: hashtagsLoading } = useQuery({
    queryKey: ["/api/hashtags/trending"],
    queryFn: async () => {
      const res = await fetch("/api/hashtags/trending");
      return res.json();
    },
    retry: false,
  });

  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({});

  // Helper to format numbers like 1.2K
  const formatCount = (count: number): string => {
    if (!count) return "0";
    if (count < 1000) return count.toString();
    return (count / 1000).toFixed(1) + "K";
  };

  const handleFollowToggle = async (vroomId: string) => {
    const isCurrentlyFollowing = followingStates[vroomId] || false;

    // Optimistic UI update
    setFollowingStates(prev => ({ ...prev, [vroomId]: !isCurrentlyFollowing }));

    try {
      const res = await fetch(`/api/vrooms/${vroomId}/follow`, {
        method: isCurrentlyFollowing ? "DELETE" : "POST",
      });
      if (!res.ok) throw new Error("Failed to toggle follow");
    } catch (err) {
      console.error(err);
      // Revert on error
      setFollowingStates(prev => ({ ...prev, [vroomId]: isCurrentlyFollowing }));
    }
  };

  return (
    <div className="fixed right-0 top-0 h-screen w-80 bg-white p-4 flex flex-col">
      <div className="flex-1 overflow-y-auto">
        {/* Search */}
        <div className="bg-muted rounded-full p-3 mb-6">
          <div className="flex items-center space-x-3">
            <FaSearch className="text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search products and vrooms..."
              className="bg-transparent outline-none border-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </div>

        {/* Trending Hashtags */}
        <Card className="mb-6">
          <div className="p-4 border-b border-border">
            <h3 className="text-lg font-semibold">Trending Hashtags</h3>
          </div>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {hashtagsLoading ? (
                <div className="space-y-4 p-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-6 w-full rounded" />
                  ))}
                </div>
              ) : trendingHashtags && trendingHashtags.length > 0 ? (
                trendingHashtags.map((item: any) => (
                  <Link
                    key={item.tag}
                    href={`/hashtags/${encodeURIComponent(item.tag)}`}
                  >
                    <div className="p-4 hover:bg-muted/30 transition-colors cursor-pointer flex justify-between items-center">
                      <div>
                        <p className="font-medium">{item.tag}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.count} products
                        </p>
                      </div>
                      <FaChartLine className="text-accent" />
                    </div>
                  </Link>
                ))
              ) : (
                <p className="p-4 text-center text-muted-foreground">
                  No trending hashtags found.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Popular Vrooms */}
        <Card className="mb-6">
          <div className="p-4 border-b border-border">
            <h3 className="text-lg font-semibold">Popular Vrooms</h3>
          </div>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {vroomsLoading ? (
                <div className="space-y-4 p-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded" />
                  ))}
                </div>
              ) : trendingVrooms && trendingVrooms.length > 0 ? (
                trendingVrooms.slice(0, 3).map((vroom: any) => {
                  const isFollowing = followingStates[vroom.id] || false;
                  return (
                    <Link key={vroom.id} href={`/vrooms/${vroom.id}`}>
                      <div className="p-4 hover:bg-muted/30 transition-colors cursor-pointer flex items-center justify-between">
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
                            <p className="font-medium">{vroom.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatCount(vroom.productsCount || 0)} products •{" "}
                              {formatCount(vroom.followersCount || 0)} followers
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={isFollowing ? "outline" : "default"}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleFollowToggle(vroom.id);
                          }}
                        >
                          {isFollowing ? "Following" : "Follow"}
                        </Button>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <p className="p-4 text-center text-muted-foreground">
                  No popular vrooms found.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="py-4 border-t border-border mt-auto text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Eldady . All Rights Reserved.
      </div>
    </div>
  );
}
