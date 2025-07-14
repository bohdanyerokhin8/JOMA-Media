import express from "express";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { registerUserSchema, loginUserSchema } from "@shared/schema";
import { nanoid } from "nanoid";
import { emailService, generateVerificationToken, getVerificationTokenExpiry, isVerificationTokenExpired } from "./emailService";

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

  // Check for admin invite
  const adminInvite = await storage.getAdminInviteByEmail(validatedData.email);
  let userRole = validatedData.role || "influencer";
  
  if (adminInvite) {
    // If email exists in admin invites, allow signup with admin role
    userRole = "admin";
  }

  // Check if email exists using SparkPost - MUST pass before creating account
  const emailExists = await emailService.checkEmailExists(validatedData.email);
  if (!emailExists) {
    throw new Error("This email address is not verified or does not exist. Please use a valid email address.");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(validatedData.password, 12);

  // Create user (no email verification required for sign-in)
  const user = await storage.createUser({
    email: validatedData.email,
    firstName: validatedData.firstName,
    lastName: validatedData.lastName,
    role: userRole,
    hashedPassword,
    authProvider: "email",
    googleId: null,
    profileImageUrl: null,
    isActive: true, // Set to true since we don't require email verification for sign-in
    emailVerified: true, // Set to true since we don't require email verification for sign-in
  });

  // If this was an admin invite, update the invite status
  if (adminInvite && userRole === "admin") {
    await storage.updateAdminInviteStatus(adminInvite.id, "accepted");
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

// Email verification functions
export async function verifyEmail(token: string): Promise<AuthUser> {
  const user = await storage.getUserByVerificationToken(token);
  
  if (!user) {
    throw new Error("Invalid verification token. Please request a new verification email.");
  }

  // Check if token is expired
  if (user.emailVerificationExpires && isVerificationTokenExpired(user.emailVerificationExpires)) {
    throw new Error("Verification link has expired. Please request a new verification email.");
  }

  // Mark email as verified and activate the account
  const verifiedUser = await storage.markEmailAsVerified(user.id);
  
  // Update user to be active
  await storage.upsertUser({
    id: user.id,
    email: user.email!,
    firstName: user.firstName!,
    lastName: user.lastName!,
    role: user.role!,
    authProvider: user.authProvider!,
    isActive: true,
  });

  // Send welcome email
  try {
    await emailService.sendWelcomeEmail(user.email!, user.firstName!);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }

  return {
    id: verifiedUser.id,
    email: verifiedUser.email!,
    firstName: verifiedUser.firstName!,
    lastName: verifiedUser.lastName!,
    role: verifiedUser.role!,
    authProvider: verifiedUser.authProvider!,
  };
}

export async function resendVerificationEmail(email: string): Promise<void> {
  const user = await storage.getUserByEmail(email);
  
  if (!user) {
    throw new Error("No account found with this email address.");
  }

  if (user.emailVerified) {
    throw new Error("Email address is already verified.");
  }

  // Generate new verification token
  const verificationToken = generateVerificationToken();
  const expiresAt = getVerificationTokenExpiry();
  
  await storage.updateEmailVerificationToken(user.id, verificationToken, expiresAt);

  // Send verification email
  const baseUrl = process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS}` : 'http://localhost:5000';
  await emailService.sendVerificationEmail({
    email: user.email!,
    firstName: user.firstName!,
    verificationToken,
    baseUrl,
  });
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
      emailVerified: true, // Google accounts are pre-verified
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
  if (req.user) {
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