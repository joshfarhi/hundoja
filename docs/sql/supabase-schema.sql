-- ============================================
-- HUNDOJA E-COMMERCE DATABASE SCHEMA
-- Supabase PostgreSQL Database
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- PRODUCTS MANAGEMENT
-- ============================================

-- Categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    short_description TEXT,
    sku VARCHAR(100) NOT NULL UNIQUE,
    price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    stock_quantity INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 5,
    weight DECIMAL(8,2),
    dimensions JSONB, -- {length, width, height}
    images JSONB, -- Array of image URLs
    tags TEXT[],
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    status VARCHAR(50) DEFAULT 'active', -- active, draft, archived, out_of_stock
    seo_title VARCHAR(255),
    seo_description TEXT,
    meta_data JSONB, -- Additional product metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product variants (sizes, colors, etc.)
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255), -- e.g., "Large - Black"
    price DECIMAL(10,2), -- Override product price if different
    stock_quantity INTEGER DEFAULT 0,
    attributes JSONB, -- {size: "L", color: "black"}
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CUSTOMER MANAGEMENT
-- ============================================

-- Customers table (synced with Clerk)
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_user_id VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    marketing_consent BOOLEAN DEFAULT false,
    total_spent DECIMAL(10,2) DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer addresses
CREATE TABLE customer_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    type VARCHAR(20) DEFAULT 'shipping', -- shipping, billing
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company VARCHAR(255),
    address_line_1 VARCHAR(255) NOT NULL,
    address_line_2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ORDER MANAGEMENT
-- ============================================

-- Orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, shipped, delivered, cancelled, refunded
    payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, failed, refunded, partial_refund
    fulfillment_status VARCHAR(50) DEFAULT 'unfulfilled', -- unfulfilled, partial, fulfilled
    
    -- Pricing
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    shipping_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- Addresses
    billing_address JSONB NOT NULL,
    shipping_address JSONB NOT NULL,
    
    -- Shipping
    shipping_method VARCHAR(100),
    tracking_number VARCHAR(255),
    shipping_carrier VARCHAR(100),
    
    -- Payment
    payment_method VARCHAR(50),
    stripe_payment_intent_id VARCHAR(255),
    stripe_charge_id VARCHAR(255),
    
    -- Metadata
    notes TEXT,
    admin_notes TEXT,
    tags TEXT[],
    source VARCHAR(50) DEFAULT 'web', -- web, admin, api
    
    -- Timestamps
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    sku VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL, -- Price at time of order
    total DECIMAL(10,2) NOT NULL, -- quantity * price
    product_snapshot JSONB, -- Snapshot of product data at time of order
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CONTACT & SUPPORT
-- ============================================

-- Contact requests
CREATE TABLE contact_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    subject VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'general', -- general, product_inquiry, order_support, returns, business, feedback, technical
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
    status VARCHAR(20) DEFAULT 'new', -- new, in_progress, resolved, closed
    assigned_to VARCHAR(255), -- Admin user ID who's handling this
    tags TEXT[],
    
    -- Response tracking
    first_response_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    source VARCHAR(50) DEFAULT 'web', -- web, email, phone
    user_agent TEXT,
    ip_address INET,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contact request responses/replies
CREATE TABLE contact_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_request_id UUID REFERENCES contact_requests(id) ON DELETE CASCADE,
    responder_type VARCHAR(20) NOT NULL, -- customer, admin
    responder_id VARCHAR(255), -- Clerk user ID
    responder_name VARCHAR(255),
    responder_email VARCHAR(255),
    message TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false, -- Internal admin notes
    attachments JSONB, -- Array of attachment URLs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INVENTORY MANAGEMENT
-- ============================================

-- Stock movements (for tracking inventory changes)
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    product_variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    movement_type VARCHAR(50) NOT NULL, -- purchase, sale, adjustment, return, damage
    quantity_change INTEGER NOT NULL, -- Positive for increase, negative for decrease
    quantity_after INTEGER NOT NULL,
    reference_id UUID, -- Order ID, adjustment ID, etc.
    reference_type VARCHAR(50), -- order, adjustment, return
    reason VARCHAR(255),
    admin_id VARCHAR(255), -- Clerk user ID of admin who made the change
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ANALYTICS & REPORTING
-- ============================================

-- Daily analytics summary
CREATE TABLE daily_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL UNIQUE,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    total_customers INTEGER DEFAULT 0,
    new_customers INTEGER DEFAULT 0,
    returning_customers INTEGER DEFAULT 0,
    average_order_value DECIMAL(10,2) DEFAULT 0,
    total_products_sold INTEGER DEFAULT 0,
    website_visits INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,4) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SYSTEM SETTINGS
-- ============================================

-- System settings/configuration
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false, -- Can be accessed by frontend
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Product indexes
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_is_featured ON products(is_featured);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_name_gin ON products USING gin(name gin_trgm_ops);

-- Product variant indexes
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON product_variants(sku);

-- Customer indexes
CREATE INDEX idx_customers_clerk_user_id ON customers(clerk_user_id);
CREATE INDEX idx_customers_email ON customers(email);

-- Order indexes
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- Order items indexes
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- Contact request indexes
CREATE INDEX idx_contact_requests_status ON contact_requests(status);
CREATE INDEX idx_contact_requests_category ON contact_requests(category);
CREATE INDEX idx_contact_requests_priority ON contact_requests(priority);
CREATE INDEX idx_contact_requests_email ON contact_requests(email);
CREATE INDEX idx_contact_requests_created_at ON contact_requests(created_at);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON product_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_addresses_updated_at BEFORE UPDATE ON customer_addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contact_requests_updated_at BEFORE UPDATE ON contact_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_daily_analytics_updated_at BEFORE UPDATE ON daily_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on sensitive tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_responses ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (customize based on your auth setup)
-- Customers can only see their own data
CREATE POLICY "Customers can view own data" ON customers
    FOR SELECT USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Customers can update own data" ON customers
    FOR UPDATE USING (clerk_user_id = auth.jwt() ->> 'sub');

-- Orders: customers can only see their own orders
CREATE POLICY "Customers can view own orders" ON orders
    FOR SELECT USING (customer_id IN (
        SELECT id FROM customers WHERE clerk_user_id = auth.jwt() ->> 'sub'
    ));

-- ============================================
-- SAMPLE DATA INSERTION
-- ============================================

-- Insert default categories
INSERT INTO categories (name, slug, description) VALUES 
('Hoodies', 'hoodies', 'Premium oversized hoodies and sweatshirts'),
('T-Shirts', 't-shirts', 'Essential streetwear t-shirts and tops'),
('Pants', 'pants', 'Urban cargo pants and joggers'),
('Jackets', 'jackets', 'Statement outerwear and bomber jackets');

-- Insert sample products (using the existing product data structure)
INSERT INTO products (name, slug, description, sku, price, cost_price, category_id, stock_quantity, images, is_featured, status) 
SELECT 
    'Shadow Oversized Hoodie',
    'shadow-oversized-hoodie',
    'Premium oversized hoodie crafted from heavyweight cotton. Features dropped shoulders and an urban-inspired silhouette.',
    'SOH-001',
    89.99,
    45.00,
    (SELECT id FROM categories WHERE slug = 'hoodies'),
    15,
    '["https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&h=600&fit=crop"]'::jsonb,
    true,
    'active';

INSERT INTO products (name, slug, description, sku, price, cost_price, category_id, stock_quantity, images, is_featured, status) 
SELECT 
    'Urban Cargo Pants',
    'urban-cargo-pants',
    'Multi-pocket cargo pants with tactical-inspired design. Built for both style and functionality.',
    'UCP-002',
    129.99,
    65.00,
    (SELECT id FROM categories WHERE slug = 'pants'),
    8,
    '["https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=500&h=600&fit=crop"]'::jsonb,
    true,
    'active';

-- Insert system settings
INSERT INTO system_settings (key, value, description, is_public) VALUES
('site_name', '"Hundoja"', 'Site name', true),
('currency', '"USD"', 'Default currency', true),
('tax_rate', '0.08', 'Default tax rate', false),
('low_stock_threshold', '5', 'Default low stock threshold', false),
('enable_inventory_tracking', 'true', 'Enable inventory tracking', false);

-- ============================================
-- USEFUL VIEWS
-- ============================================

-- Product view with category information
CREATE VIEW products_with_categories AS
SELECT 
    p.*,
    c.name as category_name,
    c.slug as category_slug
FROM products p
LEFT JOIN categories c ON p.category_id = c.id;

-- Order summary view
CREATE VIEW order_summary AS
SELECT 
    o.*,
    c.first_name || ' ' || c.last_name as customer_name,
    c.email as customer_email,
    COUNT(oi.id) as item_count
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, c.first_name, c.last_name, c.email;

-- Monthly sales summary
CREATE VIEW monthly_sales AS
SELECT 
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as order_count,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as avg_order_value
FROM orders 
WHERE status != 'cancelled'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- ============================================
-- NOTES
-- ============================================

/*
This schema supports:

1. **Complete Product Management**
   - Products with variants (sizes, colors)
   - Categories and inventory tracking
   - SEO optimization fields

2. **Customer Management**
   - Integration with Clerk authentication
   - Customer addresses and preferences
   - Purchase history tracking

3. **Order Processing**
   - Complete order lifecycle
   - Payment integration with Stripe
   - Shipping and fulfillment tracking

4. **Customer Support**
   - Contact request management
   - Ticket system with responses
   - Priority and category organization

5. **Analytics & Reporting**
   - Daily analytics summaries
   - Sales reporting views
   - Inventory movement tracking

6. **Security & Performance**
   - Row Level Security (RLS) policies
   - Comprehensive indexing
   - Automatic timestamp updates

To use this schema:
1. Run this SQL in your Supabase SQL editor
2. Configure RLS policies based on your specific needs
3. Update the auth.jwt() references to match your Clerk integration
4. Add any additional custom fields or tables as needed

Remember to:
- Set up proper environment variables for database connection
- Configure Clerk webhooks to sync user data
- Implement proper error handling in your application
- Add data validation at the application level
- Set up backup and monitoring for production use
*/