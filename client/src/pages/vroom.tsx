import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/Sidebar";
import ProductCard from "@/components/product/ProductCard";
import SelectProductForVroomModal from "@/components/vroom/SelectProductForVroomModal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FaUser, FaStore, FaEye, FaHeart, FaPlus, FaEllipsisV, FaEdit, FaTrash, FaShare } from "react-icons/fa";

interface VroomData {
  id: string;
  name: string;
  description?: string;
  coverImageUrl?: string;
  isPublic: boolean;
  userId: string;
  createdAt: string;
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  };
  products?: Array<{
    id: string;
    name: string;
    description?: string;
    price: number;
    imageUrls: string[];
    userId: string;
    createdAt: string;
  }>;
  stats?: {
    followers: number;
    views: number;
    isFollowing: boolean;
  };
}

export default function Vroom() {
  const { id } = useParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddProduct, setShowAddProduct] = useState(false);

  const {
    data: vroom,
    isLoading,
    error
  } = useQuery<VroomData>({
    queryKey: ["/api/vrooms", id],
    enabled: !!id,
    retry: false,
  });

  // Follow/Unfollow mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      const method = vroom?.stats?.isFollowing ? "DELETE" : "POST";
      return await apiRequest(method, `/api/vrooms/${id}/follow`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vrooms", id] });
      toast({
        title: "Success",
        description: vroom?.stats?.isFollowing ? "Unfollowed vroom" : "Following vroom",
      });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: error?.message || "Failed to update follow status",
        variant: "destructive",
      });
    },
  });

  // Delete vroom mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/vrooms/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Vroom deleted successfully",
      });
      window.location.href = "/profile";
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete vroom",
        variant: "destructive",
      });
    },
  });

  const handleShare = async () => {
    try {
      await navigator.share({
        title: vroom?.name,
        text: vroom?.description,
        url: window.location.href,
      });
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Success",
        description: "Link copied to clipboard!",
      });
    }
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this vroom? This action cannot be undone.")) {
      deleteMutation.mutate();
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 ml-64 p-6">
          <Skeleton className="h-40 w-full mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-80 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error && isUnauthorizedError(error as Error)) {
    toast({
      title: "Unauthorized",
      description: "You are logged out. Logging in again...",
      variant: "destructive",
    });
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 500);
    return null;
  }

  if (!vroom) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 ml-64 p-6">
          <div className="text-center py-12" data-testid="vroom-not-found">
            <FaStore className="mx-auto text-6xl text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Vroom not found</h2>
            <p className="text-muted-foreground">This vroom doesn't exist or has been removed.</p>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = user && vroom.userId === user.id;
  const canEdit = isOwner;
  const productCount = vroom.products?.length || 0;
  const followerCount = vroom.stats?.followers || 0;

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 ml-64">
        <div className="max-w-6xl mx-auto p-6">
          {/* Vroom Header */}
          <Card className="mb-6" data-testid="vroom-header">
            <CardContent className="p-6">
              {/* Cover Image */}
              {vroom.coverImageUrl && (
                <div className="w-full h-48 mb-6 rounded-xl overflow-hidden">
                  <img
                    src={vroom.coverImageUrl}
                    alt={vroom.name}
                    className="w-full h-full object-cover"
                    data-testid="vroom-cover-image"
                  />
                </div>
              )}

              <div className="flex items-start space-x-4">
                {/* Vroom Icon */}
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                  <FaStore className="text-2xl text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <h1 className="text-3xl font-bold" data-testid="vroom-name">
                      {vroom.name}
                    </h1>

                    <div className="flex items-center gap-2">
                      <Badge variant={vroom.isPublic ? "default" : "secondary"}>
                        {vroom.isPublic ? "Public" : "Private"}
                      </Badge>

                      {canEdit && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" data-testid="button-vroom-menu">
                              <FaEllipsisV />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem data-testid="menu-edit-vroom">
                              <FaEdit className="mr-2" />
                              Edit Vroom
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={handleDelete}
                              className="text-destructive"
                              data-testid="menu-delete-vroom"
                            >
                              <FaTrash className="mr-2" />
                              Delete Vroom
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>

                  {vroom.description && (
                    <p className="text-muted-foreground mb-4" data-testid="vroom-description">
                      {vroom.description}
                    </p>
                  )}

                  {/* Owner Info */}
                  {vroom.user && (
                    <div className="flex items-center gap-2 mb-4">
                      {vroom.user.profileImageUrl ? (
                        <img
                          src={vroom.user.profileImageUrl}
                          alt="Owner"
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <FaUser className="text-xs" />
                        </div>
                      )}
                      <span className="font-medium">
                        {vroom.user.firstName} {vroom.user.lastName}
                      </span>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center space-x-6 text-sm text-muted-foreground mb-4">
                    <span data-testid="vroom-product-count">
                      <strong>{productCount}</strong> products
                    </span>
                    <span data-testid="vroom-followers">
                      <strong>{followerCount}</strong> followers
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3">
                    {!isOwner && isAuthenticated && (
                      <Button 
                        onClick={() => followMutation.mutate()}
                        disabled={followMutation.isPending}
                        variant={vroom.stats?.isFollowing ? "outline" : "default"}
                        data-testid="button-follow-vroom"
                      >
                        <FaHeart className={`mr-2 ${vroom.stats?.isFollowing ? 'text-red-500' : ''}`} />
                        {vroom.stats?.isFollowing ? "Following" : "Follow"}
                      </Button>
                    )}

                    {isOwner && (
                      <Button 
                        onClick={() => setShowAddProduct(true)}
                        data-testid="button-add-product-to-vroom"
                      >
                        <FaPlus className="mr-2" />
                        Add Product
                      </Button>
                    )}

                    <Button 
                      variant="outline" 
                      onClick={handleShare}
                      data-testid="button-share-vroom"
                    >
                      <FaShare className="mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products Section */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Products ({productCount})</h2>

            {vroom.products && vroom.products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="vroom-products-grid">
                {vroom.products.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={{
                      ...product,
                      description: product.description || "",
                      price: product.price.toString(),
                      imageUrls: product.imageUrls || [],
                      likes: 0,
                      userId: product.userId,
                      user: vroom.user
                    }}
                    showAddToVroom={false}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center" data-testid="empty-vroom-products">
                  <FaStore className="mx-auto text-6xl text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No products yet</h3>
                  <p className="text-muted-foreground mb-4">
                    {isOwner 
                      ? "Start building your collection by adding products to this vroom."
                      : "This vroom doesn't have any products yet."
                    }
                  </p>
                  {isOwner && (
                    <Button onClick={() => setShowAddProduct(true)}>
                      <FaPlus className="mr-2" />
                      Add Your First Product
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Add Product to Vroom Modal */}
      {showAddProduct && (
        <SelectProductForVroomModal
          isOpen={showAddProduct}
          onClose={() => setShowAddProduct(false)}
          vroomId={id || ""}
        />
      )}
    </div>
  );
}