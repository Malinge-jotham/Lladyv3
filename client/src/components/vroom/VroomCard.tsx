import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FaStore, FaEye, FaHeart, FaUser, FaShoppingBag, FaLock } from "react-icons/fa";
import { Link } from "wouter";
import { useState } from "react";

interface VroomCardProps {
  vroom: {
    id: string;
    name: string;
    description?: string;
    coverImageUrl?: string;
    isPublic: boolean;
    userId: string;
    user?: {
      firstName?: string;
      lastName?: string;
      profileImageUrl?: string;
    };
    _count?: {
      products: number;
      followers: number;
      views: number;
    };
    stats?: {
      products: number;
      followers: number;
      views: number;
    };
    products?: any[];
  };
  showFollowButton?: boolean;
  initialIsFollowing?: boolean;
}

export default function VroomCard({ 
  vroom, 
  showFollowButton = false, 
  initialIsFollowing = false 
}: VroomCardProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);

  const handleFollowClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const prevState = isFollowing;
    setIsFollowing(!isFollowing); // optimistic update

    try {
      const res = await fetch(`/api/vrooms/${vroom.id}/follow`, {
        method: isFollowing ? "DELETE" : "POST",
      });
      if (!res.ok) throw new Error("Failed to toggle follow");
    } catch (err) {
      console.error(err);
      // revert UI if request fails
      setIsFollowing(prevState);
    }
  };

  const getProductCount = () => {
    if (vroom.products && Array.isArray(vroom.products)) return vroom.products.length;
    if (vroom._count?.products !== undefined) return vroom._count.products;
    if (vroom.stats?.products !== undefined) return vroom.stats.products;
    return 0;
  };

  const productCount = getProductCount();
  const followers = vroom._count?.followers || vroom.stats?.followers || 0;
  const views = vroom._count?.views || vroom.stats?.views || 0;

  return (
    <Link href={`/vroom/${vroom.id}`}>
      <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group border-0 overflow-hidden">
        <CardContent className="p-0 h-full flex flex-col">
          {/* Cover Image */}
          <div className="relative h-48 overflow-hidden">
            {vroom.coverImageUrl ? (
              <img
                src={vroom.coverImageUrl}
                alt={vroom.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <FaStore className="text-4xl text-muted-foreground/50" />
              </div>
            )}
            <div className="absolute top-3 right-3">
              <Badge variant={vroom.isPublic ? "default" : "secondary"} className="flex items-center gap-1">
                {vroom.isPublic ? (
                  <>
                    <FaEye className="text-xs" />
                    Public
                  </>
                ) : (
                  <>
                    <FaLock className="text-xs" />
                    Private
                  </>
                )}
              </Badge>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>

          {/* Content */}
          <div className="p-4 flex-grow flex flex-col">
            <h3 className="font-semibold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
              {vroom.name}
            </h3>

            {vroom.description && (
              <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                {vroom.description}
              </p>
            )}

            {/* Owner Info */}
            {vroom.user && (
              <div className="flex items-center gap-2 mb-3">
                {vroom.user.profileImageUrl ? (
                  <img
                    src={vroom.user.profileImageUrl}
                    alt="Owner"
                    className="w-6 h-6 rounded-full object-cover border"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                    <FaUser className="text-xs" />
                  </div>
                )}
                <span className="text-sm text-muted-foreground">
                  {vroom.user.firstName} {vroom.user.lastName}
                </span>
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center justify-between text-sm text-muted-foreground mt-auto">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1" title="Products">
                  <FaShoppingBag className="text-xs" />
                  {productCount}
                </span>
                <span className="flex items-center gap-1" title="Followers">
                  <FaHeart className="text-xs" />
                  {followers}
                </span>
                <span className="flex items-center gap-1" title="Views">
                  <FaEye className="text-xs" />
                  {views}
                </span>
              </div>

              {showFollowButton && (
                <Button
                  variant={isFollowing ? "outline" : "default"}
                  size="sm"
                  className="text-xs h-7 px-3"
                  onClick={handleFollowClick}
                >
                  {isFollowing ? "Following" : "Follow"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
