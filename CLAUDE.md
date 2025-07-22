# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Environment Setup
cp .env.local.example .env.local  # Copy environment template (if exists)
```

## Architecture Overview

**Hundoja** is a Next.js 15 e-commerce application built with the App Router pattern, featuring:

- **Framework**: Next.js 15.4.2 with App Router and Turbopack for development
- **Authentication**: Clerk integration with middleware-protected routes
- **Payments**: Stripe integration with server-side payment intents
- **State Management**: React Context for cart functionality
- **UI**: Aceternity UI components, Tailwind CSS, Framer Motion animations
- **Deployment**: Configured for Vercel

### Key Architectural Patterns

1. **App Directory Structure**: Uses Next.js App Router with file-based routing
   - Dynamic routes: `products/[id]` for individual product pages
   - Grouped routes: `(auth)` for authentication-related pages
   - API routes in `app/api/` for server-side functionality

2. **Authentication Flow**: 
   - Clerk handles user management with middleware protection
   - Protected routes defined in `middleware.ts`
   - Public routes: homepage, products catalog, API webhooks

3. **Cart State Management**:
   - React Context (`contexts/CartContext.tsx`) with useReducer
   - Supports size/color variants and quantity management
   - Persistent cart state across navigation

4. **Payment Processing**:
   - Stripe integration with server-side payment intent creation
   - API route: `/api/create-payment-intent` handles secure payment setup
   - Client-side checkout form with Stripe Elements

## Important Files & Directories

- `app/layout.tsx` - Root layout with Clerk and Cart providers
- `contexts/CartContext.tsx` - Global cart state management
- `data/products.ts` - Static product data with TypeScript interfaces
- `lib/stripe.ts` - Stripe configuration and utilities
- `middleware.ts` - Clerk authentication middleware
- `components/` - Reusable UI components including cart sidebar, navigation
- `app/api/` - Server-side API routes for payments

## Environment Variables Required

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Stripe Payment Processing
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Component Architecture

- **Product Management**: Static data in `data/products.ts` with TypeScript interfaces
- **Cart System**: Context-based with reducer pattern for complex state updates
- **Authentication**: Clerk components integrated throughout with route protection
- **Payments**: Stripe Elements for secure payment processing
- **UI Components**: Mix of custom components and Aceternity UI library
- **Admin Dashboard**: Role-based access with comprehensive management interfaces

## Admin Dashboard

The application includes a full-featured admin dashboard at `/admin` with the following features:

### Access Control
- **Role-based authentication** using Clerk metadata (`role: 'admin'`)
- **Protected routes** via middleware for admin-only access
- **Automatic redirects** for unauthorized users

### Admin Features
- **Dashboard Overview**: Stats, recent orders, and key metrics
- **Orders Management**: View, edit, and track all customer orders with status updates
- **Product Catalog**: Complete CRUD operations for product management
- **Contact Requests**: Customer inquiry management with categorization and status tracking
- **Customer Management**: User profiles and order history (placeholder)
- **Analytics**: Sales reports and performance metrics (placeholder)
- **Settings**: System configuration and admin preferences (placeholder)

### Admin Components
- `components/admin/AdminSidebar.tsx` - Collapsible navigation sidebar
- `components/admin/AdminHeader.tsx` - Header with search and user info
- `app/admin/layout.tsx` - Admin-specific layout with authentication

### Setting Up Admin Access
To grant admin access to a user:
1. In Clerk Dashboard, go to the user's profile
2. Add custom metadata: `{ "role": "admin" }`
3. User will automatically see admin navigation and have access to `/admin`

## Development Notes

- Uses Turbopack for faster development builds
- TypeScript throughout with strict typing for products and cart items
- Responsive design with mobile-first approach
- Dark theme with black/white color scheme inspired by streetwear brands
- Admin dashboard uses Aceternity UI components for consistent styling