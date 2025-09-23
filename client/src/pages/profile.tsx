import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/layout/Sidebar";
import RightSidebar from "@/components/layout/RightSidebar";
import ProductCard from "@/components/product/ProductCard";
import VroomCard from "@/components/vroom/VroomCard";
import CreateVroomModal from "@/components/vroom/CreateVroomModal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { 
  FaEdit, FaMapMarkerAlt, FaCalendarAlt, FaStore, FaHeart, 
  FaCamera, FaPlus, FaLink, FaGlobe, FaTwitter, FaInstagram,
  FaUser, FaSignature, FaBookmark, FaUserPlus
} from "react-icons/fa";
import { isUnauthorizedError } from "@/lib/authUtils";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("products");

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

  // Fetch user's vrooms with product counts
  const { data: userVrooms, isLoading: vroomsLoading } = useQuery({
    queryKey: ["/api/vrooms/user"],
    enabled: !!user,
    select: (data) => {
      if (Array.isArray(data)) {
        return data.map(vroom => ({
          ...vroom,
          _count: {
            products: vroom.products?.length || vroom._count?.products || vroom.stats?.products || 0,
            followers: vroom._count?.followers || vroom.stats?.followers || 0,
            views: vroom._count?.views || vroom.stats?.views || 0,
          }
        }));
      }
      return data;
    },
  });

  // Fetch user's bookmarks
  const { data: userBookmarks, isLoading: bookmarksLoading } = useQuery({
    queryKey: ["/api/bookmarks"],
    enabled: !!user && activeTab === "bookmarks",
  });

  // Fetch user's following list
  const { data: userFollowing, isLoading: followingLoading } = useQuery({
    queryKey: ["/api/following"],
    enabled: !!user && activeTab === "following",
  });

  // Edit profile form
  const form = useForm({
    defaultValues: {
      firstName: (user as any)?.firstName || "",
      lastName: (user as any)?.lastName || "",
      bio: (profileData as any)?.bio || "",
      location: (profileData as any)?.location || "",
      website: (profileData as any)?.website || "",
      twitter: (profileData as any)?.twitter || "",
      instagram: (profileData as any)?.instagram || "",
    },
  });

  // Reset form when profile data changes
  useEffect(() => {
    if (profileData) {
      form.reset({
        firstName: (user as any)?.firstName || "",
        lastName: (user as any)?.lastName || "",
        bio: (profileData as any)?.bio || "",
        location: (profileData as any)?.location || "",
        website: (profileData as any)?.website || "",
        twitter: (profileData as any)?.twitter || "",
        instagram: (profileData as any)?.instagram || "",
      });
    }
  }, [profileData, user, form]);

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
    const response = await apiRequest('POST', '/api/objects/upload');
    const data = await response.json() as { uploadURL: string };
    return {
      method: 'PUT' as const,
      url: data.uploadURL,
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
              <Skeleton className="h-48 w-full rounded-xl" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-32 w-32 rounded-full -mt-16 border-4 border-background" />
                <Skeleton className="h-10 w-32 rounded-md" />
              </div>
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-80 w-full rounded-xl" />
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
    bookmarks: userBookmarks && Array.isArray(userBookmarks) ? userBookmarks.length : 0,
  };

  const userInitial = (user as any)?.firstName?.[0] || (user as any)?.email?.[0] || '?';

  // Render bookmarked products
  const renderBookmarks = () => {
    if (bookmarksLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-80 w-full rounded-xl" />
          ))}
        </div>
      );
    }

    if (userBookmarks && Array.isArray(userBookmarks) && userBookmarks.length > 0) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="user-bookmarks-grid">
          {userBookmarks.map((bookmark: any) => (
            <ProductCard key={bookmark.id} product={bookmark.product || bookmark} />
          ))}
        </div>
      );
    }

    return (
      <div className="text-center py-16 text-muted-foreground" data-testid="empty-user-bookmarks">
        <FaBookmark className="mx-auto text-5xl mb-4 opacity-30" />
        <h3 className="text-xl font-medium mb-2">No bookmarks yet</h3>
        <p className="mb-6">Products you bookmark will appear here.</p>
        <Button className="bg-primary hover:bg-primary/90">
          Explore Products
        </Button>
      </div>
    );
  };

  // Render following list
  const renderFollowing = () => {
    if (followingLoading) {
      return (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-2/3" />
              </div>
              <Skeleton className="h-9 w-20 rounded-md" />
            </div>
          ))}
        </div>
      );
    }

    if (userFollowing && Array.isArray(userFollowing) && userFollowing.length > 0) {
      return (
        <div className="space-y-4" data-testid="user-following-list">
          {userFollowing.map((followedUser: any) => (
            <div key={followedUser.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                  {followedUser.firstName?.[0] || followedUser.email?.[0] || '?'}
                </div>
                <div>
                  <h4 className="font-semibold">{followedUser.firstName} {followedUser.lastName}</h4>
                  <p className="text-muted-foreground text-sm">@{followedUser.email?.split('@')[0]}</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Following
              </Button>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="text-center py-16 text-muted-foreground" data-testid="empty-user-following">
        <FaUserPlus className="mx-auto text-5xl mb-4 opacity-30" />
        <h3 className="text-xl font-medium mb-2">Not following anyone yet</h3>
        <p className="mb-6">Users you follow will appear here.</p>
        <Button className="bg-primary hover:bg-primary/90">
          Discover Users
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <div className="flex-1 ml-64 mr-80">
        <div className="max-w-4xl mx-auto p-6">
          {/* Profile Header */}
          <Card className="mb-6 overflow-hidden border-0 shadow-lg" data-testid="profile-header">
            <CardContent className="p-0">
              {/* Cover Image */}
              <div className="h-48 relative overflow-hidden bg-gradient-to-r from-blue-400 to-purple-500">
                {(profileData as any)?.user?.bannerImageUrl ? (
                  <img
                    src={(profileData as any).user.bannerImageUrl}
                    alt="Profile Banner"
                    className="w-full h-full object-cover"
                    data-testid="profile-banner"
                  />
                ) : null}

                {/* Banner Upload Overlay */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="secondary" 
                      size="sm"
                      className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm hover:bg-background"
                    >
                      <FaCamera className="w-4 h-4 mr-2" />
                      Edit Banner
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Update Banner Image</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      <ObjectUploader
                        maxNumberOfFiles={1}
                        maxFileSize={5 * 1024 * 1024}
                        onGetUploadParameters={handleGetUploadParameters}
                        onComplete={(result) => handleImageUpload(result, 'banner')}
                        buttonClassName="w-full"
                      >
                        <FaCamera className="w-4 h-4 mr-2" />
                        Upload Banner Image
                      </ObjectUploader>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Profile Content */}
              <div className="px-8 pb-8">
                {/* Profile Image */}
                <div className="flex justify-between items-start -mt-20 mb-6">
                  <div className="relative group">
                    <div className="w-40 h-40 rounded-full border-4 border-background bg-background overflow-hidden shadow-lg">
                      {(profileData as any)?.user?.profileImageUrl || (user as any)?.profileImageUrl ? (
                        <img
                          src={(profileData as any)?.user?.profileImageUrl || (user as any).profileImageUrl}
                          alt="Profile"
                          className="w-full h-full object-cover"
                          data-testid="profile-avatar"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                          <span className="text-5xl font-bold text-white">
                            {userInitial}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Profile Image Upload Overlay */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="secondary" 
                          size="icon"
                          className="absolute bottom-2 right-2 rounded-full w-10 h-10 bg-background/80 backdrop-blur-sm group-hover:bg-background"
                        >
                          <FaCamera className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Update Profile Photo</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                          <ObjectUploader
                            maxNumberOfFiles={1}
                            maxFileSize={5 * 1024 * 1024}
                            onGetUploadParameters={handleGetUploadParameters}
                            onComplete={(result) => handleImageUpload(result, 'profile')}
                            buttonClassName="w-full"
                          >
                            <FaCamera className="w-4 h-4 mr-2" />
                            Upload Profile Photo
                          </ObjectUploader>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Edit Profile Button */}
                  <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        data-testid="edit-profile-button"
                      >
                        <FaEdit className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="edit-profile-modal">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                          <FaUser className="w-5 h-5" />
                          Edit Profile
                        </DialogTitle>
                      </DialogHeader>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="firstName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center gap-2">
                                    <FaSignature className="w-3 h-3" />
                                    First Name
                                  </FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      data-testid="input-first-name" 
                                      autoFocus
                                      onFocus={(e) => e.target.select()}
                                      className="h-11"
                                      placeholder="Enter your first name"
                                    />
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
                                  <FormLabel className="flex items-center gap-2">
                                    <FaSignature className="w-3 h-3" />
                                    Last Name
                                  </FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      data-testid="input-last-name" 
                                      onFocus={(e) => e.target.select()}
                                      className="h-11"
                                      placeholder="Enter your last name"
                                    />
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
                                <FormLabel className="flex items-center gap-2">
                                  <FaUser className="w-3 h-3" />
                                  Bio
                                </FormLabel>
                                <FormControl>
                                  <Textarea 
                                    {...field} 
                                    placeholder="Tell us about yourself..."
                                    data-testid="input-bio"
                                    className="min-h-[120px] resize-none"
                                    onFocus={(e) => e.target.select()}
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
                                <FormLabel className="flex items-center gap-2">
                                  <FaMapMarkerAlt className="w-3 h-3" />
                                  Location
                                </FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    placeholder="City, Country" 
                                    data-testid="input-location" 
                                    onFocus={(e) => e.target.select()}
                                    className="h-11"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                              control={form.control}
                              name="website"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center gap-2">
                                    <FaGlobe className="w-3 h-3" />
                                    Website
                                  </FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      placeholder="https://example.com" 
                                      onFocus={(e) => e.target.select()}
                                      className="h-11"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="twitter"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center gap-2">
                                    <FaTwitter className="w-3 h-3" />
                                    Twitter
                                  </FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      placeholder="@username" 
                                      onFocus={(e) => e.target.select()}
                                      className="h-11"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="instagram"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center gap-2">
                                    <FaInstagram className="w-3 h-3" />
                                    Instagram
                                  </FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      placeholder="@username" 
                                      onFocus={(e) => e.target.select()}
                                      className="h-11"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="flex gap-3 pt-4 justify-end border-t">
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => setEditModalOpen(false)}
                              data-testid="button-cancel-edit"
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="submit" 
                              disabled={updateProfileMutation.isPending}
                              data-testid="button-save-profile"
                              className="bg-primary hover:bg-primary/90"
                            >
                              {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Profile Info */}
                <div className="space-y-4">
                  <div>
                    <h1 className="text-3xl font-bold" data-testid="profile-name">
                      {(user as any)?.firstName} {(user as any)?.lastName}
                    </h1>
                    <p className="text-muted-foreground text-lg" data-testid="profile-email">
                      @{(user as any)?.email?.split('@')[0]}
                    </p>
                  </div>

                  {(profileData as any)?.bio && (
                    <p className="text-foreground text-lg leading-relaxed" data-testid="profile-bio">
                      {(profileData as any).bio}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-4 text-muted-foreground">
                    {(profileData as any)?.location && (
                      <span className="flex items-center gap-2" data-testid="profile-location">
                        <FaMapMarkerAlt className="w-4 h-4" />
                        {(profileData as any).location}
                      </span>
                    )}
                    <span className="flex items-center gap-2" data-testid="profile-joined">
                      <FaCalendarAlt className="w-4 h-4" />
                      Joined {new Date((user as any)?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>

                    {/* Social Links */}
                    {(profileData as any)?.website && (
                      <a 
                        href={(profileData as any).website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-500 hover:text-blue-600 hover:underline"
                      >
                        <FaGlobe className="w-4 h-4" />
                        Website
                      </a>
                    )}

                    {(profileData as any)?.twitter && (
                      <a 
                        href={`https://twitter.com/${(profileData as any).twitter.replace('@', '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-400 hover:text-blue-500 hover:underline"
                      >
                        <FaTwitter className="w-4 h-4" />
                        {(profileData as any).twitter}
                      </a>
                    )}

                    {(profileData as any)?.instagram && (
                      <a 
                        href={`https://instagram.com/${(profileData as any).instagram.replace('@', '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-pink-500 hover:text-pink-600 hover:underline"
                      >
                        <FaInstagram className="w-4 h-4" />
                        {(profileData as any).instagram}
                      </a>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex gap-8 pt-4" data-testid="profile-stats">
                    <div className="text-center">
                      <div className="font-bold text-2xl">{profileStats.posts}</div>
                      <div className="text-sm text-muted-foreground">Products</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-2xl">{profileStats.vrooms}</div>
                      <div className="text-sm text-muted-foreground">Vrooms</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-2xl">{profileStats.followers}</div>
                      <div className="text-sm text-muted-foreground">Followers</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-2xl">{profileStats.following}</div>
                      <div className="text-sm text-muted-foreground">Following</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Navigation */}
          <div className="flex border-b mb-6 overflow-x-auto">
            <button
              className={`px-4 py-3 font-medium text-lg whitespace-nowrap ${activeTab === "products" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setActiveTab("products")}
            >
              <FaHeart className="inline mr-2" />
              Products ({profileStats.posts})
            </button>
            <button
              className={`px-4 py-3 font-medium text-lg whitespace-nowrap ${activeTab === "vrooms" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setActiveTab("vrooms")}
            >
              <FaStore className="inline mr-2" />
              Vrooms ({profileStats.vrooms})
            </button>
            <button
              className={`px-4 py-3 font-medium text-lg whitespace-nowrap ${activeTab === "bookmarks" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setActiveTab("bookmarks")}
            >
              <FaBookmark className="inline mr-2" />
              Bookmarks ({profileStats.bookmarks})
            </button>
            <button
              className={`px-4 py-3 font-medium text-lg whitespace-nowrap ${activeTab === "following" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setActiveTab("following")}
            >
              <FaUserPlus className="inline mr-2" />
              Following ({profileStats.following})
            </button>
          </div>

          {/* Content Section */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              {activeTab === "products" ? (
                <div data-testid="profile-products-section">
                  {productsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-80 w-full rounded-xl" />
                      ))}
                    </div>
                  ) : userProducts && Array.isArray(userProducts) && userProducts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="user-products-grid">
                      {userProducts.map((product: any) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 text-muted-foreground" data-testid="empty-user-products">
                      <FaHeart className="mx-auto text-5xl mb-4 opacity-30" />
                      <h3 className="text-xl font-medium mb-2">No products yet</h3>
                      <p className="mb-6">You haven't posted any products yet.</p>
                      <Button className="bg-primary hover:bg-primary/90">
                        Share Your First Product
                      </Button>
                    </div>
                  )}
                </div>
              ) : activeTab === "vrooms" ? (
                <div data-testid="profile-vrooms-section">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold">Your Vrooms</h3>
                    <CreateVroomModal
                      trigger={
                        <Button 
                          size="sm" 
                          data-testid="button-create-vroom-profile"
                          className="bg-primary hover:bg-primary/90"
                        >
                          <FaPlus className="mr-2" />
                          Create Vroom
                        </Button>
                      }
                    />
                  </div>

                  {vroomsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-48 w-full rounded-xl" />
                      ))}
                    </div>
                  ) : userVrooms && Array.isArray(userVrooms) && userVrooms.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="user-vrooms-grid">
                      {userVrooms.map((vroom: any) => (
                        <VroomCard 
                          key={vroom.id} 
                          vroom={{
                            ...vroom,
                            user: profileData?.user,
                            _count: vroom._count,
                            stats: vroom.stats
                          }} 
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 text-muted-foreground" data-testid="empty-user-vrooms">
                      <FaStore className="mx-auto text-5xl mb-4 opacity-30" />
                      <h3 className="text-xl font-medium mb-2">No vrooms yet</h3>
                      <p className="mb-6">Create your first vroom to organize your products!</p>
                      <CreateVroomModal
                        trigger={
                          <Button 
                            data-testid="button-create-first-vroom"
                            className="bg-primary hover:bg-primary/90"
                          >
                            <FaPlus className="mr-2" />
                            Create Your First Vroom
                          </Button>
                        }
                      />
                    </div>
                  )}
                </div>
              ) : activeTab === "bookmarks" ? (
                <div data-testid="profile-bookmarks-section">
                  <h3 className="text-xl font-semibold mb-6">Bookmarked Products</h3>
                  {renderBookmarks()}
                </div>
              ) : activeTab === "following" ? (
                <div data-testid="profile-following-section">
                  <h3 className="text-xl font-semibold mb-6">People You Follow</h3>
                  {renderFollowing()}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

      <RightSidebar />
    </div>
  );
}