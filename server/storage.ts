import {
  users,
  paymentRequests,
  workItems,
  influencerProfiles,
  type User,
  type UpsertUser,
  type InsertPaymentRequest,
  type PaymentRequest,
  type InsertWorkItem,
  type WorkItem,
  type InsertInfluencerProfile,
  type InfluencerProfile,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

// Interface for storage operations
export interface IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Payment Request operations
  createPaymentRequest(request: InsertPaymentRequest): Promise<PaymentRequest>;
  getPaymentRequestsByUser(userId: string): Promise<PaymentRequest[]>;
  getPaymentRequestById(id: string): Promise<PaymentRequest | undefined>;
  updatePaymentRequestStatus(id: string, status: string, adminNotes?: string): Promise<PaymentRequest>;
  
  // Work Item operations
  createWorkItem(item: InsertWorkItem): Promise<WorkItem>;
  getWorkItemsByUser(userId: string): Promise<WorkItem[]>;
  getWorkItemById(id: string): Promise<WorkItem | undefined>;
  updateWorkItemStatus(id: string, status: string): Promise<WorkItem>;
  
  // Influencer Profile operations
  createInfluencerProfile(profile: InsertInfluencerProfile): Promise<InfluencerProfile>;
  getInfluencerProfileByUser(userId: string): Promise<InfluencerProfile | undefined>;
  updateInfluencerProfile(userId: string, profile: Partial<InsertInfluencerProfile>): Promise<InfluencerProfile>;
  getAllInfluencerProfiles(): Promise<(InfluencerProfile & { user: User })[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
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

  // Payment Request operations
  async createPaymentRequest(request: InsertPaymentRequest): Promise<PaymentRequest> {
    const [paymentRequest] = await db
      .insert(paymentRequests)
      .values({ ...request, id: nanoid() })
      .returning();
    return paymentRequest;
  }

  async getPaymentRequestsByUser(userId: string): Promise<PaymentRequest[]> {
    return await db
      .select()
      .from(paymentRequests)
      .where(eq(paymentRequests.userId, userId))
      .orderBy(desc(paymentRequests.submittedAt));
  }

  async getPaymentRequestById(id: string): Promise<PaymentRequest | undefined> {
    const [request] = await db
      .select()
      .from(paymentRequests)
      .where(eq(paymentRequests.id, id));
    return request;
  }

  async updatePaymentRequestStatus(id: string, status: string, adminNotes?: string): Promise<PaymentRequest> {
    const [request] = await db
      .update(paymentRequests)
      .set({ status, adminNotes, updatedAt: new Date() })
      .where(eq(paymentRequests.id, id))
      .returning();
    return request;
  }

  // Work Item operations
  async createWorkItem(item: InsertWorkItem): Promise<WorkItem> {
    const [workItem] = await db
      .insert(workItems)
      .values({ ...item, id: nanoid() })
      .returning();
    return workItem;
  }

  async getWorkItemsByUser(userId: string): Promise<WorkItem[]> {
    return await db
      .select()
      .from(workItems)
      .where(eq(workItems.userId, userId))
      .orderBy(desc(workItems.createdAt));
  }

  async getWorkItemById(id: string): Promise<WorkItem | undefined> {
    const [item] = await db
      .select()
      .from(workItems)
      .where(eq(workItems.id, id));
    return item;
  }

  async updateWorkItemStatus(id: string, status: string): Promise<WorkItem> {
    const [item] = await db
      .update(workItems)
      .set({ status, updatedAt: new Date() })
      .where(eq(workItems.id, id))
      .returning();
    return item;
  }

  // Influencer Profile operations
  async createInfluencerProfile(profile: InsertInfluencerProfile): Promise<InfluencerProfile> {
    const [influencerProfile] = await db
      .insert(influencerProfiles)
      .values({ ...profile, id: nanoid() })
      .returning();
    return influencerProfile;
  }

  async getInfluencerProfileByUser(userId: string): Promise<InfluencerProfile | undefined> {
    const [profile] = await db
      .select()
      .from(influencerProfiles)
      .where(eq(influencerProfiles.userId, userId));
    return profile;
  }

  async updateInfluencerProfile(userId: string, profile: Partial<InsertInfluencerProfile>): Promise<InfluencerProfile> {
    const [updated] = await db
      .update(influencerProfiles)
      .set({ ...profile, updatedAt: new Date() })
      .where(eq(influencerProfiles.userId, userId))
      .returning();
    return updated;
  }

  async getAllInfluencerProfiles(): Promise<(InfluencerProfile & { user: User })[]> {
    const results = await db
      .select()
      .from(influencerProfiles)
      .leftJoin(users, eq(influencerProfiles.userId, users.id))
      .where(eq(users.role, "influencer"));
    
    return results.map(result => ({
      ...result.influencer_profiles,
      user: result.users!,
    }));
  }
}

export const storage = new DatabaseStorage();
