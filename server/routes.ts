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

  // Message routes
  app.get('/api/messages/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await storage.getConversations(userId);
      
      // Get user details for each conversation
      const conversationsWithUsers = await Promise.all(
        conversations.map(async (conv) => {
          const user = await storage.getUser(conv.userId);
          return { ...conv, user };
        })
      );
      
      res.json(conversationsWithUsers);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get('/api/messages/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const otherUserId = req.params.userId;
      
      const messages = await storage.getMessages(currentUserId, otherUserId);
      
      // Mark messages as read
      await storage.markMessagesAsRead(currentUserId, otherUserId);
      
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const senderId = req.user.claims.sub;
      const validatedData = insertMessageSchema.parse(req.body);
      
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

  // Start a new conversation (for messaging from product pages)
  app.post('/api/messages/start', isAuthenticated, async (req: any, res) => {
    try {
      const senderId = req.user.claims.sub;
      const { receiverId, content } = req.body;

      if (!receiverId || !content) {
        return res.status(400).json({ message: "receiverId and content are required" });
      }

      // 1. Check if a conversation already exists between sender and receiver
      let conversation = await storage.findConversation(senderId, receiverId);

      // 2. If no conversation exists, create one
      if (!conversation) {
        conversation = await storage.createConversation(senderId, receiverId);
      }

      // 3. Send the message inside that conversation
      const message = await storage.sendMessage(senderId, {
        receiverId,
        conversationId: conversation.id, // link to existing/new conversation
        content: content.trim(),
      });

      res.status(201).json({ conversation, message });
    } catch (error) {
      console.error("Error starting conversation:", error);
      res.status(500).json({ message: "Failed to start conversation" });
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

  // WebSocket server for real-time messaging
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  // Track connected clients by userId
  const clients = new Map<string, WebSocket>();

  wss.on("connection", (ws, req) => {
    // Example: you can parse JWT from query string or headers to identify the user
    const params = new URLSearchParams(req.url?.split("?")[1]);
    const userId = params.get("userId"); // ✅ Or decode JWT here

    if (!userId) {
      ws.close();
      return;
    }

    clients.set(userId, ws);

    console.log(`User ${userId} connected via WebSocket`);

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        const { receiverId, content } = message;

        if (!receiverId || !content) {
          return; // ignore bad messages
        }

        // ✅ Check or create conversation before saving message
        let conversation = await storage.findConversation(userId, receiverId);
        if (!conversation) {
          conversation = await storage.createConversation(userId, receiverId);
        }

        // ✅ Save message in DB
        const savedMessage = await storage.sendMessage(userId, {
          receiverId,
          conversationId: conversation.id,
          content: content.trim(),
        });

        // ✅ Deliver to receiver if online
        const receiverSocket = clients.get(receiverId);
        if (receiverSocket && receiverSocket.readyState === receiverSocket.OPEN) {
          receiverSocket.send(JSON.stringify({ type: "message", data: savedMessage }));
        }

        // ✅ Echo back to sender (to update UI instantly)
        ws.send(JSON.stringify({ type: "message", data: savedMessage }));
      } catch (error) {
        console.error("WebSocket message error:", error);
        ws.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
      }
    });

    ws.on("close", () => {
      clients.delete(userId);
      console.log(`User ${userId} disconnected`);
    });
  });

  return httpServer;
}

