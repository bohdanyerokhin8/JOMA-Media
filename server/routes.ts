import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupSession, setupPassport, setupAuthRoutes } from "./googleAuth";
import { registerUser, isAuthenticated } from "./auth";
import { insertPaymentRequestSchema, insertWorkItemSchema, insertInfluencerProfileSchema, registerUserSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session and passport
  setupSession(app);
  setupPassport(app);
  setupAuthRoutes(app);

  // Registration endpoint
  app.post('/auth/register', async (req, res) => {
    try {
      const user = await registerUser(req.body);
      res.status(201).json({ message: 'User registered successfully', user });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: (error as Error).message });
    }
  });

  // Login endpoint
  app.post('/auth/login', async (req, res) => {
    try {
      const { loginUser } = await import('./auth');
      const user = await loginUser(req.body);
      
      // Set up session
      req.session.user = user;
      
      res.json({ message: 'Login successful', user });
    } catch (error) {
      console.error("Login error:", error);
      res.status(401).json({ message: (error as Error).message });
    }
  });

  // Get current user endpoint
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Logout endpoint
  app.post('/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.clearCookie('connect.sid');
      res.json({ message: 'Logged out successfully' });
    });
  });

  // Payment Request routes
  app.post('/api/payment-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const requestData = insertPaymentRequestSchema.parse({ ...req.body, userId });
      const paymentRequest = await storage.createPaymentRequest(requestData);
      res.json(paymentRequest);
    } catch (error) {
      console.error("Error creating payment request:", error);
      res.status(400).json({ message: "Failed to create payment request" });
    }
  });

  app.get('/api/payment-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const paymentRequests = await storage.getPaymentRequestsByUser(userId);
      res.json(paymentRequests);
    } catch (error) {
      console.error("Error fetching payment requests:", error);
      res.status(500).json({ message: "Failed to fetch payment requests" });
    }
  });

  app.patch('/api/payment-requests/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;
      
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const paymentRequest = await storage.updatePaymentRequestStatus(id, status, adminNotes);
      res.json(paymentRequest);
    } catch (error) {
      console.error("Error updating payment request status:", error);
      res.status(400).json({ message: "Failed to update payment request status" });
    }
  });

  // Work Item routes
  app.post('/api/work-items', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const itemData = insertWorkItemSchema.parse({ ...req.body, userId });
      const workItem = await storage.createWorkItem(itemData);
      res.json(workItem);
    } catch (error) {
      console.error("Error creating work item:", error);
      res.status(400).json({ message: "Failed to create work item" });
    }
  });

  app.get('/api/work-items', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const workItems = await storage.getWorkItemsByUser(userId);
      res.json(workItems);
    } catch (error) {
      console.error("Error fetching work items:", error);
      res.status(500).json({ message: "Failed to fetch work items" });
    }
  });

  app.patch('/api/work-items/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const workItem = await storage.updateWorkItemStatus(id, status);
      res.json(workItem);
    } catch (error) {
      console.error("Error updating work item status:", error);
      res.status(400).json({ message: "Failed to update work item status" });
    }
  });

  // Influencer Profile routes
  app.post('/api/influencer-profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const profileData = insertInfluencerProfileSchema.parse({ ...req.body, userId });
      const profile = await storage.createInfluencerProfile(profileData);
      res.json(profile);
    } catch (error) {
      console.error("Error creating influencer profile:", error);
      res.status(400).json({ message: "Failed to create influencer profile" });
    }
  });

  app.get('/api/influencer-profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const profile = await storage.getInfluencerProfileByUser(userId);
      res.json(profile);
    } catch (error) {
      console.error("Error fetching influencer profile:", error);
      res.status(500).json({ message: "Failed to fetch influencer profile" });
    }
  });

  app.patch('/api/influencer-profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const profile = await storage.updateInfluencerProfile(userId, req.body);
      res.json(profile);
    } catch (error) {
      console.error("Error updating influencer profile:", error);
      res.status(400).json({ message: "Failed to update influencer profile" });
    }
  });

  // Admin routes
  app.get('/api/admin/influencers', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const influencers = await storage.getAllInfluencerProfiles();
      res.json(influencers);
    } catch (error) {
      console.error("Error fetching influencers:", error);
      res.status(500).json({ message: "Failed to fetch influencers" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
