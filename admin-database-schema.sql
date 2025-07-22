-- Hundoja Admin Panel Database Schema
-- This file contains all the necessary SQL commands to set up your admin panel database

-- Note: Remove the session_replication_role line as it requires superuser permissions
-- and is not needed for normal Supabase setups

-- Create admin_users table (for role-based authentication)
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin', 'moderator')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    cost DECIMAL(10,2),
    stock INTEGER DEFAULT 0,
    category VARCHAR(100),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('active', 'low_stock', 'out_of_stock', 'draft', 'discontinued')),
    featured BOOLEAN DEFAULT false,
    image TEXT,
    images TEXT[], -- Array of image URLs
    sku VARCHAR(100) UNIQUE,
    sold INTEGER DEFAULT 0,
    sizes TEXT[], -- Array of sizes (e.g., ['S', 'M', 'L', 'XL'])
    colors TEXT[], -- Array of colors
    tags TEXT[], -- Array of tags for better categorization
    seo_title VARCHAR(255),
    seo_description TEXT,
    weight DECIMAL(8,2), -- Product weight in kg
    dimensions JSONB, -- JSON object with width, height, depth
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clerk_user_id VARCHAR(255) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    phone VARCHAR(50),
    date_of_birth DATE,
    gender VARCHAR(20),
    address JSONB, -- JSON object with street, city, state, postal_code, country
    marketing_consent BOOLEAN DEFAULT false,
    total_orders INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0.00,
    last_order_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number VARCHAR(100) UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'completed', 'cancelled')),
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'partially_refunded')),
    payment_method VARCHAR(50),
    payment_intent_id VARCHAR(255), -- Stripe payment intent ID
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    shipping_amount DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    total DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    shipping_address JSONB NOT NULL, -- JSON object with shipping address
    billing_address JSONB, -- JSON object with billing address
    notes TEXT,
    tracking_number VARCHAR(255),
    shipped_date TIMESTAMP WITH TIME ZONE,
    delivered_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100),
    product_image TEXT,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    size VARCHAR(50),
    color VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create contact_requests table
CREATE TABLE IF NOT EXISTS public.contact_requests (
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

-- Create product_categories table (for better organization)
CREATE TABLE IF NOT EXISTS public.product_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    image TEXT,
    parent_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create inventory_logs table (for tracking stock changes)
CREATE TABLE IF NOT EXISTS public.inventory_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('adjustment', 'sale', 'return', 'restock', 'damaged', 'lost')),
    quantity_change INTEGER NOT NULL, -- Positive for increase, negative for decrease
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    reason TEXT,
    reference_id UUID, -- Could reference order_id or other related records
    performed_by UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create analytics_events table (for tracking user behavior)
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_name VARCHAR(100) NOT NULL,
    user_id VARCHAR(255), -- Clerk user ID or anonymous ID
    session_id VARCHAR(255),
    properties JSONB, -- JSON object with event properties
    page_url TEXT,
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create email_settings table (for Gmail configuration)
CREATE TABLE IF NOT EXISTS public.email_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    encrypted BOOLEAN DEFAULT false,
    description TEXT,
    updated_by UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_users_clerk_id ON public.admin_users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(featured);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_clerk_id ON public.customers(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_contact_requests_status ON public.contact_requests(status);
CREATE INDEX IF NOT EXISTS idx_contact_requests_priority ON public.contact_requests(priority);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_product_id ON public.inventory_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON public.analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_email_settings_key ON public.email_settings(setting_key);

-- Enable Row Level Security (RLS)
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Admin users can read all records
CREATE POLICY "Admin users can view all records" ON public.products
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE clerk_user_id = auth.jwt() ->> 'sub' AND is_active = true
        )
    );

CREATE POLICY "Admin users can manage all records" ON public.products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE clerk_user_id = auth.jwt() ->> 'sub' AND is_active = true
        )
    );

-- Similar policies for other tables (orders, customers, etc.)
CREATE POLICY "Admin users can view all orders" ON public.orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE clerk_user_id = auth.jwt() ->> 'sub' AND is_active = true
        )
    );

CREATE POLICY "Admin users can manage all orders" ON public.orders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE clerk_user_id = auth.jwt() ->> 'sub' AND is_active = true
        )
    );

-- Customers can only view their own orders
CREATE POLICY "Customers can view own orders" ON public.orders
    FOR SELECT USING (
        customer_email = (auth.jwt() ->> 'email')
    );

-- Public can view active products
CREATE POLICY "Public can view active products" ON public.products
    FOR SELECT USING (status = 'active');

-- Admin users can manage email settings
CREATE POLICY "Admin users can manage email settings" ON public.email_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE clerk_user_id = auth.jwt() ->> 'sub' AND is_active = true
        )
    );

-- Functions for automatic updates
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.admin_users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.customers
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.contact_requests
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.product_categories
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.email_settings
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL THEN
        NEW.order_number := 'ORD-' || LPAD(nextval('order_number_seq')::text, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1000;

-- Create trigger for generating order numbers
CREATE TRIGGER generate_order_number BEFORE INSERT ON public.orders
    FOR EACH ROW EXECUTE PROCEDURE public.generate_order_number();

-- Function to update customer statistics
CREATE OR REPLACE FUNCTION public.update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update customer statistics when order status changes to completed
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        UPDATE public.customers 
        SET 
            total_orders = total_orders + 1,
            total_spent = total_spent + NEW.total,
            last_order_date = NEW.updated_at
        WHERE email = NEW.customer_email;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating customer stats
CREATE TRIGGER update_customer_stats AFTER UPDATE ON public.orders
    FOR EACH ROW EXECUTE PROCEDURE public.update_customer_stats();

-- Function to update product inventory after order
CREATE OR REPLACE FUNCTION public.update_product_inventory()
RETURNS TRIGGER AS $$
BEGIN
    -- Decrease stock when order is created
    IF TG_OP = 'INSERT' THEN
        UPDATE public.products 
        SET 
            stock = stock - NEW.quantity,
            sold = sold + NEW.quantity
        WHERE id = NEW.product_id;
        
        -- Log inventory change
        INSERT INTO public.inventory_logs (product_id, type, quantity_change, previous_quantity, new_quantity, reason, reference_id)
        SELECT 
            NEW.product_id,
            'sale',
            -NEW.quantity,
            stock + NEW.quantity,
            stock,
            'Order item created',
            NEW.order_id
        FROM public.products WHERE id = NEW.product_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for inventory updates
CREATE TRIGGER update_product_inventory AFTER INSERT ON public.order_items
    FOR EACH ROW EXECUTE PROCEDURE public.update_product_inventory();

-- Insert some sample categories
INSERT INTO public.product_categories (name, slug, description, sort_order) VALUES
    ('Hoodies & Sweatshirts', 'hoodies-sweatshirts', 'Comfortable and stylish hoodies and sweatshirts', 1),
    ('T-Shirts & Tops', 't-shirts-tops', 'Essential t-shirts and tops for everyday wear', 2),
    ('Pants & Bottoms', 'pants-bottoms', 'Comfortable pants, jeans, and other bottoms', 3),
    ('Jackets & Outerwear', 'jackets-outerwear', 'Protective and stylish outerwear', 4),
    ('Accessories', 'accessories', 'Complete your look with our accessories', 5)
ON CONFLICT (name) DO NOTHING;

-- Grant necessary permissions (adjust as needed for your setup)
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres, authenticated, service_role;

-- Enable real-time subscriptions for Supabase
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR ALL TABLES;

COMMENT ON PUBLICATION supabase_realtime IS 'Real-time subscription for admin panel updates';

-- Instructions for adding your first admin user:
-- Replace 'your-clerk-user-id' with your actual Clerk user ID and 'your-email@example.com' with your email
/*
INSERT INTO public.admin_users (clerk_user_id, email, name, role, is_active)
VALUES ('your-clerk-user-id', 'your-email@example.com', 'Your Name', 'super_admin', true);
*/

-- Example: To add yourself as an admin (replace with your actual details):
-- INSERT INTO public.admin_users (clerk_user_id, email, name, role, is_active)
-- VALUES ('user_2xxx', 'you@example.com', 'Your Name', 'super_admin', true);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';-- Insert default Gmail settings
INSERT INTO public.email_settings (setting_key, setting_value, encrypted, description) VALUES
('gmail_user', '', false, 'Gmail email address for sending newsletters and notifications'),
('gmail_app_password', '', true, 'Gmail app password for SMTP authentication'),
('newsletter_from_name', 'Hundoja', false, 'Display name for newsletter emails'),
('admin_notification_enabled', 'true', false, 'Enable admin notifications for new subscribers')
ON CONFLICT (setting_key) DO NOTHING;
