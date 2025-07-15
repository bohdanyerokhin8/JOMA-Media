# JOMA Media Influencer Management Platform

## Overview

This is a boutique influencer management platform built for JOMA Media, designed to connect the agency with its managed influencers and facilitate campaign collaborations. The application serves as an MVP that proves the end-to-end "match → deliver → invoice" workflow before scaling to a full digital super app.

## Recent Changes

- **Enhanced Google OAuth Authentication Flow (Jan 2025)**: Implemented proper sign-in vs sign-up validation - users must sign up first before using Google sign-in, prevents duplicate accounts, shows appropriate error messages ("Please sign up first" for sign-in attempts without account, "Account already exists" for duplicate sign-ups), separate endpoints for /auth/google/signin and /auth/google/signup
- **Admin Influencer Management System (Jan 2025)**: Built comprehensive influencer management page with simplified two-box search interface - admins can filter by search type (name, email, TikTok followers, Instagram followers, YouTube followers, primary rate, engagement rate) and search value, includes table view with social stats and detailed profile modal
- **Improved Form Validation UX (Jan 2025)**: Updated Sign In and Sign Up forms to show only one error at a time instead of all errors simultaneously - Sign In validates email → password, Sign Up validates firstName → lastName → email → password → terms for better user experience
- **Fixed Password Reset Dashboard Redirect (Jan 2025)**: Enhanced password reset flow to properly handle authentication state after password reset - added cache invalidation, authentication verification, and improved redirect timing to ensure dashboard loads correctly
- **Fixed Email Domain Configuration (Jan 2025)**: Updated email service to use custom domain (joma.violane.dev) for verification URLs instead of replit.app domain, ensuring consistent branding across all email communications
- **Forgot Password Functionality (Jan 2025)**: Implemented complete password reset workflow with SparkPost email delivery - users can request password reset via email link, includes proper token validation, password update, and automatic login
- **Enhanced Form Validation (Jan 2025)**: Fixed form validation cross-contamination between Sign In and Sign Up tabs with separate error states, improved checkbox validation to persist until user interaction
- **Standard Email Verification System (Jan 2025)**: Implemented proper email verification workflow using SparkPost - users must verify email before sign-in, includes verification links, resend functionality, and account activation
- **SparkPost Integration (Jan 2025)**: Added SparkPost email service for verification emails, welcome emails, and password reset functionality with branded email templates
- **Enhanced User Registration Flow (Jan 2025)**: Updated registration to require email verification before account activation, with proper error handling and user feedback
- **Email Verification Routes (Jan 2025)**: Added /verify-email endpoint for token-based verification and /auth/resend-verification for resending verification emails
- **Database Schema Email Fields (Jan 2025)**: Added emailVerified, emailVerificationToken, and emailVerificationExpires fields to users table
- **Dashboard System with Sidebar Navigation (Jan 2025)**: Built comprehensive dashboard system with role-based access and URL-based navigation
- **Role-Based Dashboard Routing (Jan 2025)**: Implemented separate dashboards for influencers and admins with appropriate role-based access control
- **Fixed Checkbox Validation (Jan 2025)**: Resolved account creation issue with Radix UI checkbox validation using data-state attribute
- **Cascading Delete for Admin Invites (Jan 2025)**: Implemented cascading delete functionality - when admin invite is deleted, corresponding user account is also deleted if invite was accepted
- **Complete API Routes (Jan 2025)**: Added all necessary API endpoints for payment requests, work items, profiles, and admin functionality
- **Database Schema Updates (Jan 2025)**: Enhanced schema with proper role separation and all necessary tables for full functionality
- **Public-Facing App Architecture (Jan 2025)**: Confirmed optimal setup for public access without Replit Auth requirement
- **Google OAuth with Account Selection (Jan 2025)**: Added prompt=select_account for better multi-account user experience
- **Google OAuth Authentication Complete (Jan 2025)**: Fully implemented Google OAuth 2.0 authentication with proper credential management and environment variable configuration
- **Environment Variable Configuration**: Added dotenv support for secure credential loading in development
- **Authentication System Fixed (Jan 2025)**: Resolved 401 Unauthorized errors in production by fixing session configuration
- **Modern Toast Notifications**: Implemented top-screen notifications with blue, green, red, and amber themes
- **Session Management Enhanced**: Optimized session configuration for HTTPS production environment with proper proxy trust
- **Dual Authentication System (Jan 2025)**: Implemented both email/password and Google OAuth authentication
- **Professional Landing Page**: Built dual-tab interface with sign-in/sign-up forms supporting both auth methods
- **Database Schema**: Complete data model with users, payment requests, work items, and influencer profiles
- **API Routes**: All core backend endpoints implemented with proper authentication middleware
- **Role-Based Access**: Support for influencer and admin roles with appropriate permissions

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing with role-based route protection
- **Build Tool**: Vite for development and production builds
- **Dashboard System**: Sidebar-based navigation with URL-maintained state
- **Layout Components**: Reusable dashboard layout with role-based content rendering

### Backend Architecture
- **Runtime**: Node.js with Express server
- **Language**: TypeScript with ESM modules
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Dual system (Google OAuth + Email/Password) with Passport.js
- **Session Management**: Express sessions with PostgreSQL storage

### Database Design
- **ORM**: Drizzle with PostgreSQL dialect
- **Migration Strategy**: Schema-first approach with migrations in `/migrations`
- **Connection**: Neon serverless PostgreSQL with connection pooling

## Key Components

### Authentication System
- **Provider**: Dual authentication (Google OAuth 2.0 + Email/Password)
- **Session Storage**: PostgreSQL-backed sessions using `connect-pg-simple`
- **User Roles**: Two-tier system (influencer/admin)
- **Security**: Passport.js with secure session management
- **Flow**: Users can register/login with email/password or Google OAuth

### Data Models
- **Users**: Core user information with role-based access
- **Payment Requests**: Influencer payment submissions with approval workflow
- **Work Items**: Campaign deliverables and proof of work
- **Influencer Profiles**: Detailed creator profiles with social metrics

### UI Components
- **Design System**: shadcn/ui with Radix UI primitives
- **Theme**: New York style with neutral base colors
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints
- **Accessibility**: ARIA-compliant components from Radix UI

## Data Flow

### User Authentication Flow
1. User chooses authentication method (Google OAuth or Email/Password)
2. Google OAuth: `/auth/google` → Google consent → callback → session
3. Email/Password: `/auth/login` → credential validation → session
4. User data stored/updated in PostgreSQL with provider tracking
5. Session created with role-based permissions
6. Frontend receives user context via `/api/auth/user`

### Payment Request Workflow
1. Influencer submits payment request with proof of work
2. Request stored with "pending" status
3. Admin reviews and updates status (approved/rejected/paid)
4. Status changes tracked with timestamps and admin notes

### Profile Management
1. Influencers create/update profiles with social metrics
2. Admins can search and filter influencer profiles
3. Profile data includes rates, niches, and platform statistics

## External Dependencies

### Database
- **Provider**: Neon PostgreSQL (serverless)
- **Connection**: `@neondatabase/serverless` with WebSocket support
- **Schema Management**: Drizzle Kit for migrations

### Authentication
- **Service**: Dual system (Google OAuth + Email/Password)
- **Session Store**: PostgreSQL with `connect-pg-simple`
- **Security**: Passport.js with Google Strategy and Local Strategy

### UI Libraries
- **Component Library**: shadcn/ui built on Radix UI
- **Icons**: Lucide React icons
- **Styling**: Tailwind CSS with CSS variables for theming

## Deployment Strategy

### Development
- **Server**: Express with Vite middleware for HMR
- **Database**: Drizzle push for schema synchronization
- **Environment**: NODE_ENV=development with error overlays

### Production
- **Build Process**: Vite build for frontend, esbuild for backend
- **Server**: Node.js with Express serving static files
- **Database**: Migration-based deployment with `drizzle-kit push`
- **Environment**: Production-optimized with secure session handling

### Configuration
- **Environment Variables**: DATABASE_URL, SESSION_SECRET, REPLIT_DOMAINS
- **Build Output**: Frontend to `/dist/public`, backend to `/dist/index.js`
- **Static Assets**: Served directly by Express in production

The architecture emphasizes type safety, developer experience, and scalability while maintaining the MVP scope focused on core influencer management workflows.