-- Product Variants Migration
-- Run this in your Supabase SQL editor to add product variants support

-- Create product_variants table
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL, -- e.g., "Large - Black", "Medium - White"
  price DECIMAL(10,2), -- Optional: variant-specific pricing
  stock_quantity INTEGER DEFAULT 0,
  attributes JSONB DEFAULT '{}', -- {"size": "L", "color": "black", "material": "cotton"}
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add sort_order column if it doesn't exist (for existing tables)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'product_variants' 
                 AND column_name = 'sort_order') THEN
    ALTER TABLE product_variants ADD COLUMN sort_order INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_active ON product_variants(is_active);
CREATE INDEX IF NOT EXISTS idx_product_variants_attributes ON product_variants USING GIN(attributes);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists, then create new one
DROP TRIGGER IF EXISTS update_product_variants_updated_at ON product_variants;
CREATE TRIGGER update_product_variants_updated_at 
  BEFORE UPDATE ON product_variants 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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

-- Add sample data (optional)
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
LIMIT 3;

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
LIMIT 3;

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
LIMIT 3;

-- Create a view for easy querying of products with variants
-- Only create if product_variants table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_variants') THEN
    DROP VIEW IF EXISTS products_with_variants;
    CREATE VIEW products_with_variants AS
    SELECT 
      p.*,
      COALESCE(
        json_agg(
          json_build_object(
            'id', pv.id,
            'sku', pv.sku,
            'name', pv.name,
            'price', pv.price,
            'stock_quantity', pv.stock_quantity,
            'attributes', pv.attributes,
            'is_active', pv.is_active
          ) ORDER BY COALESCE(pv.sort_order, 0), pv.name
        ) FILTER (WHERE pv.id IS NOT NULL), 
        '[]'::json
      ) as variants
    FROM products p
    LEFT JOIN product_variants pv ON p.id = pv.product_id AND pv.is_active = true
    WHERE p.is_active = true
    GROUP BY p.id, p.name, p.description, p.sku, p.price, p.stock_quantity, 
             p.category_id, p.images, p.is_active, p.metadata, p.created_at, p.updated_at;
  END IF;
END $$;

-- Function to get available variant attributes for a product
CREATE OR REPLACE FUNCTION get_product_variant_attributes(product_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_object_agg(attr_key, attr_values)
  INTO result
  FROM (
    SELECT 
      attr_key,
      json_agg(DISTINCT attr_value ORDER BY attr_value) as attr_values
    FROM (
      SELECT 
        jsonb_object_keys(attributes) as attr_key,
        jsonb_extract_path_text(attributes, jsonb_object_keys(attributes)) as attr_value
      FROM product_variants 
      WHERE product_id = product_uuid 
        AND is_active = true
    ) attrs
    GROUP BY attr_key
  ) grouped_attrs;
  
  RETURN COALESCE(result, '{}'::json);
END;
$$ LANGUAGE plpgsql;

-- Function to find variant by attributes
CREATE OR REPLACE FUNCTION find_variant_by_attributes(
  product_uuid UUID,
  search_attributes JSONB
)
RETURNS TABLE(
  variant_id UUID,
  variant_sku TEXT,
  variant_name TEXT,
  variant_price DECIMAL,
  variant_stock INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    id,
    sku,
    name,
    price,
    stock_quantity
  FROM product_variants
  WHERE product_id = product_uuid
    AND is_active = true
    AND attributes @> search_attributes
  ORDER BY sort_order, name
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;