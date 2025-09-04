import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FaStore, FaEye, FaHeart, FaUser } from "react-icons/fa";
import { Link } from "wouter";

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
    stats?: {
      products: number;
      followers: number;
      views: number;
    };
  };
}

export default function VroomCard({ vroom }: VroomCardProps) {
  return (
    <Link href={`/vroom/${vroom.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer group" data-testid={`vroom-card-${vroom.id}`}>
        <CardContent className="p-0">
          {/* Cover Image */}
          <div className="relative h-48 overflow-hidden rounded-t-lg">
            {vroom.coverImageUrl ? (
              <img
                src={vroom.coverImageUrl}
                alt={vroom.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <FaStore className="text-4xl text-muted-foreground" />
              </div>
            )}
            <div className="absolute top-3 right-3">
              <Badge variant={vroom.isPublic ? "default" : "secondary"}>
                {vroom.isPublic ? "Public" : "Private"}
              </Badge>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className="font-semibold text-lg mb-2 line-clamp-1" data-testid="vroom-name">
              {vroom.name}
            </h3>
            
            {vroom.description && (
              <p className="text-muted-foreground text-sm mb-3 line-clamp-2" data-testid="vroom-description">
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
                    className="w-6 h-6 rounded-full"
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
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <FaStore className="text-xs" />
                  {vroom.stats?.products || 0}
                </span>
                <span className="flex items-center gap-1">
                  <FaHeart className="text-xs" />
                  {vroom.stats?.followers || 0}
                </span>
                <span className="flex items-center gap-1">
                  <FaEye className="text-xs" />
                  {vroom.stats?.views || 0}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}