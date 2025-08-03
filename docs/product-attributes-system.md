# Product Attributes System

This document describes the product attributes system that allows editing and managing product sizes and colors in the HUNDOJA e-commerce platform.

## 🎯 Overview

The product attributes system provides:
- **Editable Sizes**: Array of available sizes for each product
- **Editable Colors**: Array of available colors for each product
- **Admin Interface**: Easy-to-use form controls for managing attributes
- **Database Storage**: Efficient storage using PostgreSQL arrays
- **API Integration**: Full CRUD operations for attributes

## 📊 Database Schema

### Products Table Structure

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
    sizes TEXT[] DEFAULT '{}',        -- Array of available sizes
    colors TEXT[] DEFAULT '{}',       -- Array of available colors
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Database Functions

#### Get Unique Attributes
```sql
CREATE OR REPLACE FUNCTION get_unique_product_attributes()
RETURNS TABLE (
    unique_sizes TEXT[],
    unique_colors TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ARRAY(
            SELECT DISTINCT unnest(sizes) 
            FROM products 
            WHERE sizes IS NOT NULL AND array_length(sizes, 1) > 0
            ORDER BY unnest(sizes)
        ) as unique_sizes,
        ARRAY(
            SELECT DISTINCT unnest(colors) 
            FROM products 
            WHERE colors IS NOT NULL AND array_length(colors, 1) > 0
            ORDER BY unnest(colors)
        ) as unique_colors;
END;
$$ LANGUAGE plpgsql;
```

#### Search by Attributes
```sql
CREATE OR REPLACE FUNCTION search_products_by_attributes(
    search_sizes TEXT[] DEFAULT NULL,
    search_colors TEXT[] DEFAULT NULL,
    search_featured BOOLEAN DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    description TEXT,
    price DECIMAL(10,2),
    stock_quantity INTEGER,
    images TEXT[],
    is_active BOOLEAN,
    is_featured BOOLEAN,
    sizes TEXT[],
    colors TEXT[],
    categories JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.stock_quantity,
        p.images,
        p.is_active,
        p.is_featured,
        p.sizes,
        p.colors,
        jsonb_build_object(
            'id', c.id,
            'name', c.name,
            'slug', c.slug
        ) as categories
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.is_active = true
    AND (search_featured IS NULL OR p.is_featured = search_featured)
    AND (search_sizes IS NULL OR p.sizes && search_sizes)
    AND (search_colors IS NULL OR p.colors && search_colors)
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;
```

## 🛠️ API Endpoints

### Get Product Attributes
```http
GET /api/admin/product-attributes
```

**Response:**
```json
{
  "sizes": ["S", "M", "L", "XL", "XXL"],
  "colors": ["Black", "White", "Red", "Blue", "Green"]
}
```

### Update Product with Attributes
```http
PUT /api/admin/products
```

**Request Body:**
```json
{
  "id": "product-uuid",
  "name": "Product Name",
  "sizes": ["S", "M", "L", "XL"],
  "colors": ["Black", "White"],
  "is_featured": true
}
```

## 🎨 Admin Interface

### Product Form Features

1. **Sizes Input**
   - Comma-separated text input
   - Real-time tag display
   - Individual tag removal
   - Visual feedback

2. **Colors Input**
   - Comma-separated text input
   - Real-time tag display
   - Individual tag removal
   - Visual feedback

3. **View Mode**
   - Display sizes as blue tags
   - Display colors as purple tags
   - "No sizes/colors specified" for empty arrays

### Form Controls

```typescript
// Handle comma-separated input
const handleArrayInputChange = (field: 'sizes' | 'colors', value: string) => {
  const items = value.split(',').map(item => item.trim()).filter(item => item.length > 0);
  setFormData(prev => ({ ...prev, [field]: items }));
};

// Add individual item
const addArrayItem = (field: 'sizes' | 'colors', item: string) => {
  if (item.trim() && !formData[field].includes(item.trim())) {
    setFormData(prev => ({ 
      ...prev, 
      [field]: [...prev[field], item.trim()] 
    }));
  }
};

// Remove individual item
const removeArrayItem = (field: 'sizes' | 'colors', index: number) => {
  setFormData(prev => ({
    ...prev,
    [field]: prev[field].filter((_, i) => i !== index)
  }));
};
```

## 🎯 Frontend Integration

### FeaturedProducts Component

The featured products component now displays:
- Product sizes (up to 3, with "+X more" indicator)
- Product colors (up to 2, with "+X more" indicator)
- Visual tags with different colors for sizes vs colors

```typescript
{(product.sizes?.length > 0 || product.colors?.length > 0) && (
  <div className="flex flex-wrap gap-1 mt-2">
    {product.sizes?.slice(0, 3).map((size, index) => (
      <span key={`size-${index}`} className="text-xs px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded">
        {size}
      </span>
    ))}
    {product.colors?.slice(0, 2).map((color, index) => (
      <span key={`color-${index}`} className="text-xs px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded">
        {color}
      </span>
    ))}
    {(product.sizes?.length > 3 || product.colors?.length > 2) && (
      <span className="text-xs px-1.5 py-0.5 bg-neutral-500/20 text-neutral-400 rounded">
        +{((product.sizes?.length || 0) - 3 + (product.colors?.length || 0) - 2)} more
      </span>
    )}
  </div>
)}
```

## 📋 Migration Guide

### Step 1: Run Database Migration

Execute the migration script:
```sql
-- Run: add-product-attributes-migration.sql
```

### Step 2: Update Existing Products

Run the migration script to add attributes to existing products:
```bash
node migrate-static-products.js
```

### Step 3: Verify Migration

Check that products have attributes:
```sql
SELECT name, sizes, colors FROM products LIMIT 5;
```

## 🔍 Usage Examples

### Adding Sizes and Colors

1. **Via Admin Dashboard:**
   - Go to Admin → Products
   - Edit a product
   - Enter sizes: "S, M, L, XL"
   - Enter colors: "Black, White, Red"
   - Save changes

2. **Via API:**
   ```bash
   curl -X PUT "http://localhost:3000/api/admin/products" \
     -H "Content-Type: application/json" \
     -d '{
       "id": "product-uuid",
       "sizes": ["S", "M", "L", "XL"],
       "colors": ["Black", "White", "Red"]
     }'
   ```

### Filtering by Attributes

```bash
# Get products with specific sizes
curl "http://localhost:3000/api/products?sizes=S,M,L"

# Get products with specific colors
curl "http://localhost:3000/api/products?colors=Black,White"

# Get featured products with specific attributes
curl "http://localhost:3000/api/products?featured=true&sizes=XL&colors=Black"
```

## 🎨 UI Components

### Attribute Tags

- **Sizes**: Blue background (`bg-blue-500/20 text-blue-400`)
- **Colors**: Purple background (`bg-purple-500/20 text-purple-400`)
- **Remove Button**: × symbol with hover effects

### Form Validation

- Empty arrays are allowed
- Duplicate items are automatically filtered
- Whitespace is trimmed automatically
- Maximum display limits prevent UI overflow

## 🔧 Performance Optimizations

### Database Indexes

```sql
-- GIN indexes for array operations
CREATE INDEX idx_products_sizes ON products USING GIN(sizes);
CREATE INDEX idx_products_colors ON products USING GIN(colors);

-- Regular indexes for common queries
CREATE INDEX idx_products_is_featured ON products(is_featured);
```

### Query Optimization

- Use `&&` operator for array overlap queries
- Use GIN indexes for efficient array searches
- Limit array sizes in UI to prevent performance issues

## 🚀 Future Enhancements

### Planned Features

1. **Attribute Templates**
   - Predefined size/color combinations
   - Bulk attribute assignment
   - Template management

2. **Advanced Filtering**
   - Multi-select attribute filters
   - Range-based size filtering
   - Color family grouping

3. **Inventory by Attribute**
   - Stock tracking per size/color
   - Low stock alerts by attribute
   - Variant-specific pricing

4. **Visual Color Picker**
   - Color swatches in admin
   - Hex color codes
   - Color preview in product cards

5. **Size Charts**
   - Product-specific size charts
   - Measurement guides
   - International size conversions

---

**Product Attributes System is now fully functional!** 🎉

Your e-commerce platform now supports editable product sizes and colors with a complete admin interface and database integration. 