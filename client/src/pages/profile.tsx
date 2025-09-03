import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/layout/Sidebar";
import RightSidebar from "@/components/layout/RightSidebar";
import ProductCard from "@/components/product/ProductCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { FaEdit, FaMapMarkerAlt, FaCalendarAlt, FaStore, FaUsers, FaHeart, FaCamera } from "react-icons/fa";
import { isUnauthorizedError } from "@/lib/authUtils";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Fetch user's profile data
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/profile"],
    enabled: !!user,
  });

  // Fetch user's products
  const { data: userProducts, isLoading: productsLoading } = useQuery({
    queryKey: ["/api/products/user"],
    enabled: !!user,
  });

  // Fetch user's vrooms
  const { data: userVrooms, isLoading: vroomsLoading } = useQuery({
    queryKey: ["/api/vrooms/user"],
    enabled: !!user,
  });

  // Edit profile form
  const form = useForm({
    defaultValues: {
      firstName: (user as any)?.firstName || "",
      lastName: (user as any)?.lastName || "",
      bio: (profileData as any)?.bio || "",
      location: (profileData as any)?.location || "",
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PUT", "/api/profile", data);
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      setEditModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error) => {
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
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Image upload functions
  const handleGetUploadParameters = async () => {
    const response = await apiRequest('POST', '/api/objects/upload') as { uploadURL: string };
    return {
      method: 'PUT' as const,
      url: response.uploadURL,
    };
  };

  const handleImageUpload = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>, type: 'profile' | 'banner') => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      try {
        await apiRequest('PUT', '/api/profile/image', {
          imageURL: uploadedFile.uploadURL,
          type: type,
        });
        
        toast({
          title: `${type === 'profile' ? 'Profile' : 'Banner'} image updated`,
          description: `Your ${type === 'profile' ? 'profile' : 'banner'} image has been updated successfully.`,
        });
        
        // Invalidate and refetch
        queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      } catch (error) {
        console.error('Error updating image:', error);
        toast({
          title: "Error",
          description: `Failed to update ${type === 'profile' ? 'profile' : 'banner'} image. Please try again.`,
          variant: "destructive",
        });
      }
    }
  };

  const onSubmit = (data: any) => {
    updateProfileMutation.mutate(data);
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 ml-64 mr-80">
          <div className="max-w-4xl mx-auto p-6">
            <div className="space-y-6">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-80 w-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
        <RightSidebar />
      </div>
    );
  }

  const profileStats = {
    followers: (profileData as any)?.followers || 0,
    following: (profileData as any)?.following || 0,
    posts: userProducts && Array.isArray(userProducts) ? userProducts.length : 0,
    vrooms: userVrooms && Array.isArray(userVrooms) ? userVrooms.length : 0,
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 ml-64 mr-80">
        <div className="max-w-4xl mx-auto p-6">
          {/* Profile Header */}
          <Card className="mb-6" data-testid="profile-header">
            <CardContent className="p-0">
              {/* Cover Image */}
              <div className="h-48 relative overflow-hidden">
                {(profileData as any)?.user?.bannerImageUrl ? (
                  <img
                    src={(profileData as any).user.bannerImageUrl}
                    alt="Profile Banner"
                    className="w-full h-full object-cover"
                    data-testid="profile-banner"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-accent/20 to-primary/20" />
                )}
                {/* Profile Image */}
                <div className="absolute -bottom-12 left-6">
                  {(profileData as any)?.user?.profileImageUrl || (user as any)?.profileImageUrl ? (
                    <img
                      src={(profileData as any)?.user?.profileImageUrl || (user as any).profileImageUrl}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover border-4 border-background"
                      data-testid="profile-avatar"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-muted border-4 border-background flex items-center justify-center">
                      <span className="text-2xl font-bold text-muted-foreground">
                        {(user as any)?.firstName?.[0] || (user as any)?.email?.[0] || '?'}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Edit Profile Button */}
                <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="absolute bottom-4 right-4"
                      data-testid="edit-profile-button"
                    >
                      <FaEdit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md" data-testid="edit-profile-modal">
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-first-name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-last-name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={form.control}
                          name="bio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bio</FormLabel>
                              <FormControl>
                                <Textarea 
                                  {...field} 
                                  placeholder="Tell us about yourself..."
                                  data-testid="input-bio"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Location</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="City, Country" data-testid="input-location" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {/* Profile Image Upload */}
                        <div className="space-y-2">
                          <Label>Profile Photo</Label>
                          <ObjectUploader
                            maxNumberOfFiles={1}
                            maxFileSize={5 * 1024 * 1024} // 5MB
                            onGetUploadParameters={handleGetUploadParameters}
                            onComplete={(result) => handleImageUpload(result, 'profile')}
                            buttonClassName="w-full"
                          >
                            <FaCamera className="w-4 h-4 mr-2" />
                            Upload Profile Photo
                          </ObjectUploader>
                        </div>

                        {/* Banner Image Upload */}
                        <div className="space-y-2">
                          <Label>Banner Image</Label>
                          <ObjectUploader
                            maxNumberOfFiles={1}
                            maxFileSize={5 * 1024 * 1024} // 5MB
                            onGetUploadParameters={handleGetUploadParameters}
                            onComplete={(result) => handleImageUpload(result, 'banner')}
                            buttonClassName="w-full"
                          >
                            <FaCamera className="w-4 h-4 mr-2" />
                            Upload Banner Image
                          </ObjectUploader>
                        </div>

                        <div className="flex gap-3 pt-4">
                          <Button 
                            type="submit" 
                            disabled={updateProfileMutation.isPending}
                            data-testid="button-save-profile"
                          >
                            {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setEditModalOpen(false)}
                            data-testid="button-cancel-edit"
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
              
              {/* Profile Info */}
              <div className="pt-16 px-6 pb-6">
                <div className="space-y-4">
                  <div>
                    <h1 className="text-2xl font-bold" data-testid="profile-name">
                      {(user as any)?.firstName} {(user as any)?.lastName}
                    </h1>
                    <p className="text-muted-foreground" data-testid="profile-email">
                      @{(user as any)?.email?.split('@')[0]}
                    </p>
                  </div>
                  
                  {(profileData as any)?.bio && (
                    <p className="text-foreground" data-testid="profile-bio">
                      {(profileData as any).bio}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {(profileData as any)?.location && (
                      <span className="flex items-center gap-1" data-testid="profile-location">
                        <FaMapMarkerAlt className="w-4 h-4" />
                        {(profileData as any).location}
                      </span>
                    )}
                    <span className="flex items-center gap-1" data-testid="profile-joined">
                      <FaCalendarAlt className="w-4 h-4" />
                      Joined {new Date((user as any)?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  
                  {/* Stats */}
                  <div className="flex gap-6" data-testid="profile-stats">
                    <div className="text-center">
                      <div className="font-bold text-lg">{profileStats.posts}</div>
                      <div className="text-sm text-muted-foreground">Posts</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-lg">{profileStats.vrooms}</div>
                      <div className="text-sm text-muted-foreground">Vrooms</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-lg">{profileStats.followers}</div>
                      <div className="text-sm text-muted-foreground">Followers</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-lg">{profileStats.following}</div>
                      <div className="text-sm text-muted-foreground">Following</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs - Products and Vrooms */}
          <div className="space-y-6">
            {/* Products Section */}
            <Card data-testid="profile-products-section">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <FaHeart className="text-accent" />
                  My Products ({profileStats.posts})
                </h2>
                
                {productsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <Skeleton key={i} className="h-80 w-full" />
                    ))}
                  </div>
                ) : userProducts && Array.isArray(userProducts) && userProducts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="user-products-grid">
                    {userProducts.map((product: any) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground" data-testid="empty-user-products">
                    <FaHeart className="mx-auto text-4xl mb-4 opacity-50" />
                    <p>You haven't posted any products yet.</p>
                    <p className="text-sm">Share your first product to get started!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Vrooms Section */}
            <Card data-testid="profile-vrooms-section">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <FaStore className="text-accent" />
                  My Vrooms ({profileStats.vrooms})
                </h2>
                
                {vroomsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-40 w-full" />
                    ))}
                  </div>
                ) : userVrooms && Array.isArray(userVrooms) && userVrooms.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="user-vrooms-grid">
                    {userVrooms.map((vroom: any) => (
                      <Card key={vroom.id} className="hover:shadow-lg transition-shadow cursor-pointer" data-testid={`vroom-card-${vroom.id}`}>
                        <CardContent className="p-6">
                          <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center">
                              <FaStore className="text-accent" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{vroom.name}</h3>
                              <p className="text-muted-foreground text-sm">{vroom.description}</p>
                              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                <span>{vroom.products?.length || 0} products</span>
                                <Badge variant="secondary">Active</Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground" data-testid="empty-user-vrooms">
                    <FaStore className="mx-auto text-4xl mb-4 opacity-50" />
                    <p>You haven't created any vrooms yet.</p>
                    <p className="text-sm">Create your first vroom to organize your products!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <RightSidebar />
    </div>
  );
}