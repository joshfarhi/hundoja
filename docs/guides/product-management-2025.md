# Product Management Guide 2025

This guide covers the complete product management system in your Next.js e-commerce application, including database integration, admin interface, and best practices for 2025.

## Current Implementation Status

✅ **Your product management is already database-driven!**

- **Admin Interface**: `/admin/products` - Full CRUD operations
- **Database**: Supabase PostgreSQL with real-time subscriptions
- **Static Data**: `data/products.ts` - Demo/sample data only

## Architecture Overview

### Database-Driven Products (Current Implementation)

Your application uses a dual approach:

1. **Admin Panel** → **Supabase Database** (Production data)
2. **Frontend Display** → **Static Data** (Demo/fallback data)

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Admin Panel   │◄──►│  Supabase DB     │    │  Static Data    │
│  /admin/products│    │  - products      │    │  data/products  │
│                 │    │  - categories    │    │  (demo only)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Database Schema

Your current schema includes these key tables:

### Products Table
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT UNIQUE NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stock_quantity INTEGER DEFAULT 0,
  category_id UUID REFERENCES categories(id),
  images TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Categories Table
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  parent_id UUID REFERENCES categories(id),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Admin Interface Features

### Current Capabilities

1. **Product Management**
   - ✅ Create, Read, Update, Delete products
   - ✅ Real-time updates via Supabase subscriptions
   - ✅ Image upload support
   - ✅ Stock quantity tracking
   - ✅ Category assignment

2. **Category Management**
   - ✅ Create, Read, Update, Delete categories
   - ✅ Auto-generated slugs
   - ✅ Active/inactive status
   - ✅ Product count tracking

3. **Real-Time Features**
   - ✅ Live updates when data changes
   - ✅ Concurrent admin user support
   - ✅ Automatic UI refresh

## Connecting Frontend to Database

### Current Issue: Static vs Dynamic Data

Your frontend currently uses static data from `data/products.ts`. To make it fully database-driven:

#### Option 1: Server-Side Rendering (Recommended)
```typescript
// app/products/page.tsx
import { supabase } from '@/lib/supabase';

export default async function ProductsPage() {
  const { data: products } = await supabase
    .from('products')
    .select(`
      *,
      categories (
        name,
        slug
      )
    `)
    .eq('is_active', true);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products?.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

#### Option 2: Client-Side with Real-Time Updates
```typescript
// components/ProductGrid.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function ProductGrid() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    // Initial fetch
    fetchProducts();

    // Real-time subscription
    const channel = supabase
      .channel('products')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'products' },
        () => fetchProducts()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*, categories(name)')
      .eq('is_active', true);
    setProducts(data || []);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

## 2025 Best Practices

### 1. Product Variants Support

Extend your schema to support product variants (sizes, colors, etc.):

```sql
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL, -- e.g., "Large - Black"
  price DECIMAL(10,2),
  stock_quantity INTEGER DEFAULT 0,
  attributes JSONB DEFAULT '{}', -- {"size": "L", "color": "black"}
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Advanced Image Management

#### Multiple Images with Order
```typescript
interface ProductImage {
  id: string;
  url: string;
  alt_text: string;
  sort_order: number;
  is_primary: boolean;
}

// In your product interface
interface Product {
  id: string;
  name: string;
  images: ProductImage[];
  // ... other fields
}
```

#### Image Upload with Supabase Storage
```typescript
const uploadProductImage = async (file: File, productId: string) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${productId}/${Date.now()}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(fileName, file);

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('product-images')
    .getPublicUrl(fileName);

  return publicUrl;
};
```

### 3. Search and Filtering

#### Full-Text Search
```sql
-- Add search vector to products table
ALTER TABLE products ADD COLUMN search_vector tsvector;

-- Create search index
CREATE INDEX products_search_idx ON products USING GIN(search_vector);

-- Update trigger for search vector
CREATE OR REPLACE FUNCTION update_product_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', 
    COALESCE(NEW.name, '') || ' ' || 
    COALESCE(NEW.description, '') || ' ' ||
    COALESCE(NEW.sku, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_search_vector
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_product_search_vector();
```

#### Advanced Filtering Query
```typescript
const searchProducts = async (query: string, filters: {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}) => {
  let supabaseQuery = supabase
    .from('products')
    .select(`
      *,
      categories (name, slug)
    `)
    .eq('is_active', true);

  // Text search
  if (query) {
    supabaseQuery = supabaseQuery.textSearch('search_vector', query);
  }

  // Category filter
  if (filters.category) {
    supabaseQuery = supabaseQuery.eq('categories.slug', filters.category);
  }

  // Price range
  if (filters.minPrice) {
    supabaseQuery = supabaseQuery.gte('price', filters.minPrice);
  }
  if (filters.maxPrice) {
    supabaseQuery = supabaseQuery.lte('price', filters.maxPrice);
  }

  // Stock filter
  if (filters.inStock) {
    supabaseQuery = supabaseQuery.gt('stock_quantity', 0);
  }

  return supabaseQuery;
};
```

### 4. Inventory Management

#### Stock Tracking with Transactions
```typescript
const updateStock = async (productId: string, quantity: number, type: 'sale' | 'restock' | 'adjustment') => {
  const { data, error } = await supabase.rpc('update_product_stock', {
    product_id: productId,
    quantity_change: type === 'sale' ? -quantity : quantity,
    movement_type: type
  });

  if (error) throw error;
  return data;
};
```

#### Stock Movement Tracking
```sql
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  movement_type TEXT NOT NULL, -- 'sale', 'restock', 'adjustment'
  quantity INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  reference_id UUID, -- order_id, purchase_order_id, etc.
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 5. Performance Optimization

#### Database Indexes
```sql
-- Essential indexes for product queries
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_stock ON products(stock_quantity);
CREATE INDEX idx_products_created ON products(created_at DESC);

-- Composite indexes for common query patterns
CREATE INDEX idx_products_active_category ON products(is_active, category_id);
CREATE INDEX idx_products_search_price ON products(is_active, price) WHERE is_active = true;
```

#### Caching Strategy
```typescript
// Redis cache for frequently accessed products
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const getCachedProducts = async (key: string) => {
  const cached = await redis.get(key);
  if (cached) return cached;

  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true);

  await redis.setex(key, 300, JSON.stringify(data)); // 5 minutes
  return data;
};
```

## Product Import/Export

### Bulk Import from CSV
```typescript
const importProductsFromCSV = async (csvData: string) => {
  const products = parseCSV(csvData);
  
  const { data, error } = await supabase
    .from('products')
    .insert(products.map(product => ({
      name: product.name,
      description: product.description,
      sku: product.sku,
      price: parseFloat(product.price),
      stock_quantity: parseInt(product.stock_quantity),
      category_id: product.category_id,
      is_active: product.is_active === 'true'
    })));

  if (error) throw error;
  return data;
};
```

### Export to CSV
```typescript
const exportProductsToCSV = async () => {
  const { data: products } = await supabase
    .from('products')
    .select(`
      name,
      description,
      sku,
      price,
      stock_quantity,
      categories(name),
      is_active,
      created_at
    `);

  const csv = products?.map(p => ({
    Name: p.name,
    Description: p.description,
    SKU: p.sku,
    Price: p.price,
    Stock: p.stock_quantity,
    Category: p.categories?.name,
    Active: p.is_active,
    Created: p.created_at
  }));

  return convertToCSV(csv);
};
```

## API Endpoints (2025 Standards)

### RESTful Product API
```typescript
// app/api/products/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const search = searchParams.get('search');
  const category = searchParams.get('category');

  let query = supabase
    .from('products')
    .select(`
      id,
      name,
      description,
      sku,
      price,
      stock_quantity,
      images,
      categories (
        id,
        name,
        slug
      )
    `, { count: 'exact' })
    .eq('is_active', true)
    .range((page - 1) * limit, page * limit - 1);

  if (search) {
    query = query.textSearch('search_vector', search);
  }

  if (category) {
    query = query.eq('categories.slug', category);
  }

  const { data, error, count } = await query;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({
    products: data,
    pagination: {
      page,
      limit,
      total: count,
      pages: Math.ceil((count || 0) / limit)
    }
  });
}
```

### Product Validation
```typescript
import { z } from 'zod';

const ProductSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  sku: z.string().min(1).max(100),
  price: z.number().positive(),
  stock_quantity: z.number().int().min(0),
  category_id: z.string().uuid(),
  images: z.array(z.string().url()).default([]),
  is_active: z.boolean().default(true)
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = ProductSchema.parse(body);

    const { data, error } = await supabase
      .from('products')
      .insert([validatedData])
      .select()
      .single();

    if (error) throw error;

    return Response.json(data, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.errors }, { status: 400 });
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

## Security Best Practices

### Row Level Security (RLS)
```sql
-- Enable RLS on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Public read access for active products
CREATE POLICY "Public read access" ON products
  FOR SELECT USING (is_active = true);

-- Admin full access
CREATE POLICY "Admin full access" ON products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE clerk_user_id = auth.jwt() ->> 'sub'
      AND is_active = true
    )
  );
```

### API Rate Limiting
```typescript
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 h'), // 100 requests per hour
});

export async function GET(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'anonymous';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return Response.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  // Continue with product logic...
}
```

## Migration from Static to Dynamic

If you want to fully migrate from static data to database:

### 1. Seed Database with Current Static Data
```typescript
// scripts/seed-products.ts
import { products as staticProducts } from '../data/products';
import { supabase } from '../lib/supabase';

const migrateStaticProducts = async () => {
  for (const product of staticProducts) {
    const { error } = await supabase
      .from('products')
      .insert({
        name: product.name,
        description: product.description,
        sku: product.id, // Use ID as SKU temporarily
        price: product.price,
        stock_quantity: 10, // Default stock
        images: product.images,
        is_active: true
      });

    if (error) console.error('Error inserting:', product.name, error);
  }
};
```

### 2. Update Frontend Components
```typescript
// components/ProductCard.tsx - Updated for database schema
interface DatabaseProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  stock_quantity: number;
  categories: { name: string; slug: string };
}

export default function ProductCard({ product }: { product: DatabaseProduct }) {
  return (
    <div className="product-card">
      <Image 
        src={product.images[0]} 
        alt={product.name}
        width={300}
        height={300}
      />
      <h3>{product.name}</h3>
      <p className="text-sm text-neutral-600">{product.categories.name}</p>
      <p className="font-bold">${product.price}</p>
      {product.stock_quantity > 0 ? (
        <span className="text-green-600">In Stock</span>
      ) : (
        <span className="text-red-600">Out of Stock</span>
      )}
    </div>
  );
}
```

## Monitoring and Analytics

### Product Performance Tracking
```sql
CREATE TABLE product_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  metric_type TEXT NOT NULL, -- 'view', 'add_to_cart', 'purchase'
  value INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Daily aggregation view
CREATE MATERIALIZED VIEW daily_product_metrics AS
SELECT 
  product_id,
  DATE(created_at) as date,
  metric_type,
  SUM(value) as total_count
FROM product_analytics
GROUP BY product_id, DATE(created_at), metric_type;
```

### Real-Time Stock Alerts
```typescript
const checkLowStock = async () => {
  const { data: lowStockProducts } = await supabase
    .from('products')
    .select('id, name, stock_quantity')
    .lte('stock_quantity', 5)
    .eq('is_active', true);

  if (lowStockProducts?.length) {
    // Send alerts to admin
    await sendLowStockAlert(lowStockProducts);
  }
};
```

## Your Current Setup Summary

✅ **What's Working:**
- Database-driven admin panel
- Real-time updates via Supabase subscriptions
- Full CRUD operations for products and categories
- Proper database schema with relationships

🔄 **Recommended Next Steps:**
1. Connect frontend product display to database (replace static data)
2. Add product variants support
3. Implement advanced search and filtering
4. Add comprehensive inventory management
5. Set up product analytics tracking

Your product management system is already modern and database-driven! The admin interface is fully functional with real-time capabilities. The main opportunity is connecting your frontend product display to the database instead of using static data.