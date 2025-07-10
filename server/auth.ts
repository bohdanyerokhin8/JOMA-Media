import express from "express";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { registerUserSchema, loginUserSchema } from "@shared/schema";
import { nanoid } from "nanoid";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "influencer" | "admin";
  authProvider: "email" | "google";
}

// Email/Password Authentication
export async function registerUser(userData: any): Promise<AuthUser> {
  const validatedData = registerUserSchema.parse(userData);
  
  // Check if user already exists
  const existingUser = await storage.getUserByEmail(validatedData.email);
  if (existingUser) {
    if (existingUser.authProvider === "google") {
      throw new Error("An account with this email already exists using Google sign-in. Please use the 'Sign in with Google' button to access your account.");
    } else {
      throw new Error("An account with this email already exists. Please sign in instead or use a different email address.");
    }
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(validatedData.password, 12);

  // Create user
  const user = await storage.createUser({
    email: validatedData.email,
    firstName: validatedData.firstName,
    lastName: validatedData.lastName,
    role: validatedData.role || "influencer",
    hashedPassword,
    authProvider: "email",
    googleId: null,
    profileImageUrl: null,
    isActive: true,
  });

  return {
    id: user.id,
    email: user.email!,
    firstName: user.firstName!,
    lastName: user.lastName!,
    role: user.role!,
    authProvider: user.authProvider!,
  };
}

export async function loginUser(credentials: any): Promise<AuthUser> {
  const validatedData = loginUserSchema.parse(credentials);
  
  // Find user by email
  const user = await storage.getUserByEmail(validatedData.email);
  if (!user) {
    throw new Error("No account found with this email address. Please check your email or create a new account.");
  }

  // Check if user registered with Google OAuth (no password)
  if (!user.hashedPassword && user.authProvider === "google") {
    throw new Error("This account was created with Google sign-in. Please use the 'Sign in with Google' button instead.");
  }

  // Check if user has password but it's null (shouldn't happen but safety check)
  if (!user.hashedPassword) {
    throw new Error("Password authentication is not set up for this account. Please contact support.");
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(validatedData.password, user.hashedPassword);
  if (!isValidPassword) {
    throw new Error("Incorrect password. Please check your password and try again.");
  }

  if (!user.isActive) {
    throw new Error("Your account has been deactivated. Please contact support to reactivate your account.");
  }

  return {
    id: user.id,
    email: user.email!,
    firstName: user.firstName!,
    lastName: user.lastName!,
    role: user.role!,
    authProvider: user.authProvider!,
  };
}

// Google OAuth Authentication
export async function handleGoogleOAuth(googleProfile: any): Promise<AuthUser> {
  const { sub: googleId, email, given_name: firstName, family_name: lastName, picture: profileImageUrl } = googleProfile;
  
  // Check if user exists by Google ID
  let user = await storage.getUserByEmail(email);
  
  if (user) {
    // Update existing user with Google info if needed
    if (user.authProvider === "email") {
      // User registered with email/password, now linking Google
      user = await storage.upsertUser({
        ...user,
        googleId,
        authProvider: "google",
        profileImageUrl: profileImageUrl || user.profileImageUrl,
        updatedAt: new Date(),
      });
    }
  } else {
    // Create new user from Google profile
    user = await storage.createUser({
      email,
      firstName: firstName || "",
      lastName: lastName || "",
      role: "influencer",
      hashedPassword: null,
      authProvider: "google",
      googleId,
      profileImageUrl,
      isActive: true,
    });
  }

  return {
    id: user.id,
    email: user.email!,
    firstName: user.firstName!,
    lastName: user.lastName!,
    role: user.role!,
    authProvider: user.authProvider!,
  };
}

// Session management
export function createSessionUser(user: AuthUser): any {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    authProvider: user.authProvider,
  };
}

export function isAuthenticated(req: any, res: express.Response, next: express.NextFunction) {
  if (req.session && req.session.user) {
    req.user = req.session.user;
    return next();
  }
  
  res.status(401).json({ message: "Unauthorized" });
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}