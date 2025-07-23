-- ============================================
-- REQUIRED SCHEMA FOR PRODUCT & CATEGORY MANAGEMENT
-- ============================================

-- This schema outlines the necessary tables and relationships 
-- to support the product and category management features.
-- Your existing `supabase-schema.sql` already covers these requirements.

--
-- CATEGORIES TABLE
-- Stores product categories.
--
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

--
-- PRODUCTS TABLE
-- Stores individual product information.
-- `category_id` is linked to the `categories` table.
-- `ON DELETE SET NULL` ensures that if a category is deleted,
-- the products within it become "uncategorized" instead of being deleted.
--
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    sku VARCHAR(100) NOT NULL UNIQUE,
    price DECIMAL(10,2) NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    stock_quantity INTEGER DEFAULT 0,
    images JSONB, -- Array of image URLs
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

--
-- PRODUCT VARIANTS TABLE
-- (Optional but recommended for future growth, e.g., sizes, colors)
--
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255), -- e.g., "Large - Black"
    price DECIMAL(10,2), -- Override product price if different
    stock_quantity INTEGER DEFAULT 0,
    attributes JSONB, -- {size: "L", color: "black"}
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

--
-- INDEXES FOR PERFORMANCE
-- It's crucial to have indexes on foreign keys and frequently queried columns.
--
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_is_featured ON products(is_featured);
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);

--
-- TRIGGER FOR `updated_at`
-- This function automatically updates the `updated_at` timestamp on any change.
--
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Applying the trigger to the tables
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON product_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 