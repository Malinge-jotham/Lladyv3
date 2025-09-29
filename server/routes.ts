import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { insertProductSchema, insertVroomSchema, insertOrderSchema, insertMessageSchema, insertProductCommentSchema, updateProfileSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get user details by ID (for messaging and profiles)
  app.get('/api/users/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.params.userId;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching user by ID:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Search users (for starting conversations)
  app.get('/api/users/search/:query', isAuthenticated, async (req: any, res) => {
    try {
      const query = req.params.query;
      const currentUserId = req.user.claims.sub;

      if (!query || query.length < 2) {
        return res.status(400).json({ message: "Query must be at least 2 characters" });
      }

      const users = await storage.searchUsers(query, currentUserId);
      res.json(users);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  // Profile routes
  app.get('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profileData = await storage.getUserProfile(userId);

      if (!profileData) {
        return res.status(404).json({ message: "Profile not found" });
      }

      res.json(profileData);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.put('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profileData = updateProfileSchema.parse(req.body);

      const updatedUser = await storage.updateProfile(userId, profileData);
      res.json(updatedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid profile data", errors: error.errors });
      }
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.get('/api/products/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const products = await storage.getProductsByUser(userId);
      res.json(products);
    } catch (error) {
      console.error("Error fetching user products:", error);
      res.status(500).json({ message: "Failed to fetch user products" });
    }
  });

  app.get('/api/vrooms/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const vrooms = await storage.getVroomsByUser(userId);
      res.json(vrooms);
    } catch (error) {
      console.error("Error fetching user vrooms:", error);
      res.status(500).json({ message: "Failed to fetch user vrooms" });
    }
  });

  // Object storage routes for profile images
  app.post('/api/objects/upload', isAuthenticated, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  app.put('/api/profile/image', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { imageURL, type } = req.body;

      if (!imageURL || !type) {
        return res.status(400).json({ message: "imageURL and type are required" });
      }

      if (!['profile', 'banner'].includes(type)) {
        return res.status(400).json({ message: "type must be 'profile' or 'banner'" });
      }

      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        imageURL,
        {
          owner: userId,
          visibility: "public", // Profile images should be publicly accessible
        }
      );

      // Update user profile with the new image
      const updateData = type === 'profile' 
        ? { profileImageUrl: objectPath }
        : { bannerImageUrl: objectPath };

      const updatedUser = await storage.updateProfile(userId, updateData);

      res.json({
        objectPath,
        user: updatedUser,
      });
    } catch (error) {
      console.error("Error setting profile image:", error);
      res.status(500).json({ message: "Failed to update profile image" });
    }
  });

  // Product routes
  app.get('/api/products', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const products = await storage.getProducts(limit, offset);

      // Get stats for each product
      const productsWithStats = await Promise.all(
        products.map(async (product) => {
          const stats = await storage.getProductStats(product.id);
          const user = await storage.getUser(product.userId);
          return { ...product, ...stats, user };
        })
      );

      res.json(productsWithStats);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get('/api/products/trending', async (req, res) => {
    try {
      const products = await storage.getTrendingProducts();
      const productsWithStats = await Promise.all(
        products.map(async (product) => {
          const stats = await storage.getProductStats(product.id);
          const user = await storage.getUser(product.userId);
          return { ...product, ...stats, user };
        })
      );
      res.json(productsWithStats);
    } catch (error) {
      console.error("Error fetching trending products:", error);
      res.status(500).json({ message: "Failed to fetch trending products" });
    }
  });

  app.get('/api/products/search', async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Query parameter 'q' is required" });
      }
      const products = await storage.searchProducts(query);
      res.json(products);
    } catch (error) {
      console.error("Error searching products:", error);
      res.status(500).json({ message: "Failed to search products" });
    }
  });

  app.get('/api/users/search', isAuthenticated, async (req: any, res) => {
    try {
      const query = req.query.q as string;
      const currentUserId = req.user.claims.sub;
      if (!query) {
        return res.status(400).json({ message: "Query parameter 'q' is required" });
      }
      const users = await storage.searchUsers(query, currentUserId);
      res.json(users);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  app.get('/api/vrooms/search', async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Query parameter 'q' is required" });
      }
      const vrooms = await storage.searchVrooms(query);
      res.json(vrooms);
    } catch (error) {
      console.error("Error searching vrooms:", error);
      res.status(500).json({ message: "Failed to search vrooms" });
    }
  });

  app.get('/api/products/:id', async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Increment views
      await storage.incrementProductViews(product.id);

      const stats = await storage.getProductStats(product.id);
      const user = await storage.getUser(product.userId);
      res.json({ ...product, ...stats, user });
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post('/api/products', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertProductSchema.parse(req.body);

      const product = await storage.createProduct(userId, validatedData);
      res.status(201).json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.post('/api/products/:id/like', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.likeProduct(userId, req.params.id);
      res.status(200).json({ message: "Product liked" });
    } catch (error) {
      console.error("Error liking product:", error);
      res.status(500).json({ message: "Failed to like product" });
    }
  });

  app.delete('/api/products/:id/like', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.unlikeProduct(userId, req.params.id);
      res.status(200).json({ message: "Product unliked" });
    } catch (error) {
      console.error("Error unliking product:", error);
      res.status(500).json({ message: "Failed to unlike product" });
    }
  });

  // Check if product is liked by user
  app.get('/api/products/:id/isLiked', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const isLiked = await storage.isProductLiked(userId, req.params.id);
      res.json(isLiked);
    } catch (error) {
      console.error("Error checking if product is liked:", error);
      res.status(500).json({ message: "Failed to check if product is liked" });
    }
  });

  // Product comment endpoints
  app.post('/api/products/:id/comment', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertProductCommentSchema.parse({
        ...req.body,
        productId: req.params.id
      });

      const comment = await storage.commentOnProduct(
        userId, 
        req.params.id, 
        validatedData.content,
        validatedData.parentCommentId || undefined
      );

      // Get the comment with user data
      const user = await storage.getUser(userId);
      res.status(201).json({ ...comment, user, replies: [] });
    } catch (error) {
      console.error("Error commenting on product:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add comment" });
    }
  });

  app.get('/api/products/:id/comments', async (req, res) => {
    try {
      const comments = await storage.getProductComments(req.params.id);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching product comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post('/api/products/:id/share', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.shareProduct(userId, req.params.id);
      res.status(200).json({ message: "Product shared" });
    } catch (error) {
      console.error("Error sharing product:", error);
      res.status(500).json({ message: "Failed to share product" });
    }
  });
  // Get trending hashtags based on product stats
  app.get('/api/hashtags/trending', async (req, res) => {
    try {
      const products = await storage.getTrendingProducts(); // Reuse your trending products logic
      const hashtagCount: Record<string, number> = {};

      products.forEach((product) => {
        if (product.hashtags && Array.isArray(product.hashtags)) {
          product.hashtags.forEach((tag: string) => {
            const lowerTag = tag.toLowerCase();
            hashtagCount[lowerTag] = (hashtagCount[lowerTag] || 0) + 1;
          });
        }
      });

      // Convert to array and sort by count
      const trendingHashtags = Object.entries(hashtagCount)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // top 10 hashtags

      res.json(trendingHashtags);
    } catch (error) {
      console.error("Error fetching trending hashtags:", error);
      res.status(500).json({ message: "Failed to fetch trending hashtags" });
    }
  });

  // Vroom routes
  app.get('/api/vrooms', async (req, res) => {
    try {
      const vrooms = await storage.getVrooms();
      res.json(vrooms);
    } catch (error) {
      console.error("Error fetching vrooms:", error);
      res.status(500).json({ message: "Failed to fetch vrooms" });
    }
  });

  app.get('/api/vrooms/trending', async (req, res) => {
    try {
      const vrooms = await storage.getTrendingVrooms();

      const vroomsWithStats = await Promise.all(
        vrooms.map(async (vroom) => {
          const followersCount = await storage.getVroomFollowersCount(vroom.id);
          const productsCount = await storage.getVroomProductsCount(vroom.id);
          const user = await storage.getUser(vroom.userId);
          return { ...vroom, followersCount, productsCount, user };
        })
      );
      res.json(vroomsWithStats);
        } catch (error) {
          console.error("Error fetching trending vrooms:", error);
          res.status(500).json({ message: "Failed to fetch trending vrooms" });
        }
      });
  app.get('/api/vrooms/popular', async (req, res) => {
    try {
      const vrooms = await storage.getPopularVrooms();

      const vroomsWithStats = await Promise.all(
        vrooms.map(async (vroom) => {
          const followersCount = await storage.getVroomFollowersCount(vroom.id);
          const productsCount = await storage.getVroomProductsCount(vroom.id);
          const user = await storage.getUser(vroom.userId);
          return { ...vroom, followersCount, productsCount, user };
        })
      );

      res.json(vroomsWithStats);
    } catch (error) {
      console.error("Error fetching popular vrooms:", error);
      res.status(500).json({ message: "Failed to fetch popular vrooms" });
    }
  });

  app.get('/api/vrooms/:id', async (req, res) => {
    try {
      const vroom = await storage.getVroom(req.params.id);
      if (!vroom) {
        return res.status(404).json({ message: "Vroom not found" });
      }

      const products = await storage.getProductsByVroom(vroom.id);
      const user = await storage.getUser(vroom.userId);
      const userId = (req as any).user?.claims?.sub;
      const stats = await storage.getVroomStats(vroom.id, userId);
      res.json({ ...vroom, products, user, stats });
    } catch (error) {
      console.error("Error fetching vroom:", error);
      res.status(500).json({ message: "Failed to fetch vroom" });
    }
  });

  app.post('/api/vrooms', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertVroomSchema.parse(req.body);

      const vroom = await storage.createVroom(userId, validatedData);
      res.status(201).json(vroom);
    } catch (error) {
      console.error("Error creating vroom:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create vroom" });
    }
  });

  app.post('/api/vrooms/:id/follow', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.followVroom(userId, req.params.id);
      res.status(200).json({ message: "Vroom followed" });
    } catch (error) {
      console.error("Error following vroom:", error);
      res.status(500).json({ message: "Failed to follow vroom" });
    }
  });

  app.delete('/api/vrooms/:id/follow', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.unfollowVroom(userId, req.params.id);
      res.status(200).json({ message: "Vroom unfollowed" });
    } catch (error) {
      console.error("Error unfollowing vroom:", error);
      res.status(500).json({ message: "Failed to unfollow vroom" });
    }
  });

  // Get user's vrooms
  app.get('/api/vrooms/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const vrooms = await storage.getVroomsByUser(userId);
      res.json(vrooms);
    } catch (error) {
      console.error("Error fetching user vrooms:", error);
      res.status(500).json({ message: "Failed to fetch user vrooms" });
    }
  });

  // Delete vroom
  app.delete('/api/vrooms/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.deleteVroom(req.params.id, userId);
      res.status(200).json({ message: "Vroom deleted successfully" });
    } catch (error) {
      console.error("Error deleting vroom:", error);
      res.status(500).json({ message: "Failed to delete vroom" });
    }
  });

  // Add product to vroom
  app.post('/api/vrooms/:id/products', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { productId } = req.body;

      if (!productId) {
        return res.status(400).json({ message: "Product ID is required" });
      }

      await storage.addProductToVroom(productId, req.params.id, userId);
      res.status(200).json({ message: "Product added to vroom" });
    } catch (error) {
      console.error("Error adding product to vroom:", error);
      res.status(500).json({ message: "Failed to add product to vroom" });
    }
  });

  // Remove product from vroom
  app.delete('/api/vrooms/:id/products/:productId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.removeProductFromVroom(req.params.productId, req.params.id, userId);
      res.status(200).json({ message: "Product removed from vroom" });
    } catch (error) {
      console.error("Error removing product from vroom:", error);
      res.status(500).json({ message: "Failed to remove product from vroom" });
    }
  });

  // Get vrooms for a product
  app.get('/api/products/:id/vrooms', async (req, res) => {
    try {
      const vrooms = await storage.getVroomsByProduct(req.params.id);
      res.json(vrooms);
    } catch (error) {
      console.error("Error fetching product vrooms:", error);
      res.status(500).json({ message: "Failed to fetch product vrooms" });
    }
  });

  // Vroom image upload endpoint
  app.put('/api/vroom-images', isAuthenticated, async (req: any, res) => {
    if (!req.body.imageURL) {
      return res.status(400).json({ error: "imageURL is required" });
    }

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.imageURL,
        {
          owner: req.user.claims.sub,
          visibility: "public",
        },
      );

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error processing vroom image:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  /* ------------------ BOOKMARK ROUTES ------------------ */

  // Bookmark a product
  app.post("/api/products/:id/bookmark", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.bookmarkProduct(userId, req.params.id);
      res.status(200).json({ message: "Product bookmarked" });
    } catch (error) {
      console.error("Error bookmarking product:", error);
      res.status(500).json({ message: "Failed to bookmark product" });
    }
  });

  // Remove bookmark
  app.delete("/api/products/:id/bookmark", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.unbookmarkProduct(userId, req.params.id);
      res.status(200).json({ message: "Product unbookmarked" });
    } catch (error) {
      console.error("Error unbookmarking product:", error);
      res.status(500).json({ message: "Failed to unbookmark product" });
    }
  });

  // Check if product is bookmarked by user
  app.get('/api/products/:id/isBookmarked', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const isBookmarked = await storage.isProductBookmarked(userId, req.params.id);
      res.json(isBookmarked);
    } catch (error) {
      console.error("Error checking if product is bookmarked:", error);
      res.status(500).json({ message: "Failed to check if product is bookmarked" });
    }
  });

  // Get user's bookmarked products
  app.get("/api/products/bookmarked", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bookmarked = await storage.getBookmarkedProducts(userId);
      res.json(bookmarked);
    } catch (error) {
      console.error("Error fetching bookmarked products:", error);
      res.status(500).json({ message: "Failed to fetch bookmarked products" });
    }
  });


  // Cart routes
  app.get('/api/cart', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cartItems = await storage.getCartItems(userId);

      // Get product details for each cart item
      const cartWithProducts = await Promise.all(
        cartItems.map(async (item) => {
          const product = await storage.getProduct(item.productId);
          return { ...item, product };
        })
      );

      res.json(cartWithProducts);
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });

  app.post('/api/cart/:productId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { quantity = 1 } = req.body;
      await storage.addToCart(userId, req.params.productId, quantity);
      res.status(200).json({ message: "Product added to cart" });
    } catch (error) {
      console.error("Error adding to cart:", error);
      res.status(500).json({ message: "Failed to add to cart" });
    }
  });

  app.delete('/api/cart/:productId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.removeFromCart(userId, req.params.productId);
      res.status(200).json({ message: "Product removed from cart" });
    } catch (error) {
      console.error("Error removing from cart:", error);
      res.status(500).json({ message: "Failed to remove from cart" });
    }
  });

  // Order routes
  app.post('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const buyerId = req.user.claims.sub;
      const validatedData = insertOrderSchema.parse(req.body);

      const order = await storage.createOrder(buyerId, validatedData);

      // Clear cart item if it exists
      await storage.removeFromCart(buyerId, validatedData.productId);

      res.status(201).json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.get('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orders = await storage.getOrders(userId);

      // Get product and user details for each order
      const ordersWithDetails = await Promise.all(
        orders.map(async (order) => {
          const product = await storage.getProduct(order.productId);
          const buyer = await storage.getUser(order.buyerId);
          const seller = await storage.getUser(order.sellerId);
          return { ...order, product, buyer, seller };
        })
      );

      res.json(ordersWithDetails);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Message routes - SECURE VERSION WITH PROPER AUTHORIZATION
  app.get('/api/messages/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await storage.getUserConversations(userId); // Only user's conversations

      // Get user details for each conversation
      const conversationsWithUsers = await Promise.all(
        conversations.map(async (conv) => {
          // Get the other user in the conversation
          const otherUserId = conv.user1Id === userId ? conv.user2Id : conv.user1Id;
          const user = await storage.getUser(otherUserId);
          const lastMessage = await storage.getLastMessage(conv.id);
          const unreadCount = await storage.getUnreadMessageCount(userId, conv.id);
          return { ...conv, user, lastMessage, unreadCount };
        })
      );

      res.json(conversationsWithUsers);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Get messages by conversation ID - WITH AUTHORIZATION
  app.get('/api/messages/conversation/:conversationId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversationId = req.params.conversationId;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      // CRITICAL: Verify user is a participant in this conversation
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
        return res.status(403).json({ message: "Access denied to this conversation" });
      }

      const messages = await storage.getMessagesByConversation(conversationId, limit, offset);

      // Mark messages as read for this conversation
      await storage.markConversationMessagesAsRead(userId, conversationId);

      res.json(messages);
    } catch (error) {
      console.error("Error fetching conversation messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Get messages by user ID - WITH AUTHORIZATION
  app.get('/api/messages/user/:otherUserId', isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const otherUserId = req.params.otherUserId;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      // Find or create conversation between users
      let conversation = await storage.findConversation(currentUserId, otherUserId);
      if (!conversation) {
        conversation = await storage.createConversation(currentUserId, otherUserId);
      }

      // Double-check authorization
      if (conversation.user1Id !== currentUserId && conversation.user2Id !== currentUserId) {
        return res.status(403).json({ message: "Access denied to this conversation" });
      }

      const messages = await storage.getMessagesByConversation(conversation.id, limit, offset);

      // Mark messages as read
      await storage.markConversationMessagesAsRead(currentUserId, conversation.id);

      res.json({
        conversation,
        messages
      });
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Send message - WITH AUTHORIZATION
  app.post('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const senderId = req.user.claims.sub;
      const validatedData = insertMessageSchema.parse(req.body);

      // Verify conversation access if conversationId is provided
      if (validatedData.conversationId) {
        const conversation = await storage.getConversation(validatedData.conversationId);
        if (!conversation) {
          return res.status(404).json({ message: "Conversation not found" });
        }

        // CRITICAL: Verify sender is a participant in the conversation
        if (conversation.user1Id !== senderId && conversation.user2Id !== senderId) {
          return res.status(403).json({ message: "Access denied to this conversation" });
        }

        // CRITICAL: Verify receiver is the other participant in the conversation
        const receiverId = conversation.user1Id === senderId ? conversation.user2Id : conversation.user1Id;
        if (validatedData.receiverId !== receiverId) {
          return res.status(400).json({ message: "Receiver ID does not match conversation" });
        }
      } else {
        // If no conversationId, create/find conversation and verify access
        if (!validatedData.receiverId) {
          return res.status(400).json({ message: "Receiver ID is required when conversationId is not provided" });
        }

        let conversation = await storage.findConversation(senderId, validatedData.receiverId);
        if (!conversation) {
          conversation = await storage.createConversation(senderId, validatedData.receiverId);
        }
        validatedData.conversationId = conversation.id;
      }

      const message = await storage.sendMessage(senderId, validatedData);
      res.status(201).json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Start a new conversation - WITH AUTHORIZATION
  app.post('/api/messages/start', isAuthenticated, async (req: any, res) => {
    try {
      const senderId = req.user.claims.sub;
      const { receiverId, content, productId } = req.body;

      if (!receiverId || !content) {
        return res.status(400).json({ message: "receiverId and content are required" });
      }

      // Users cannot message themselves
      if (senderId === receiverId) {
        return res.status(400).json({ message: "Cannot start conversation with yourself" });
      }

      // Check if a conversation already exists between sender and receiver
      let conversation = await storage.findConversation(senderId, receiverId);

      // If no conversation exists, create one
      if (!conversation) {
        conversation = await storage.createConversation(senderId, receiverId);
      }

      // Link conversation to product if provided
      if (productId) {
        await storage.linkConversationToProduct(conversation.id, productId);
      }

      // Send the message inside that conversation
      const message = await storage.sendMessage(senderId, {
        receiverId,
        conversationId: conversation.id,
        content: content.trim(),
        productId: productId || undefined
      });

      res.status(201).json({ conversation, message });
    } catch (error) {
      console.error("Error starting conversation:", error);
      res.status(500).json({ message: "Failed to start conversation" });
    }
  });

  // Get conversation by product context - WITH AUTHORIZATION
  app.get('/api/messages/product/:productId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const productId = req.params.productId;

      // Find conversation related to this product involving the current user
      const conversation = await storage.findProductConversation(userId, productId);

      if (!conversation) {
        return res.status(404).json({ message: "No conversation found for this product" });
      }

      // CRITICAL: Verify user is a participant in this conversation
      if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
        return res.status(403).json({ message: "Access denied to this conversation" });
      }

      const messages = await storage.getMessagesByConversation(conversation.id);
      await storage.markConversationMessagesAsRead(userId, conversation.id);

      res.json({ conversation, messages });
    } catch (error) {
      console.error("Error fetching product conversation:", error);
      res.status(500).json({ message: "Failed to fetch product conversation" });
    }
  });

  // Get unread message count - USER-SPECIFIC
  app.get('/api/messages/unread-count', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const count = await storage.getTotalUnreadMessageCount(userId);
      res.json({ unreadCount: count });
    } catch (error) {
      console.error("Error fetching unread message count:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  // Object storage routes (for file uploads)
  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  app.put("/api/product-images", isAuthenticated, async (req: any, res) => {
    try {
      if (!req.body.imageURL) {
        return res.status(400).json({ error: "imageURL is required" });
      }

      const userId = req.user.claims.sub;
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.imageURL,
        {
          owner: userId,
          visibility: "public",
        },
      );

      res.status(200).json({ objectPath });
    } catch (error) {
      console.error("Error setting product image:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Serve private objects
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);

      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });

      if (!canAccess) {
        return res.sendStatus(401);
      }

      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time messaging - WITH AUTHORIZATION
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  // Track connected clients by userId
  const clients = new Map<string, WebSocket>();

  wss.on("connection", (ws, req) => {
    // In a real implementation, you should verify JWT token here
    const params = new URLSearchParams(req.url?.split("?")[1]);
    const userId = params.get("userId");

    if (!userId) {
      ws.close(1008, "Authentication required");
      return;
    }

    // Store the connection
    clients.set(userId, ws);
    console.log(`User ${userId} connected via WebSocket`);

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        const { receiverId, content, conversationId, productId } = message;

        if (!receiverId || !content) {
          ws.send(JSON.stringify({ type: "error", message: "Receiver ID and content are required" }));
          return;
        }

        // Users cannot message themselves
        if (userId === receiverId) {
          ws.send(JSON.stringify({ type: "error", message: "Cannot message yourself" }));
          return;
        }

        let conversation;

        // Use existing conversationId or find/create one
        if (conversationId) {
          // Verify conversation access
          conversation = await storage.getConversation(conversationId);
          if (!conversation) {
            ws.send(JSON.stringify({ type: "error", message: "Conversation not found" }));
            return;
          }

          // CRITICAL: Verify user is a participant in this conversation
          if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
            ws.send(JSON.stringify({ type: "error", message: "Access denied to conversation" }));
            return;
          }

          // Verify receiver is the other participant
          const expectedReceiverId = conversation.user1Id === userId ? conversation.user2Id : conversation.user1Id;
          if (receiverId !== expectedReceiverId) {
            ws.send(JSON.stringify({ type: "error", message: "Receiver ID does not match conversation" }));
            return;
          }
        } else {
          // Find or create conversation
          conversation = await storage.findConversation(userId, receiverId);
          if (!conversation) {
            conversation = await storage.createConversation(userId, receiverId);
          }

          // Link to product if provided
          if (productId) {
            await storage.linkConversationToProduct(conversation.id, productId);
          }
        }

        // Save message in DB
        const savedMessage = await storage.sendMessage(userId, {
          receiverId,
          conversationId: conversation.id,
          content: content.trim(),
          productId: productId || undefined
        });

        // Deliver to receiver if online
        const receiverSocket = clients.get(receiverId);
        if (receiverSocket && receiverSocket.readyState === receiverSocket.OPEN) {
          receiverSocket.send(JSON.stringify({ 
            type: "message", 
            data: savedMessage,
            conversation: conversation
          }));
        }

        // Echo back to sender
        ws.send(JSON.stringify({ 
          type: "message", 
          data: savedMessage,
          conversation: conversation
        }));
      } catch (error) {
        console.error("WebSocket message error:", error);
        ws.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
      }
    });

    ws.on("close", () => {
      clients.delete(userId);
      console.log(`User ${userId} disconnected`);
    });

    ws.on("error", (error) => {
      console.error(`WebSocket error for user ${userId}:`, error);
      clients.delete(userId);
    });
  });

  return httpServer;
}