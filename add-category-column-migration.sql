-- Migration to add category column to contact_requests table
-- Run this if you already have the contact_requests table without the category column

-- Add the category column if it doesn't exist
DO $$ 
BEGIN 
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
        
        RAISE NOTICE 'Category column added successfully';
    ELSE
        RAISE NOTICE 'Category column already exists';
    END IF;
END $$;

-- Add the phone column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'contact_requests' 
        AND column_name = 'phone'
    ) THEN
        ALTER TABLE public.contact_requests 
        ADD COLUMN phone VARCHAR(50);
        
        RAISE NOTICE 'Phone column added successfully';
    ELSE
        RAISE NOTICE 'Phone column already exists';
    END IF;
END $$;

-- Add the tags column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'contact_requests' 
        AND column_name = 'tags'
    ) THEN
        ALTER TABLE public.contact_requests 
        ADD COLUMN tags TEXT[];
        
        RAISE NOTICE 'Tags column added successfully';
    ELSE
        RAISE NOTICE 'Tags column already exists';
    END IF;
END $$;

-- Update priority column to include new values if needed
DO $$ 
BEGIN 
    -- Drop the old constraint if it exists
    ALTER TABLE public.contact_requests DROP CONSTRAINT IF EXISTS contact_requests_priority_check;
    
    -- Add the new constraint with all priority values
    ALTER TABLE public.contact_requests 
    ADD CONSTRAINT contact_requests_priority_check 
    CHECK (priority IN ('low', 'medium', 'normal', 'high', 'urgent'));
    
    RAISE NOTICE 'Priority constraint updated successfully';
END $$;

-- Add category index for better performance
CREATE INDEX IF NOT EXISTS idx_contact_requests_category ON public.contact_requests(category);