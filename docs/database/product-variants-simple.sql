-- Simple Product Variants Migration
-- Run this step-by-step in your Supabase SQL editor

-- Step 1: Create the basic table
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  price DECIMAL(10,2),
  stock_quantity INTEGER DEFAULT 0,
  attributes JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Step 2: Add indexes
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_active ON product_variants(is_active);

-- Step 3: Enable RLS
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Step 4: Add RLS policies
CREATE POLICY "Public read access" ON product_variants
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin full access" ON product_variants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE clerk_user_id = auth.jwt() ->> 'sub'
      AND is_active = true
    )
  );

-- Step 5: Add some sample data (optional)
-- Run this only if you want sample variants
INSERT INTO product_variants (product_id, sku, name, price, stock_quantity, attributes) 
SELECT 
  p.id,
  p.sku || '-S',
  p.name || ' - Small',
  p.price,
  5,
  '{"size": "S"}'::jsonb
FROM products p 
WHERE p.is_active = true
LIMIT 5;

INSERT INTO product_variants (product_id, sku, name, price, stock_quantity, attributes) 
SELECT 
  p.id,
  p.sku || '-M',
  p.name || ' - Medium',
  p.price,
  10,
  '{"size": "M"}'::jsonb
FROM products p 
WHERE p.is_active = true
LIMIT 5;

INSERT INTO product_variants (product_id, sku, name, price, stock_quantity, attributes) 
SELECT 
  p.id,
  p.sku || '-L',
  p.name || ' - Large',
  p.price,
  8,
  '{"size": "L"}'::jsonb
FROM products p 
WHERE p.is_active = true
LIMIT 5;