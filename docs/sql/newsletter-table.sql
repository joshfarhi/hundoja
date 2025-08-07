-- ============================================
-- NEWSLETTER SUBSCRIBERS TABLE
-- Add to existing Supabase schema
-- ============================================

-- Newsletter subscribers table
CREATE TABLE newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20), -- Optional phone number with country code
    country_code VARCHAR(2), -- ISO 2-letter country code (US, CA, GB, etc.)
    source VARCHAR(50) DEFAULT 'web', -- web, admin, api, import
    status VARCHAR(20) DEFAULT 'active', -- active, unsubscribed, bounced
    ip_address INET,
    user_agent TEXT,
    referrer_url TEXT,
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    
    -- Subscription preferences
    preferences JSONB DEFAULT '{"email_notifications": true, "sms_notifications": false}',
    
    -- Engagement tracking
    confirmed_at TIMESTAMP WITH TIME ZONE,
    last_email_sent_at TIMESTAMP WITH TIME ZONE,
    last_email_opened_at TIMESTAMP WITH TIME ZONE,
    last_email_clicked_at TIMESTAMP WITH TIME ZONE,
    unsubscribed_at TIMESTAMP WITH TIME ZONE,
    bounce_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_newsletter_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX idx_newsletter_subscribers_status ON newsletter_subscribers(status);
CREATE INDEX idx_newsletter_subscribers_country_code ON newsletter_subscribers(country_code);
CREATE INDEX idx_newsletter_subscribers_created_at ON newsletter_subscribers(created_at);

-- Updated timestamp trigger
CREATE TRIGGER update_newsletter_subscribers_updated_at 
    BEFORE UPDATE ON newsletter_subscribers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Newsletter campaigns table (for future email campaigns)
CREATE TABLE newsletter_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'draft', -- draft, scheduled, sending, sent, cancelled
    
    -- Targeting
    target_audience JSONB DEFAULT '{}', -- Criteria for selecting subscribers
    
    -- Scheduling
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Tracking
    total_subscribers INTEGER DEFAULT 0,
    emails_sent INTEGER DEFAULT 0,
    emails_delivered INTEGER DEFAULT 0,
    emails_opened INTEGER DEFAULT 0,
    emails_clicked INTEGER DEFAULT 0,
    emails_bounced INTEGER DEFAULT 0,
    emails_unsubscribed INTEGER DEFAULT 0,
    
    -- Metadata
    created_by VARCHAR(255), -- Admin user ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign tracking indexes
CREATE INDEX idx_newsletter_campaigns_status ON newsletter_campaigns(status);
CREATE INDEX idx_newsletter_campaigns_created_at ON newsletter_campaigns(created_at);

-- Updated timestamp trigger for campaigns
CREATE TRIGGER update_newsletter_campaigns_updated_at 
    BEFORE UPDATE ON newsletter_campaigns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- View for newsletter analytics
CREATE VIEW newsletter_analytics AS
SELECT 
    COUNT(*) FILTER (WHERE status = 'active') as active_subscribers,
    COUNT(*) FILTER (WHERE status = 'unsubscribed') as unsubscribed_count,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_subscribers_30d,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as new_subscribers_7d,
    COUNT(*) FILTER (WHERE phone IS NOT NULL) as subscribers_with_phone,
    COUNT(DISTINCT country_code) as countries_count,
    AVG(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - created_at))/86400) as avg_subscription_age_days
FROM newsletter_subscribers;

-- Insert some sample data (optional)
INSERT INTO newsletter_subscribers (email, status, source) VALUES 
('test@example.com', 'active', 'web');

-- Add RLS (Row Level Security) if needed
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_campaigns ENABLE ROW LEVEL SECURITY;

-- Admin access policy (adjust based on your admin authentication)
CREATE POLICY "Admin full access to newsletter subscribers" ON newsletter_subscribers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE clerk_user_id = auth.jwt() ->> 'sub' 
            AND is_active = true
        )
    );

CREATE POLICY "Admin full access to newsletter campaigns" ON newsletter_campaigns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE clerk_user_id = auth.jwt() ->> 'sub' 
            AND is_active = true
        )
    );