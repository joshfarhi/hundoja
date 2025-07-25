# Documentation

This directory contains all SQL files and setup guides for the Hundoja e-commerce platform.

## Directory Structure

```
docs/
├── sql/                    # Database schemas and migrations
├── guides/                 # Step-by-step setup guides
└── README.md              # This file
```

## Database (SQL Files)

### `sql/supabase-schema.sql`
Complete database schema for the e-commerce platform including:
- Product catalog and variants
- Customer management  
- Order processing and fulfillment
- Contact/support system
- Analytics and reporting
- Admin user management

### `sql/admin-user-preferences.sql`
Database migrations for admin user preferences:
- Admin user role management
- User-specific preference storage
- Demo data visibility settings
- Functions for preference management

## Setup Guides

### `guides/setup-admin-preferences.md`
Implements persistent admin preferences in the database:
- Store demo data visibility per user
- Cross-device preference synchronization
- API endpoints for preference management
- Migration from localStorage to database

### `guides/setup-real-order-management.md`
Connects checkout process to database for real order management:
- Order creation during checkout
- Database integration with Stripe payments
- Real order display in admin panel
- Customer record management

### `guides/stripe-webhook-setup.md`
Complete Stripe webhook configuration guide:
- Payment status synchronization
- Event selection and configuration
- Local development with Stripe CLI
- Production deployment steps

## Quick Start

1. **Database Setup**: Run SQL files in order:
   ```bash
   # 1. Main schema (if not already applied)
   psql -f docs/sql/supabase-schema.sql
   
   # 2. Admin preferences
   psql -f docs/sql/admin-user-preferences.sql
   ```

2. **Feature Implementation**: Follow guides in recommended order:
   - `setup-admin-preferences.md` - Admin user system
   - `setup-real-order-management.md` - Order processing
   - `stripe-webhook-setup.md` - Payment integration

## Support

Each guide includes:
- ✅ Step-by-step instructions
- ✅ Code examples and snippets  
- ✅ Troubleshooting sections
- ✅ Testing procedures
- ✅ Production deployment notes