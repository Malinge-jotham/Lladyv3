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
  bookmarks,
  type User,
  type UpsertUser,
  type UpdateProfile,
  type Vroom,
  type InsertVroom,
  type Product,
  type InsertProduct,
  type Order,
  type InsertOrder,
  type Message,
  type InsertMessage,
  type CartItem,
  type InsertProductComment,
  type ProductComment,
  type Bookmark,
  type InsertBookmark,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, or, like, ilike, not, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateProfile(userId: string, profile: UpdateProfile): Promise<User>;
  getUserProfile(userId: string): Promise<{ user: User; followers: number; following: number } | undefined>;

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
  isProductLiked(userId: string, productId: string): Promise<boolean>;
  commentOnProduct(userId: string, productId: string, content: string, parentCommentId?: string): Promise<ProductComment>;
  getProductComments(productId: string): Promise<(ProductComment & { user: User; replies: (ProductComment & { user: User })[] })[]>;
  shareProduct(userId: string, productId: string): Promise<void>;
  getProductStats(productId: string): Promise<{ likes: number; comments: number; shares: number }>;

  // Bookmark operations
  bookmarkProduct(userId: string, productId: string): Promise<void>;
  unbookmarkProduct(userId: string, productId: string): Promise<void>;
  isProductBookmarked(userId: string, productId: string): Promise<boolean>;
  getBookmarks(userId: string): Promise<(Bookmark & { product: Product & { user: User } })[]>;
  getBookmarkCount(productId: string): Promise<number>;

  // Vroom operations
  createVroom(userId: string, vroom: InsertVroom): Promise<Vroom>;
  getVrooms(limit?: number): Promise<Vroom[]>;
  getVroom(id: string): Promise<Vroom | undefined>;
  getVroomsByUser(userId: string): Promise<Vroom[]>;
  getTrendingVrooms(): Promise<Vroom[]>;
  followVroom(userId: string, vroomId: string): Promise<void>;
  unfollowVroom(userId: string, vroomId: string): Promise<void>;
  isVroomFollowed(userId: string, vroomId: string): Promise<boolean>;
  getVroomFollowersCount(vroomId: string): Promise<number>;
  getVroomProductsCount(vroomId: string): Promise<number>;
  getPopularVrooms(): Promise<Vroom[]>;
  getVroomStats(vroomId: string): Promise<{ followers: number; products: number }>;
  deleteVroom(vroomId: string, userId: string): Promise<void>;
  addProductToVroom(productId: string, vroomId: string): Promise<void>;
  removeProductFromVroom(productId: string, vroomId: string): Promise<void>;
  getVroomsByProduct(productId: string): Promise<Vroom[]>;
  getBookmarkedProducts(userId: string): Promise<Product[]>;
  findConversation(userId1: string, userId2: string): Promise<any>;
  createConversation(userId1: string, userId2: string): Promise<any>;

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
  isUserFollowing(followerId: string, followingId: string): Promise<boolean>;
  getFollowers(userId: string): Promise<User[]>;
  getFollowing(userId: string): Promise<User[]>;
  getFollowersCount(userId: string): Promise<number>;
  getFollowingCount(userId: string): Promise<number>;

  // Search operations
  searchUsers(query: string, excludeUserId: string): Promise<User[]>;
  searchVrooms(query: string): Promise<Vroom[]>;
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
        target: users.email,
        set: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateProfile(userId: string, profile: UpdateProfile): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...profile, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getUserProfile(userId: string): Promise<{ user: User; followers: number; following: number } | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    const followersCount = await this.getFollowersCount(userId);
    const followingCount = await this.getFollowingCount(userId);

    return {
      user,
      followers: followersCount,
      following: followingCount,
    };
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
      .where(eq(products.vroomId, vroomId))
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

  // Product interactions - Likes
  async likeProduct(userId: string, productId: string): Promise<void> {
    await db.insert(productLikes).values({ userId, productId }).onConflictDoNothing();
  }

  async unlikeProduct(userId: string, productId: string): Promise<void> {
    await db
      .delete(productLikes)
      .where(and(eq(productLikes.userId, userId), eq(productLikes.productId, productId)));
  }

  async isProductLiked(userId: string, productId: string): Promise<boolean> {
    const [like] = await db
      .select()
      .from(productLikes)
      .where(and(eq(productLikes.userId, userId), eq(productLikes.productId, productId)));
    return !!like;
  }

  // Product interactions - Comments
  async commentOnProduct(userId: string, productId: string, content: string, parentCommentId?: string): Promise<ProductComment> {
    const [comment] = await db.insert(productComments).values({ 
      userId, 
      productId, 
      content, 
      parentCommentId 
    }).returning();
    return comment;
  }

  async getProductComments(productId: string): Promise<(ProductComment & { user: User; replies: (ProductComment & { user: User })[] })[]> {
    // Get top-level comments (no parent)
    const topLevelComments = await db
      .select()
      .from(productComments)
      .leftJoin(users, eq(productComments.userId, users.id))
      .where(and(
        eq(productComments.productId, productId),
        eq(productComments.parentCommentId, null) // Only top-level comments
      ))
      .orderBy(desc(productComments.createdAt));

    // Get all replies for these comments
    const commentIds = topLevelComments.map(row => row.product_comments.id);

    let replies: any[] = [];
    if (commentIds.length > 0) {
      replies = await db
        .select()
        .from(productComments)
        .leftJoin(users, eq(productComments.userId, users.id))
        .where(inArray(productComments.parentCommentId, commentIds))
        .orderBy(productComments.createdAt); // Oldest first for replies
    }

    // Group replies by parent comment ID
    const repliesByParent = replies.reduce((acc, row) => {
      const parentId = row.product_comments.parentCommentId;
      if (!acc[parentId]) acc[parentId] = [];
      acc[parentId].push({
        ...row.product_comments,
        user: row.users
      });
      return acc;
    }, {} as Record<string, any[]>);

    // Combine comments with their replies
    return topLevelComments.map(row => ({
      ...row.product_comments,
      user: row.users,
      replies: repliesByParent[row.product_comments.id] || []
    }));
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

  // Bookmark operations
  async bookmarkProduct(userId: string, productId: string): Promise<void> {
    await db.insert(bookmarks).values({ userId, productId }).onConflictDoNothing();
  }

  async unbookmarkProduct(userId: string, productId: string): Promise<void> {
    await db
      .delete(bookmarks)
      .where(and(eq(bookmarks.userId, userId), eq(bookmarks.productId, productId)));
  }

  async isProductBookmarked(userId: string, productId: string): Promise<boolean> {
    const [bookmark] = await db
      .select()
      .from(bookmarks)
      .where(and(eq(bookmarks.userId, userId), eq(bookmarks.productId, productId)));
    return !!bookmark;
  }

  async getBookmarks(userId: string): Promise<(Bookmark & { product: Product & { user: User } })[]> {
    const result = await db
      .select({
        bookmark: bookmarks,
        product: products,
        user: users,
      })
      .from(bookmarks)
      .innerJoin(products, eq(bookmarks.productId, products.id))
      .innerJoin(users, eq(products.userId, users.id))
      .where(eq(bookmarks.userId, userId))
      .orderBy(desc(bookmarks.createdAt));

    return result.map(row => ({
      ...row.bookmark,
      product: {
        ...row.product,
        user: row.user
      }
    }));
  }

  async getBookmarkCount(productId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookmarks)
      .where(eq(bookmarks.productId, productId));

    return Number(result.count);
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

  async getTrendingVrooms(): Promise<(Vroom & { followersCount: number; productsCount: number })[]> {
    const result = await db
      .select({
        id: vrooms.id,
        userId: vrooms.userId,
        name: vrooms.name,
        description: vrooms.description,
        coverImageUrl: vrooms.coverImageUrl,
        isPublic: vrooms.isPublic,
        createdAt: vrooms.createdAt,
        updatedAt: vrooms.updatedAt,
        followersCount: sql<number>`COUNT(DISTINCT ${vroomFollows.userId})`.as("followersCount"),
        productsCount: sql<number>`COUNT(DISTINCT ${products.id})`.as("productsCount"),
      })
      .from(vrooms)
      .leftJoin(vroomFollows, eq(vrooms.id, vroomFollows.vroomId))
      .leftJoin(products, eq(vrooms.id, products.vroomId))
      .where(eq(vrooms.isPublic, true))
      .groupBy(vrooms.id)
      .orderBy(desc(sql`COUNT(DISTINCT ${vroomFollows.userId})`)) // most followed first
      .limit(10);

    return result.map((row: any) => ({
      ...row,
      followersCount: Number(row.followersCount),
      productsCount: Number(row.productsCount),
    }));
  }

  // Vroom follow operations
  async followVroom(userId: string, vroomId: string): Promise<void> {
    await db.insert(vroomFollows).values({ userId, vroomId }).onConflictDoNothing();
  }

  async unfollowVroom(userId: string, vroomId: string): Promise<void> {
    await db
      .delete(vroomFollows)
      .where(and(eq(vroomFollows.userId, userId), eq(vroomFollows.vroomId, vroomId)));
  }

  async isVroomFollowed(userId: string, vroomId: string): Promise<boolean> {
    const [follow] = await db
      .select()
      .from(vroomFollows)
      .where(and(eq(vroomFollows.userId, userId), eq(vroomFollows.vroomId, vroomId)));
    return !!follow;
  }

  async getVroomFollowersCount(vroomId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(vroomFollows)
      .where(eq(vroomFollows.vroomId, vroomId));

    return Number(result.count);
  }

  async getVroomProductsCount(vroomId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.vroomId, vroomId));

    return Number(result.count);
  }

  async getPopularVrooms(): Promise<Vroom[]> {
    return await db
      .select()
      .from(vrooms)
      .where(eq(vrooms.isPublic, true))
      .orderBy(desc(vrooms.createdAt))
      .limit(10);
  }

  async getVroomStats(vroomId: string): Promise<{ followers: number; products: number }> {
    const followers = await this.getVroomFollowersCount(vroomId);
    const products = await this.getVroomProductsCount(vroomId);
    return { followers, products };
  }

  async addProductToVroom(productId: string, vroomId: string): Promise<void> {
    await db
      .update(products)
      .set({ vroomId })
      .where(eq(products.id, productId));
  }

  async removeProductFromVroom(productId: string, vroomId: string): Promise<void> {
    await db
      .update(products)
      .set({ vroomId: null })
      .where(and(eq(products.id, productId), eq(products.vroomId, vroomId)));
  }

  async getVroomsByProduct(productId: string): Promise<Vroom[]> {
    const product = await this.getProduct(productId);
    if (!product || !product.vroomId) return [];
    
    const vroom = await this.getVroom(product.vroomId);
    return vroom ? [vroom] : [];
  }

  async getBookmarkedProducts(userId: string): Promise<Product[]> {
    const result = await db
      .select({
        id: products.id,
        userId: products.userId,
        name: products.name,
        description: products.description,
        price: products.price,
        imageUrls: products.imageUrls,
        vroomId: products.vroomId,
        hashtags: products.hashtags,
        isAvailable: products.isAvailable,
        views: products.views,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .innerJoin(bookmarks, eq(bookmarks.productId, products.id))
      .where(eq(bookmarks.userId, userId))
      .orderBy(desc(bookmarks.createdAt));
    
    return result;
  }

  async findConversation(userId1: string, userId2: string): Promise<any> {
    // Simple conversation logic - return a unique conversation ID
    const conversationId = [userId1, userId2].sort().join('_');
    return { id: conversationId, participants: [userId1, userId2] };
  }

  async createConversation(userId1: string, userId2: string): Promise<any> {
    return this.findConversation(userId1, userId2);
  }

  async deleteVroom(vroomId: string, userId: string): Promise<void> {
    // Only allow deletion if the user owns the vroom
    await db
      .delete(vrooms)
      .where(and(eq(vrooms.id, vroomId), eq(vrooms.userId, userId)));
  }

  // User follow operations
  async followUser(followerId: string, followingId: string): Promise<void> {
    await db.insert(follows).values({ followerId, followingId }).onConflictDoNothing();
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    await db
      .delete(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
  }

  async isUserFollowing(followerId: string, followingId: string): Promise<boolean> {
    const [follow] = await db
      .select()
      .from(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
    return !!follow;
  }

  async getFollowers(userId: string): Promise<User[]> {
    return await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        bannerImageUrl: users.bannerImageUrl,
        username: users.username,
        bio: users.bio,
        location: users.location,
        website: users.website,
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
        bannerImageUrl: users.bannerImageUrl,
        username: users.username,
        bio: users.bio,
        location: users.location,
        website: users.website,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(follows)
      .innerJoin(users, eq(follows.followingId, users.id))
      .where(eq(follows.followerId, userId));
  }

  async getFollowersCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(follows)
      .where(eq(follows.followingId, userId));

    return Number(result.count);
  }

  async getFollowingCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(follows)
      .where(eq(follows.followerId, userId));

    return Number(result.count);
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

  // Search operations
  async searchUsers(query: string, excludeUserId: string): Promise<User[]> {
    const searchTerm = `%${query.toLowerCase()}%`;

    return await db
      .select()
      .from(users)
      .where(
        and(
          not(eq(users.id, excludeUserId)),
          or(
            ilike(users.firstName, searchTerm),
            ilike(users.lastName, searchTerm),
            ilike(users.email, searchTerm),
            ilike(users.username, searchTerm)
          )
        )
      )
      .limit(10);
  }

  async searchVrooms(query: string): Promise<Vroom[]> {
    return await db
      .select()
      .from(vrooms)
      .where(
        and(
          eq(vrooms.isPublic, true),
          or(
            like(vrooms.name, `%${query}%`),
            like(vrooms.description, `%${query}%`)
          )
        )
      )
      .orderBy(desc(vrooms.createdAt))
      .limit(20);
  }
}

export const storage = new DatabaseStorage();