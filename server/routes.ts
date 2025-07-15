import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupSession, setupPassport, setupAuthRoutes } from "./googleAuth";
import { registerUser, isAuthenticated, verifyEmail, resendVerificationEmail, requestPasswordReset, resetPassword } from "./auth";
import { insertPaymentRequestSchema, insertWorkItemSchema, insertInfluencerProfileSchema, insertAdminInviteSchema, registerUserSchema } from "@shared/schema";
import { z } from "zod";
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session and passport
  setupSession(app);
  setupPassport(app);
  setupAuthRoutes(app);

  // Configure multer for file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed!'), false);
      }
    },
  });

  // Registration endpoint
  app.post('/auth/register', async (req, res) => {
    try {
      const user = await registerUser(req.body);
      res.status(201).json({ message: 'Account created successfully! Please check your email to verify your account before signing in.', user });
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

  // Email verification endpoint
  app.get('/verify-email', async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: 'Verification token is required' });
      }

      const user = await verifyEmail(token);
      
      // Log the user in after successful verification
      req.login(user, (err) => {
        if (err) {
          console.error('Login after verification failed:', err);
          return res.status(500).json({ message: 'Email verified but login failed. Please try signing in manually.' });
        }
        
        // Redirect to dashboard
        res.redirect('/dashboard');
      });
      
    } catch (error) {
      console.error("Email verification error:", error);
      const errorMessage = (error as Error).message;
      
      // For frontend handling, we'll redirect to a verification error page
      res.redirect(`/?verification=error&message=${encodeURIComponent(errorMessage)}`);
    }
  });

  // Resend verification email endpoint
  app.post('/auth/resend-verification', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      await resendVerificationEmail(email);
      res.json({ message: 'Verification email sent successfully! Please check your email.' });
      
    } catch (error) {
      console.error("Resend verification error:", error);
      const errorMessage = (error as Error).message;
      res.status(400).json({ message: errorMessage });
    }
  });

  // Password reset endpoints
  app.post('/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }
      
      await requestPasswordReset(email);
      res.json({ message: 'Password reset email sent successfully' });
    } catch (error) {
      console.error("Password reset request error:", error);
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.post('/auth/reset-password', async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ message: 'Token and password are required' });
      }
      
      if (password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long' });
      }
      
      const user = await resetPassword(token, password);
      
      // Log the user in after successful password reset
      req.login(user, (err) => {
        if (err) {
          console.error('Login after password reset failed:', err);
          return res.status(500).json({ message: 'Password reset successful but login failed. Please try signing in manually.' });
        }
        
        res.json({ message: 'Password reset successful', user });
      });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(400).json({ message: (error as Error).message });
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

  app.get('/api/admin/influencers/:userId', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { userId } = req.params;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const profile = await storage.getInfluencerProfileByUser(userId);
      res.json({ user, profile });
    } catch (error) {
      console.error("Error fetching influencer details:", error);
      res.status(500).json({ message: "Failed to fetch influencer details" });
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

  // Profile image upload route
  app.post('/api/upload-profile-image', isAuthenticated, upload.single('profileImage'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      const userId = req.user.id;
      const file = req.file;
      
      // Convert image to base64 data URL (for simplicity, in production you'd use cloud storage)
      const base64Image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      
      // Update user's profile image URL
      const updatedUser = await storage.upsertUser({
        id: userId,
        profileImageUrl: base64Image,
        updatedAt: new Date(),
      });

      res.json({ 
        message: "Profile image updated successfully",
        profileImageUrl: updatedUser.profileImageUrl
      });
    } catch (error) {
      console.error("Error uploading profile image:", error);
      res.status(500).json({ message: "Failed to upload profile image" });
    }
  });

  // Admin Invite Routes
  app.get('/api/admin/invites', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const invites = await storage.getAllAdminInvites();
      res.json(invites);
    } catch (error) {
      console.error("Error fetching admin invites:", error);
      res.status(500).json({ message: "Failed to fetch admin invites" });
    }
  });

  app.post('/api/admin/invites', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const validatedData = insertAdminInviteSchema.parse(req.body);
      
      // Check if email already exists as an invite
      const existingInvite = await storage.getAdminInviteByEmail(validatedData.email);
      if (existingInvite) {
        return res.status(409).json({ message: "An invite already exists for this email address" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(409).json({ message: "A user with this email already exists" });
      }

      const invite = await storage.createAdminInvite(validatedData);
      res.status(201).json(invite);
    } catch (error) {
      console.error("Error creating admin invite:", error);
      res.status(400).json({ message: "Failed to create admin invite" });
    }
  });

  app.delete('/api/admin/invites/:id', isAuthenticated, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      await storage.deleteAdminInvite(id);
      res.json({ message: "Admin invite deleted successfully" });
    } catch (error) {
      console.error("Error deleting admin invite:", error);
      res.status(500).json({ message: "Failed to delete admin invite" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
