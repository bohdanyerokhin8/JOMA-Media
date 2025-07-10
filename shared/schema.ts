import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for authentication, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { enum: ["influencer", "admin"] }).default("influencer"),
  isActive: boolean("is_active").default(true),
  // Password-based authentication fields
  hashedPassword: varchar("hashed_password"), // For email/password users
  authProvider: varchar("auth_provider", { enum: ["email", "google"] }).default("email"), // Track auth method
  googleId: varchar("google_id"), // For Google OAuth users
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payment Request table
export const paymentRequests = pgTable("payment_requests", {
  id: varchar("id").primaryKey().notNull(),
  userId: varchar("user_id").notNull().references(() => users.id),
  campaignId: varchar("campaign_id"),
  amount: varchar("amount"),
  status: varchar("status", { enum: ["pending", "approved", "paid", "rejected"] }).default("pending"),
  invoiceUrl: varchar("invoice_url"),
  contentUrl: varchar("content_url"),
  adminNotes: text("admin_notes"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Work Items table
export const workItems = pgTable("work_items", {
  id: varchar("id").primaryKey().notNull(),
  userId: varchar("user_id").notNull().references(() => users.id),
  campaignId: varchar("campaign_id"),
  title: varchar("title").notNull(),
  description: text("description"),
  status: varchar("status", { enum: ["brief_sent", "content_submitted", "approved", "paid"] }).default("brief_sent"),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Influencer Profile table
export const influencerProfiles = pgTable("influencer_profiles", {
  id: varchar("id").primaryKey().notNull(),
  userId: varchar("user_id").notNull().references(() => users.id),
  bio: text("bio"),
  niches: text("niches").array(),
  rates: jsonb("rates"), // { post: 100, story: 50, reel: 200 }
  socialLinks: jsonb("social_links"), // { instagram: "", tiktok: "", youtube: "" }
  followers: jsonb("followers"), // { instagram: 10000, tiktok: 5000 }
  engagement: jsonb("engagement"), // { instagram: 5.2, tiktok: 8.1 }
  location: varchar("location"),
  languages: text("languages").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const upsertUserSchema = createInsertSchema(users);
export const insertPaymentRequestSchema = createInsertSchema(paymentRequests).omit({ id: true, submittedAt: true, updatedAt: true });
export const insertWorkItemSchema = createInsertSchema(workItems).omit({ id: true, createdAt: true, updatedAt: true });
export const insertInfluencerProfileSchema = createInsertSchema(influencerProfiles).omit({ id: true, createdAt: true, updatedAt: true });

// Authentication schemas
export const registerUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(["influencer", "admin"]).default("influencer"),
});

export const loginUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPaymentRequest = z.infer<typeof insertPaymentRequestSchema>;
export type PaymentRequest = typeof paymentRequests.$inferSelect;
export type InsertWorkItem = z.infer<typeof insertWorkItemSchema>;
export type WorkItem = typeof workItems.$inferSelect;
export type InsertInfluencerProfile = z.infer<typeof insertInfluencerProfileSchema>;
export type InfluencerProfile = typeof influencerProfiles.$inferSelect;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
