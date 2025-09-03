import {
  users,
  vrooms,
  products,
  productLikes,
  productComments,
  productShares,
  cartItems,
  orders,
  follows,
  vroomFollows,
  messages,
  type User,
  type UpsertUser,
  type Vroom,
  type InsertVroom,
  type Product,
  type InsertProduct,
  type Order,
  type InsertOrder,
  type Message,
  type InsertMessage,
  type CartItem,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, or, like, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Product operations
  createProduct(userId: string, product: InsertProduct): Promise<Product>;
  getProducts(limit?: number, offset?: number): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  getProductsByUser(userId: string): Promise<Product[]>;
  getProductsByVroom(vroomId: string): Promise<Product[]>;
  getTrendingProducts(): Promise<Product[]>;
  searchProducts(query: string): Promise<Product[]>;
  incrementProductViews(productId: string): Promise<void>;
  
  // Product interactions
  likeProduct(userId: string, productId: string): Promise<void>;
  unlikeProduct(userId: string, productId: string): Promise<void>;
  commentOnProduct(userId: string, productId: string, content: string): Promise<void>;
  shareProduct(userId: string, productId: string): Promise<void>;
  getProductStats(productId: string): Promise<{ likes: number; comments: number; shares: number }>;
  
  // Vroom operations
  createVroom(userId: string, vroom: InsertVroom): Promise<Vroom>;
  getVrooms(limit?: number): Promise<Vroom[]>;
  getVroom(id: string): Promise<Vroom | undefined>;
  getVroomsByUser(userId: string): Promise<Vroom[]>;
  getTrendingVrooms(): Promise<Vroom[]>;
  followVroom(userId: string, vroomId: string): Promise<void>;
  unfollowVroom(userId: string, vroomId: string): Promise<void>;
  
  // Cart operations
  addToCart(userId: string, productId: string, quantity?: number): Promise<void>;
  removeFromCart(userId: string, productId: string): Promise<void>;
  getCartItems(userId: string): Promise<CartItem[]>;
  clearCart(userId: string): Promise<void>;
  
  // Order operations
  createOrder(buyerId: string, order: InsertOrder): Promise<Order>;
  getOrders(userId: string): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  updateOrderStatus(orderId: string, status: string): Promise<void>;
  
  // Message operations
  sendMessage(senderId: string, message: InsertMessage): Promise<Message>;
  getMessages(userId1: string, userId2: string): Promise<Message[]>;
  getConversations(userId: string): Promise<any[]>;
  markMessagesAsRead(userId: string, senderId: string): Promise<void>;
  
  // Follow operations
  followUser(followerId: string, followingId: string): Promise<void>;
  unfollowUser(followerId: string, followingId: string): Promise<void>;
  getFollowers(userId: string): Promise<User[]>;
  getFollowing(userId: string): Promise<User[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Product operations
  async createProduct(userId: string, product: InsertProduct): Promise<Product> {
    const [newProduct] = await db
      .insert(products)
      .values({ ...product, userId })
      .returning();
    return newProduct;
  }

  async getProducts(limit = 20, offset = 0): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.isAvailable, true))
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getProductsByUser(userId: string): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.userId, userId))
      .orderBy(desc(products.createdAt));
  }

  async getProductsByVroom(vroomId: string): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(and(eq(products.vroomId, vroomId), eq(products.isAvailable, true)))
      .orderBy(desc(products.createdAt));
  }

  async getTrendingProducts(): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.isAvailable, true))
      .orderBy(desc(products.views))
      .limit(10);
  }

  async searchProducts(query: string): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.isAvailable, true),
          or(
            like(products.name, `%${query}%`),
            like(products.description, `%${query}%`),
            sql`${products.hashtags} && ARRAY[${query}]`
          )
        )
      )
      .orderBy(desc(products.createdAt));
  }

  async incrementProductViews(productId: string): Promise<void> {
    await db
      .update(products)
      .set({ views: sql`${products.views} + 1` })
      .where(eq(products.id, productId));
  }

  // Product interactions
  async likeProduct(userId: string, productId: string): Promise<void> {
    await db.insert(productLikes).values({ userId, productId }).onConflictDoNothing();
  }

  async unlikeProduct(userId: string, productId: string): Promise<void> {
    await db
      .delete(productLikes)
      .where(and(eq(productLikes.userId, userId), eq(productLikes.productId, productId)));
  }

  async commentOnProduct(userId: string, productId: string, content: string): Promise<void> {
    await db.insert(productComments).values({ userId, productId, content });
  }

  async shareProduct(userId: string, productId: string): Promise<void> {
    await db.insert(productShares).values({ userId, productId }).onConflictDoNothing();
  }

  async getProductStats(productId: string): Promise<{ likes: number; comments: number; shares: number }> {
    const [likesResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(productLikes)
      .where(eq(productLikes.productId, productId));

    const [commentsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(productComments)
      .where(eq(productComments.productId, productId));

    const [sharesResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(productShares)
      .where(eq(productShares.productId, productId));

    return {
      likes: Number(likesResult.count),
      comments: Number(commentsResult.count),
      shares: Number(sharesResult.count),
    };
  }

  // Vroom operations
  async createVroom(userId: string, vroom: InsertVroom): Promise<Vroom> {
    const [newVroom] = await db
      .insert(vrooms)
      .values({ ...vroom, userId })
      .returning();
    return newVroom;
  }

  async getVrooms(limit = 20): Promise<Vroom[]> {
    return await db
      .select()
      .from(vrooms)
      .where(eq(vrooms.isPublic, true))
      .orderBy(desc(vrooms.createdAt))
      .limit(limit);
  }

  async getVroom(id: string): Promise<Vroom | undefined> {
    const [vroom] = await db.select().from(vrooms).where(eq(vrooms.id, id));
    return vroom;
  }

  async getVroomsByUser(userId: string): Promise<Vroom[]> {
    return await db
      .select()
      .from(vrooms)
      .where(eq(vrooms.userId, userId))
      .orderBy(desc(vrooms.createdAt));
  }

  async getTrendingVrooms(): Promise<Vroom[]> {
    return await db
      .select({
        id: vrooms.id,
        userId: vrooms.userId,
        name: vrooms.name,
        description: vrooms.description,
        coverImageUrl: vrooms.coverImageUrl,
        isPublic: vrooms.isPublic,
        createdAt: vrooms.createdAt,
        updatedAt: vrooms.updatedAt,
      })
      .from(vrooms)
      .leftJoin(vroomFollows, eq(vrooms.id, vroomFollows.vroomId))
      .where(eq(vrooms.isPublic, true))
      .groupBy(vrooms.id)
      .orderBy(desc(sql`count(${vroomFollows.id})`))
      .limit(10);
  }

  async followVroom(userId: string, vroomId: string): Promise<void> {
    await db.insert(vroomFollows).values({ userId, vroomId }).onConflictDoNothing();
  }

  async unfollowVroom(userId: string, vroomId: string): Promise<void> {
    await db
      .delete(vroomFollows)
      .where(and(eq(vroomFollows.userId, userId), eq(vroomFollows.vroomId, vroomId)));
  }

  // Cart operations
  async addToCart(userId: string, productId: string, quantity = 1): Promise<void> {
    await db
      .insert(cartItems)
      .values({ userId, productId, quantity })
      .onConflictDoUpdate({
        target: [cartItems.userId, cartItems.productId],
        set: { quantity: sql`${cartItems.quantity} + ${quantity}` },
      });
  }

  async removeFromCart(userId: string, productId: string): Promise<void> {
    await db
      .delete(cartItems)
      .where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId)));
  }

  async getCartItems(userId: string): Promise<CartItem[]> {
    return await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.userId, userId));
  }

  async clearCart(userId: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.userId, userId));
  }

  // Order operations
  async createOrder(buyerId: string, order: InsertOrder): Promise<Order> {
    const [newOrder] = await db
      .insert(orders)
      .values({ ...order, buyerId })
      .returning();
    return newOrder;
  }

  async getOrders(userId: string): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(or(eq(orders.buyerId, userId), eq(orders.sellerId, userId)))
      .orderBy(desc(orders.createdAt));
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async updateOrderStatus(orderId: string, status: string): Promise<void> {
    await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, orderId));
  }

  // Message operations
  async sendMessage(senderId: string, message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values({ ...message, senderId })
      .returning();
    return newMessage;
  }

  async getMessages(userId1: string, userId2: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        or(
          and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
          and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))
        )
      )
      .orderBy(messages.createdAt);
  }

  async getConversations(userId: string): Promise<any[]> {
    // Get all users who have sent or received messages with this user
    const conversations = await db
      .selectDistinct({
        userId: sql<string>`CASE WHEN ${messages.senderId} = ${userId} THEN ${messages.receiverId} ELSE ${messages.senderId} END`,
        lastMessage: messages.content,
        lastMessageTime: messages.createdAt,
        isRead: messages.isRead,
      })
      .from(messages)
      .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
      .orderBy(desc(messages.createdAt));

    return conversations;
  }

  async markMessagesAsRead(userId: string, senderId: string): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(and(eq(messages.receiverId, userId), eq(messages.senderId, senderId)));
  }

  // Follow operations
  async followUser(followerId: string, followingId: string): Promise<void> {
    await db.insert(follows).values({ followerId, followingId }).onConflictDoNothing();
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    await db
      .delete(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
  }

  async getFollowers(userId: string): Promise<User[]> {
    return await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        username: users.username,
        bio: users.bio,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(follows)
      .innerJoin(users, eq(follows.followerId, users.id))
      .where(eq(follows.followingId, userId));
  }

  async getFollowing(userId: string): Promise<User[]> {
    return await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        username: users.username,
        bio: users.bio,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(follows)
      .innerJoin(users, eq(follows.followingId, users.id))
      .where(eq(follows.followerId, userId));
  }
}

export const storage = new DatabaseStorage();
