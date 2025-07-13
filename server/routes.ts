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
      res.status(201).json({ message: 'Account created successfully! You can now sign in with your email and password.', user });
    } catch (error) {
      console.error("Registration error:", error);
      
      // Return specific error message from auth logic
      const errorMessage = (error as Error).message;
      
      // Determine appropriate status code based on error type
      let statusCode = 400;
      if (errorMessage.includes("Google sign-in")) {
        statusCode = 409; // Conflict - account exists with different provider
      } else if (errorMessage.includes("already exists")) {
        statusCode = 409; // Conflict - account exists
      }
      
      res.status(statusCode).json({ message: errorMessage });
    }
  });

  // Reset password endpoint (for development/testing)
  app.post('/auth/reset-password', async (req, res) => {
    try {
      const { email, newPassword } = req.body;
      
      if (!email || !newPassword) {
        return res.status(400).json({ message: 'Email and new password are required' });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Hash the new password
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      
      // Update the user's password
      await storage.upsertUser({
        ...user,
        hashedPassword,
        updatedAt: new Date(),
      });

      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ message: 'Failed to reset password' });
    }
  });

  // Login endpoint - handled by passport in googleAuth.ts

  // Get current user endpoint - handled by passport in googleAuth.ts

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

  // Logout redirect endpoint (for direct navigation)
  app.get('/api/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
      }
      res.clearCookie('connect.sid');
      res.redirect('/');
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
  app.post('/api/profile', isAuthenticated, async (req: any, res) => {
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

  app.get('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const profile = await storage.getInfluencerProfileByUser(userId);
      res.json(profile);
    } catch (error) {
      console.error("Error fetching influencer profile:", error);
      res.status(500).json({ message: "Failed to fetch influencer profile" });
    }
  });

  app.put('/api/profile', isAuthenticated, async (req: any, res) => {
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

  app.get('/api/admin/payment-requests', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const paymentRequests = await storage.getAllPaymentRequests();
      res.json(paymentRequests);
    } catch (error) {
      console.error("Error fetching all payment requests:", error);
      res.status(500).json({ message: "Failed to fetch payment requests" });
    }
  });

  app.get('/api/admin/work-items', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const workItems = await storage.getAllWorkItems();
      res.json(workItems);
    } catch (error) {
      console.error("Error fetching all work items:", error);
      res.status(500).json({ message: "Failed to fetch work items" });
    }
  });

  app.put('/api/admin/payment-requests/:id', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const { status, adminNotes } = req.body;
      const paymentRequest = await storage.updatePaymentRequestStatus(id, status, adminNotes);
      res.json(paymentRequest);
    } catch (error) {
      console.error("Error updating payment request:", error);
      res.status(400).json({ message: "Failed to update payment request" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
