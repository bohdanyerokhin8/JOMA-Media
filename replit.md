# JOMA Media Influencer Management Platform

## Overview

This is a boutique influencer management platform built for JOMA Media, designed to connect the agency with its managed influencers and facilitate campaign collaborations. The application serves as an MVP that proves the end-to-end "match → deliver → invoice" workflow before scaling to a full digital super app.

## Recent Changes

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
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express server
- **Language**: TypeScript with ESM modules
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL storage

### Database Design
- **ORM**: Drizzle with PostgreSQL dialect
- **Migration Strategy**: Schema-first approach with migrations in `/migrations`
- **Connection**: Neon serverless PostgreSQL with connection pooling

## Key Components

### Authentication System
- **Provider**: Cloudflare Access with Google OAuth 2.0
- **Session Storage**: PostgreSQL-backed sessions using `connect-pg-simple`
- **User Roles**: Two-tier system (influencer/admin)
- **Security**: JWT-based authentication via Cloudflare Access headers
- **Flow**: Users authenticate through Cloudflare Access gateway, JWT tokens passed via headers

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
1. User initiates login via `/api/login`
2. Replit Auth handles OIDC flow
3. User data stored/updated in PostgreSQL
4. Session created with role-based permissions
5. Frontend receives user context via `/api/auth/user`

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
- **Service**: Replit Auth OIDC
- **Session Store**: PostgreSQL with `connect-pg-simple`
- **Security**: OpenID Connect with passport.js

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