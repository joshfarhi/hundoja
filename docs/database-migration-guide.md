# Database Migration Guide: Static Data to Database

This guide will help you migrate your HUNDOJA e-commerce platform from static data to fully database-driven data.

## 🎯 Overview

Your platform currently uses a mix of static data (`data/products.ts`) and database data. This migration will:
- Move all product data to the database
- Enable real-time inventory management
- Allow admin users to manage products through the dashboard
- Provide better scalability and performance

## 📋 Pre-Migration Checklist

Before starting the migration, ensure you have:

- [ ] Supabase project set up and configured
- [ ] Environment variables properly set
- [ ] Database schema created (run the main schema migrations)
- [ ] Admin user account created
- [ ] Backup of current data (if any)

## 🚀 Migration Steps

### Step 1: Run Database Migrations

1. **Add Featured Column Migration**
   ```sql
   -- Execute add-featured-column-migration.sql in your Supabase SQL editor
   ```

2. **Verify Schema**
   ```sql
   -- Check that the products table has all required columns
   SELECT column_name, data_type, is_nullable 
   FROM information_schema.columns 
   WHERE table_name = 'products' 
   ORDER BY ordinal_position;
   ```

### Step 2: Migrate Static Data

1. **Run the Migration Script**
   ```bash
   # Set your environment variables
   export NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
   export NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
   
   # Run the migration script
   node migrate-static-products.js
   ```

2. **Verify Migration**
   ```bash
   # Test the notifications system
   node test-notifications.js
   ```

### Step 3: Update Components

The following components have been updated to use database data:

- ✅ `FeaturedProducts.tsx` - Now fetches from `/api/products?featured=true`
- ✅ `ProductGrid.tsx` - Already uses database data
- ✅ `ProductDetails.tsx` - Already uses database data
- ✅ Admin products page - Now includes featured toggle

### Step 4: Test the System

1. **Test Featured Products**
   - Visit the homepage
   - Verify featured products are loading from database
   - Check that the loading states work properly

2. **Test Admin Dashboard**
   - Log in as admin
   - Go to Products page
   - Create/edit products with featured toggle
   - Verify changes appear on homepage

3. **Test API Endpoints**
   ```bash
   # Test products API
   curl "http://localhost:3000/api/products?featured=true"
   
   # Test admin products API
   curl "http://localhost:3000/api/admin/products"
   ```

## 🔧 Configuration

### Environment Variables

Ensure these are set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Database Schema

Your products table should have these columns:

```sql
CREATE TABLE products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(100) UNIQUE,
    price DECIMAL(10,2) NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    category_id UUID REFERENCES categories(id),
    images TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 📊 Data Structure Changes

### Before (Static Data)
```typescript
// data/products.ts
export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;        // Single image
  images: string[];     // Array of images
  description: string;
  category: string;     // String category name
  sizes: string[];
  colors: string[];
  featured: boolean;    // Static featured flag
}
```

### After (Database Data)
```typescript
// Database Product Interface
interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  price: number;
  stock_quantity: number;
  images: string[];     // Array of image URLs
  is_active: boolean;
  is_featured: boolean; // Database-managed featured flag
  categories: {         // Related category object
    id: string;
    slug: string;
    name: string;
  };
  created_at: string;
}
```

## 🛠️ API Endpoints

### Public API
- `GET /api/products` - Fetch products with filters
- `GET /api/products?featured=true` - Fetch featured products
- `GET /api/products?category=hoodies` - Filter by category
- `GET /api/products?search=hoodie` - Search products

### Admin API
- `GET /api/admin/products` - Fetch all products for admin
- `POST /api/admin/products` - Create new product
- `PUT /api/admin/products` - Update product
- `DELETE /api/admin/products` - Delete product

## 🎨 UI Changes

### FeaturedProducts Component
- **Before**: Used static data with `products.filter(product => product.featured)`
- **After**: Fetches from API with loading states, error handling, and real-time updates

### Admin Dashboard
- **New Feature**: Featured toggle in product creation/editing
- **Enhanced**: Product status indicators (Active/Inactive, Featured)
- **Improved**: Better form validation and error handling

## 🔍 Troubleshooting

### Common Issues

1. **Products not loading**
   - Check Supabase connection
   - Verify RLS policies
   - Check browser console for errors

2. **Featured products not showing**
   - Ensure `is_featured` column exists
   - Check that products have `is_featured = true`
   - Verify API endpoint is working

3. **Migration script fails**
   - Check environment variables
   - Verify database permissions
   - Check for duplicate products

### Debug Commands

```bash
# Check database connection
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
supabase.from('products').select('count').then(console.log);
"

# Test API endpoints
curl -X GET "http://localhost:3000/api/products?featured=true" | jq
```

## 🚀 Post-Migration

### Clean Up

1. **Remove Static Data File**
   ```bash
   # After confirming everything works, you can remove:
   rm data/products.ts
   ```

2. **Update Imports**
   - Search for any remaining imports from `@/data/products`
   - Replace with database API calls

### Performance Optimization

1. **Add Database Indexes**
   ```sql
   CREATE INDEX idx_products_is_featured ON products(is_featured);
   CREATE INDEX idx_products_category_id ON products(category_id);
   CREATE INDEX idx_products_is_active ON products(is_active);
   ```

2. **Implement Caching**
   - Consider adding Redis for caching
   - Implement client-side caching for featured products

## 📈 Benefits After Migration

- ✅ **Real-time Updates**: Products update immediately across all pages
- ✅ **Admin Control**: Full CRUD operations through admin dashboard
- ✅ **Inventory Management**: Real stock tracking and low stock alerts
- ✅ **Scalability**: Handle thousands of products efficiently
- ✅ **SEO Friendly**: Dynamic product pages with proper metadata
- ✅ **Analytics**: Track product performance and user behavior

## 🔮 Future Enhancements

- Product variants (sizes, colors)
- Product reviews and ratings
- Advanced search and filtering
- Product recommendations
- Bulk import/export functionality
- Product analytics dashboard

---

**Migration completed successfully!** 🎉

Your e-commerce platform is now fully database-driven with real-time capabilities. 