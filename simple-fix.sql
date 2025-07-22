-- Simple fix: Drop and recreate the contact_requests table with proper structure
DROP TABLE IF EXISTS public.contact_requests CASCADE;

-- Recreate with full structure including category column
CREATE TABLE public.contact_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
    priority VARCHAR(50) DEFAULT 'normal' CHECK (priority IN ('low', 'medium', 'normal', 'high', 'urgent')),
    category VARCHAR(100) DEFAULT 'general' CHECK (category IN ('general', 'product_inquiry', 'order_support', 'returns', 'business', 'feedback', 'technical')),
    tags TEXT[], -- Array of tags
    assigned_to UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
    responded_at TIMESTAMP WITH TIME ZONE,
    response TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);