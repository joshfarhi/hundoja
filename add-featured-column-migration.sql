-- Add is_featured column to products table
-- This migration adds the is_featured boolean column to enable featured products functionality

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

-- Create index for better performance when filtering featured products
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON public.products(is_featured);

-- Update some existing products to be featured (optional)
-- You can modify these based on your actual product IDs
UPDATE public.products 
SET is_featured = TRUE 
WHERE id IN (
    SELECT id FROM public.products 
    ORDER BY created_at DESC 
    LIMIT 4
);

-- Add comment to the column
COMMENT ON COLUMN public.products.is_featured IS 'Whether this product should be featured on the homepage'; 