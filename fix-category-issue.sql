-- Fix category column issue
-- This script will ensure the category column exists before running the main schema

-- First, drop the index if it exists (in case it's causing conflicts)
DROP INDEX IF EXISTS idx_contact_requests_category;

-- Check if contact_requests table exists and add category column if missing
DO $$ 
BEGIN 
    -- Check if the table exists first
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'contact_requests') THEN
        -- Table exists, check for category column
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'contact_requests' 
            AND column_name = 'category'
        ) THEN
            ALTER TABLE public.contact_requests 
            ADD COLUMN category VARCHAR(100) DEFAULT 'general' 
            CHECK (category IN ('general', 'product_inquiry', 'order_support', 'returns', 'business', 'feedback', 'technical'));
            
            RAISE NOTICE 'Category column added to existing contact_requests table';
        ELSE
            RAISE NOTICE 'Category column already exists in contact_requests table';
        END IF;
    ELSE
        RAISE NOTICE 'contact_requests table does not exist yet - will be created by main schema';
    END IF;
END $$;

-- Recreate the index
CREATE INDEX IF NOT EXISTS idx_contact_requests_category ON public.contact_requests(category);