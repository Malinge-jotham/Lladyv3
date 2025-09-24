import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  integer,
  boolean,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  password: varchar("password"), // For email/password authentication
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  bannerImageUrl: varchar("banner_image_url"),
  username: varchar("username").unique(),
  bio: text("bio"),
  location: varchar("location"),
  website: varchar("website"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Vrooms (user product galleries)
export const vrooms = pgTable("vrooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  description: text("description"),
  coverImageUrl: varchar("cover_image_url"),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Products
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  vroomId: varchar("vroom_id").references(() => vrooms.id, { onDelete: "set null" }),
  name: varchar("name").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrls: text("image_urls").array(),
  hashtags: text("hashtags").array(),
  isAvailable: boolean("is_available").default(true),
  views: integer("views").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Product likes
export const productLikes = pgTable("product_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Product comments
export const productComments = pgTable("product_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  parentCommentId: varchar("parent_comment_id"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Product shares
export const productShares = pgTable("product_shares", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Cart items
export const cartItems = pgTable("cart_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  quantity: integer("quantity").default(1),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueUserProduct: unique().on(table.userId, table.productId),
}));

// Orders
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  buyerId: varchar("buyer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sellerId: varchar("seller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  quantity: integer("quantity").default(1),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status").default("pending"), // pending, confirmed, shipped, delivered, cancelled
  shippingAddress: jsonb("shipping_address").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User follows
export const follows = pgTable("follows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  followerId: varchar("follower_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  followingId: varchar("following_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Vroom follows
export const vroomFollows = pgTable("vroom_follows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  vroomId: varchar("vroom_id").notNull().references(() => vrooms.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Conversations for better message organization
export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user1Id: varchar("user1_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  user2Id: varchar("user2_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  lastMessageId: varchar("last_message_id").references(() => messages.id, { onDelete: "set null" }),
  unreadCount: integer("unread_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueConversation: unique().on(table.user1Id, table.user2Id),
}));

// Messages with enhanced privacy controls
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  receiverId: varchar("receiver_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  conversationId: varchar("conversation_id").references(() => conversations.id, { onDelete: "cascade" }),
  orderId: varchar("order_id").references(() => orders.id, { onDelete: "set null" }),
  content: text("content").notNull(),
  messageType: varchar("message_type").default("direct_message"), // 'direct_message', 'order_notification', 'order_confirmation', 'system'
  isRead: boolean("is_read").default(false),
  isPrivate: boolean("is_private").default(true),
  metadata: jsonb("metadata"), // For additional message data
  createdAt: timestamp("created_at").defaultNow(),
});

// Product bookmarks
export const bookmarks = pgTable("bookmarks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueUserProduct: unique().on(table.userId, table.productId),
}));

// Image bucket for uploaded images
export const imageBucket = pgTable("image_bucket", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  filename: varchar("filename").notNull(),
  originalName: varchar("original_name").notNull(),
  mimeType: varchar("mime_type").notNull(),
  fileSize: integer("file_size").notNull(),
  imageUrl: varchar("image_url").notNull(),
  bucketPath: varchar("bucket_path").notNull(),
  isPublic: boolean("is_public").default(false),
  width: integer("width"),
  height: integer("height"),
  description: text("description"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  products: many(products),
  vrooms: many(vrooms),
  cartItems: many(cartItems),
  orders: many(orders),
  sentMessages: many(messages, { relationName: "sender" }),
  receivedMessages: many(messages, { relationName: "receiver" }),
  productLikes: many(productLikes),
  productComments: many(productComments),
  following: many(follows, { relationName: "follower" }),
  followers: many(follows, { relationName: "following" }),
  vroomFollows: many(vroomFollows),
  images: many(imageBucket),
  conversations1: many(conversations, { relationName: "user1" }),
  conversations2: many(conversations, { relationName: "user2" }),
}));

export const vromsRelations = relations(vrooms, ({ one, many }) => ({
  user: one(users, {
    fields: [vrooms.userId],
    references: [users.id],
  }),
  products: many(products),
  followers: many(vroomFollows),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  user: one(users, {
    fields: [products.userId],
    references: [users.id],
  }),
  vroom: one(vrooms, {
    fields: [products.vroomId],
    references: [vrooms.id],
  }),
  likes: many(productLikes),
  comments: many(productComments),
  shares: many(productShares),
  cartItems: many(cartItems),
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  buyer: one(users, {
    fields: [orders.buyerId],
    references: [users.id],
    relationName: "buyer",
  }),
  seller: one(users, {
    fields: [orders.sellerId],
    references: [users.id],
    relationName: "seller",
  }),
  product: one(products, {
    fields: [orders.productId],
    references: [products.id],
  }),
  messages: many(messages),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user1: one(users, {
    fields: [conversations.user1Id],
    references: [users.id],
    relationName: "user1",
  }),
  user2: one(users, {
    fields: [conversations.user2Id],
    references: [users.id],
    relationName: "user2",
  }),
  lastMessage: one(messages, {
    fields: [conversations.lastMessageId],
    references: [messages.id],
  }),
  messages: many(messages),
}));

export const productCommentsRelations = relations(productComments, ({ one, many }) => ({
  user: one(users, {
    fields: [productComments.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [productComments.productId],
    references: [products.id],
  }),
  parentComment: one(productComments, {
    fields: [productComments.parentCommentId],
    references: [productComments.id],
    relationName: "parent",
  }),
  replies: many(productComments, {
    relationName: "parent",
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sender",
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
    relationName: "receiver",
  }),
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  order: one(orders, {
    fields: [messages.orderId],
    references: [orders.id],
  }),
}));

export const imageBucketRelations = relations(imageBucket, ({ one }) => ({
  user: one(users, {
    fields: [imageBucket.userId],
    references: [users.id],
  }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  bannerImageUrl: true,
  username: true,
  bio: true,
  location: true,
  website: true,
});

export const updateProfileSchema = createInsertSchema(users).pick({
  firstName: true,
  lastName: true,
  bio: true,
  location: true,
  profileImageUrl: true,
  bannerImageUrl: true,
});

export const insertVroomSchema = createInsertSchema(vrooms).pick({
  name: true,
  description: true,
  coverImageUrl: true,
  isPublic: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  userId: true,
  isAvailable: true,
  views: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  price: z.union([z.string(), z.number()]).transform((val) => String(val)),
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  sellerId: true,
  productId: true,
  quantity: true,
  totalAmount: true,
  shippingAddress: true,
}).extend({
  totalAmount: z.union([z.string(), z.number()]).transform((val) => String(val)),
});

export const insertConversationSchema = createInsertSchema(conversations).pick({
  user1Id: true,
  user2Id: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  receiverId: true,
  conversationId: true,
  orderId: true,
  content: true,
  messageType: true,
  metadata: true,
}).extend({
  content: z.string()
    .min(1, "Message content cannot be empty")
    .max(1000, "Message content cannot exceed 1000 characters")
    .trim(),
  receiverId: z.string().min(1, "Receiver ID is required"),
  messageType: z.enum(['direct_message', 'order_notification', 'order_confirmation', 'system']).default('direct_message'),
  conversationId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export const insertProductCommentSchema = createInsertSchema(productComments).pick({
  productId: true,
  parentCommentId: true,
  content: true,
});

export const insertImageBucketSchema = createInsertSchema(imageBucket).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  filename: z.string().min(1, "Filename is required"),
  originalName: z.string().min(1, "Original name is required"),
  mimeType: z.string().min(1, "MIME type is required"),
  fileSize: z.number().int().positive("File size must be a positive integer"),
  imageUrl: z.string().url("Must be a valid URL"),
  bucketPath: z.string().min(1, "Bucket path is required"),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
export type InsertVroom = z.infer<typeof insertVroomSchema>;
export type Vroom = typeof vrooms.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertProductComment = z.infer<typeof insertProductCommentSchema>;
export type ProductComment = typeof productComments.$inferSelect;
export type InsertImageBucket = z.infer<typeof insertImageBucketSchema>;
export type ImageBucket = typeof imageBucket.$inferSelect;
export type CartItem = typeof cartItems.$inferSelect;
export type Bookmark = typeof bookmarks.$inferSelect;
export type InsertBookmark = typeof bookmarks.$inferInsert;
export type MessageType = 'direct_message' | 'order_notification' | 'order_confirmation' | 'system';