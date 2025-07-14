import express from "express";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { registerUserSchema, loginUserSchema } from "@shared/schema";
import { nanoid } from "nanoid";
import { emailService, generateVerificationToken, getVerificationTokenExpiry, isVerificationTokenExpired, generatePasswordResetToken, getPasswordResetTokenExpiry, isPasswordResetTokenExpired } from "./emailService";

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

  // Hash password
  const hashedPassword = await bcrypt.hash(validatedData.password, 12);

  // Create user with email verification required
  const user = await storage.createUser({
    email: validatedData.email,
    firstName: validatedData.firstName,
    lastName: validatedData.lastName,
    role: userRole,
    hashedPassword,
    authProvider: "email",
    googleId: null,
    profileImageUrl: null,
    isActive: false, // Set to false until email is verified
    emailVerified: false, // Set to false until email is verified
  });

  // Generate verification token and send email
  const verificationToken = generateVerificationToken();
  const expiresAt = getVerificationTokenExpiry();
  
  await storage.updateEmailVerificationToken(user.id, verificationToken, expiresAt);

  // Send verification email
  try {
    // Handle REPLIT_DOMAINS which might contain multiple domains separated by commas
    const domains = process.env.REPLIT_DOMAINS;
    const primaryDomain = domains ? domains.split(',')[0].trim() : null;
    const baseUrl = primaryDomain ? `https://${primaryDomain}` : 'http://localhost:5000';
    
    console.log('Sending verification email with baseUrl:', baseUrl);
    
    await emailService.sendVerificationEmail({
      email: user.email!,
      firstName: user.firstName!,
      verificationToken,
      baseUrl,
    });
  } catch (error) {
    console.error('Failed to send verification email:', error);
    // Continue with registration but log the error
  }

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

  // Check if email is verified
  if (!user.emailVerified) {
    throw new Error("Please verify your email address before signing in. Check your email for the verification link.");
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
  const domains = process.env.REPLIT_DOMAINS;
  const primaryDomain = domains ? domains.split(',')[0].trim() : null;
  const baseUrl = primaryDomain ? `https://${primaryDomain}` : 'http://localhost:5000';
  
  console.log('Sending resend verification email with baseUrl:', baseUrl);
  
  await emailService.sendVerificationEmail({
    email: user.email!,
    firstName: user.firstName!,
    verificationToken,
    baseUrl,
  });
}

// Password Reset Functions
export async function requestPasswordReset(email: string): Promise<void> {
  const user = await storage.getUserByEmail(email);
  
  if (!user) {
    throw new Error("No account found with this email address.");
  }

  if (user.authProvider !== "email") {
    throw new Error("This account uses Google sign-in. Please use the 'Sign in with Google' button.");
  }

  // Generate password reset token
  const resetToken = generatePasswordResetToken();
  const expiresAt = getPasswordResetTokenExpiry();
  
  await storage.updatePasswordResetToken(user.id, resetToken, expiresAt);

  // Send password reset email
  const domains = process.env.REPLIT_DOMAINS;
  const primaryDomain = domains ? domains.split(',')[0].trim() : null;
  const baseUrl = primaryDomain ? `https://${primaryDomain}` : 'http://localhost:5000';
  
  console.log('Sending password reset email with baseUrl:', baseUrl);
  
  await emailService.sendPasswordResetEmail(user.email!, user.firstName!, resetToken, baseUrl);
}

export async function resetPassword(token: string, newPassword: string): Promise<AuthUser> {
  const user = await storage.getUserByPasswordResetToken(token);
  
  if (!user) {
    throw new Error("Invalid or expired password reset token.");
  }

  if (!user.passwordResetExpires || isPasswordResetTokenExpired(user.passwordResetExpires)) {
    throw new Error("Password reset token has expired. Please request a new one.");
  }

  // Hash the new password
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  
  // Update user's password and clear reset token
  const updatedUser = await storage.updatePassword(user.id, hashedPassword);

  return {
    id: updatedUser.id,
    email: updatedUser.email!,
    firstName: updatedUser.firstName!,
    lastName: updatedUser.lastName!,
    role: updatedUser.role!,
    authProvider: updatedUser.authProvider!,
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