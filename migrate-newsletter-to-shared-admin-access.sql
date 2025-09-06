-- ============================================
-- NEWSLETTER SHARED ADMIN ACCESS MIGRATION
-- Ensures all admins see the same newsletter dataset
-- ============================================

-- Step 1: Ensure the newsletter_subscribers table exists with correct structure
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255),
    phone VARCHAR(20),
    country_code VARCHAR(2),
    source VARCHAR(50) DEFAULT 'web',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced')),
    ip_address INET,
    user_agent TEXT,
    referrer_url TEXT,
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    preferences JSONB DEFAULT '{"email_notifications": true, "sms_notifications": false}',
    confirmed_at TIMESTAMP WITH TIME ZONE,
    last_email_sent_at TIMESTAMP WITH TIME ZONE,
    last_email_opened_at TIMESTAMP WITH TIME ZONE,
    last_email_clicked_at TIMESTAMP WITH TIME ZONE,
    unsubscribed_at TIMESTAMP WITH TIME ZONE,
    bounce_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_status ON newsletter_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_country_code ON newsletter_subscribers(country_code);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_created_at ON newsletter_subscribers(created_at);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_phone ON newsletter_subscribers(phone);

-- Step 3: Ensure the newsletter_campaigns table exists
CREATE TABLE IF NOT EXISTS newsletter_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),
    target_audience JSONB DEFAULT '{}',
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    total_subscribers INTEGER DEFAULT 0,
    emails_sent INTEGER DEFAULT 0,
    emails_delivered INTEGER DEFAULT 0,
    emails_opened INTEGER DEFAULT 0,
    emails_clicked INTEGER DEFAULT 0,
    emails_bounced INTEGER DEFAULT 0,
    emails_unsubscribed INTEGER DEFAULT 0,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create/update the newsletter_analytics view
DROP VIEW IF EXISTS newsletter_analytics;
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

-- Step 5: CRITICAL - Disable RLS on newsletter tables for shared admin access
ALTER TABLE newsletter_subscribers DISABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_campaigns DISABLE ROW LEVEL SECURITY;

-- Step 6: Grant permissions to ensure all authenticated users (admins) can access
GRANT ALL ON newsletter_subscribers TO authenticated, service_role;
GRANT ALL ON newsletter_campaigns TO authenticated, service_role;
GRANT SELECT ON newsletter_analytics TO authenticated, service_role;

-- Step 7: Create or update the updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 8: Apply triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_newsletter_subscribers_updated_at ON newsletter_subscribers;
CREATE TRIGGER update_newsletter_subscribers_updated_at
    BEFORE UPDATE ON newsletter_subscribers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_newsletter_campaigns_updated_at ON newsletter_campaigns;
CREATE TRIGGER update_newsletter_campaigns_updated_at
    BEFORE UPDATE ON newsletter_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 9: Ensure admin_users table exists and has the right structure
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin', 'moderator')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 10: Ensure the specified admin emails are in the admin_users table
INSERT INTO admin_users (clerk_user_id, email, name, role, is_active)
VALUES
    ('', 'joshfarhi12@gmail.com', 'Josh Farhi', 'super_admin', true),
    ('', 'm.zalo@icloud.com', 'M Zalo', 'admin', true),
    ('', 'hundoja@gmail.com', 'Hundoja Admin', 'admin', true)
ON CONFLICT (email) DO UPDATE SET
    is_active = true,
    role = CASE
        WHEN admin_users.email = 'joshfarhi12@gmail.com' THEN 'super_admin'
        ELSE 'admin'
    END;

-- Step 11: Verify the current data count
SELECT
    COUNT(*) as total_subscribers,
    COUNT(*) FILTER (WHERE status = 'active') as active_subscribers,
    COUNT(*) FILTER (WHERE phone IS NOT NULL) as with_phone_numbers
FROM newsletter_subscribers;

-- Step 12: Show current admin users
SELECT email, role, is_active FROM admin_users WHERE is_active = true;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Query 1: Check if all admins can access the same data
-- This should return the same results for all admin users

-- Query 2: Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('newsletter_subscribers', 'newsletter_campaigns')
AND schemaname = 'public';

-- Query 3: Check current newsletter analytics
SELECT * FROM newsletter_analytics;

-- ============================================
-- NOTES FOR THE USER
-- ============================================

/*
EXECUTION INSTRUCTIONS:

1. Run this SQL script in your Supabase SQL editor
2. This will:
   - Create/update the newsletter tables with proper structure
   - Disable RLS so all admins see the same data
   - Grant proper permissions
   - Ensure all admin emails are registered
   - Preserve all existing newsletter data (including phone numbers)

3. After running, all admins should see the same newsletter subscriber data

4. If you have existing newsletter data in a different table, let me know
   and I can help migrate it to this shared structure.

5. The phone numbers in your existing data will be preserved - this migration
   only affects access permissions, not the data itself.
*/
