-- Migration to add ticket_number column to contact_requests table
-- This aligns the table with the expected schema

-- First check if the column already exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'contact_requests' 
        AND column_name = 'ticket_number'
    ) THEN
        -- Add the ticket_number column
        ALTER TABLE public.contact_requests 
        ADD COLUMN ticket_number VARCHAR(50) UNIQUE;
        
        -- Update existing rows with generated ticket numbers
        UPDATE public.contact_requests 
        SET ticket_number = 'TKT-' || EXTRACT(EPOCH FROM created_at)::bigint || '-' || LEFT(MD5(RANDOM()::text), 5)
        WHERE ticket_number IS NULL;
        
        -- Now make it NOT NULL
        ALTER TABLE public.contact_requests 
        ALTER COLUMN ticket_number SET NOT NULL;
        
        RAISE NOTICE 'ticket_number column added successfully';
    ELSE
        RAISE NOTICE 'ticket_number column already exists';
    END IF;
END $$;

-- Create index on ticket_number for better query performance
CREATE INDEX IF NOT EXISTS idx_contact_requests_ticket_number ON public.contact_requests(ticket_number);