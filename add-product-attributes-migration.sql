-- Add is_featured column and enhance product attributes
-- This migration adds the is_featured column and ensures proper attribute handling

-- Add is_featured column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'is_featured'
    ) THEN
        ALTER TABLE public.products ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Ensure sizes and colors columns exist and are properly typed
DO $$ 
BEGIN
    -- Add sizes column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'sizes'
    ) THEN
        ALTER TABLE public.products ADD COLUMN sizes TEXT[] DEFAULT '{}';
    END IF;
    
    -- Add colors column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'colors'
    ) THEN
        ALTER TABLE public.products ADD COLUMN colors TEXT[] DEFAULT '{}';
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_sizes ON public.products USING GIN(sizes);
CREATE INDEX IF NOT EXISTS idx_products_colors ON public.products USING GIN(colors);

-- Add comments to the columns
COMMENT ON COLUMN public.products.is_featured IS 'Whether this product should be featured on the homepage';
COMMENT ON COLUMN public.products.sizes IS 'Array of available sizes for this product';
COMMENT ON COLUMN public.products.colors IS 'Array of available colors for this product';

-- Create a function to get unique sizes and colors across all products
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

-- Create a function to search products by attributes
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

-- Update some existing products to be featured (optional)
UPDATE public.products 
SET is_featured = TRUE 
WHERE id IN (
    SELECT id FROM public.products 
    ORDER BY created_at DESC 
    LIMIT 4
); 