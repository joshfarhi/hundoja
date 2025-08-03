-- Notifications table migration
-- This creates a table to store admin notifications with real-time capabilities

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(50) NOT NULL, -- 'new_order', 'low_stock', 'new_customer', 'payment_received', etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    icon_name VARCHAR(50) DEFAULT 'Bell', -- Lucide icon name
    icon_color VARCHAR(50) DEFAULT 'text-blue-400',
    is_read BOOLEAN DEFAULT FALSE,
    is_cleared BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}', -- Additional data like order_id, customer_id, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_is_cleared ON public.notifications(is_cleared);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notifications_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for admin users to read all notifications
CREATE POLICY "Admin users can read all notifications" ON public.notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

-- Create policy for admin users to update notifications
CREATE POLICY "Admin users can update notifications" ON public.notifications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

-- Create policy for admin users to delete notifications
CREATE POLICY "Admin users can delete notifications" ON public.notifications
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE clerk_user_id = auth.jwt() ->> 'sub'
        )
    );

-- Insert some sample notifications for testing
INSERT INTO public.notifications (type, title, message, icon_name, icon_color, metadata) VALUES
    ('new_order', 'New Order Received', 'New order #ORD-003 received from John Doe', 'ShoppingBag', 'text-blue-400', '{"order_id": "ORD-003", "customer_name": "John Doe"}'),
    ('low_stock', 'Low Stock Alert', 'Low stock alert: "Shadow Hoodie" has only 3 items left', 'Package', 'text-yellow-400', '{"product_id": 1, "product_name": "Shadow Hoodie", "current_stock": 3}'),
    ('new_customer', 'New Customer Registration', 'A new customer, Jane Smith, has registered', 'UserPlus', 'text-green-400', '{"customer_id": "cust_123", "customer_name": "Jane Smith"}'),
    ('payment_received', 'Payment Received', 'Payment received for order #ORD-002', 'CreditCard', 'text-green-400', '{"order_id": "ORD-002", "amount": 89.99}');

-- Create a function to get notifications with relative time
CREATE OR REPLACE FUNCTION get_notifications_with_relative_time()
RETURNS TABLE (
    id UUID,
    type VARCHAR(50),
    title VARCHAR(255),
    message TEXT,
    icon_name VARCHAR(50),
    icon_color VARCHAR(50),
    is_read BOOLEAN,
    is_cleared BOOLEAN,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    relative_time TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.type,
        n.title,
        n.message,
        n.icon_name,
        n.icon_color,
        n.is_read,
        n.is_cleared,
        n.metadata,
        n.created_at,
        CASE 
            WHEN n.created_at > NOW() - INTERVAL '1 minute' THEN 'just now'
            WHEN n.created_at > NOW() - INTERVAL '1 hour' THEN 
                EXTRACT(MINUTE FROM NOW() - n.created_at)::text || ' minutes ago'
            WHEN n.created_at > NOW() - INTERVAL '24 hours' THEN 
                EXTRACT(HOUR FROM NOW() - n.created_at)::text || ' hours ago'
            WHEN n.created_at > NOW() - INTERVAL '7 days' THEN 
                EXTRACT(DAY FROM NOW() - n.created_at)::text || ' days ago'
            ELSE to_char(n.created_at, 'MMM DD')
        END as relative_time
    FROM public.notifications n
    WHERE n.is_cleared = FALSE
    ORDER BY n.created_at DESC;
END;
$$ LANGUAGE plpgsql; 