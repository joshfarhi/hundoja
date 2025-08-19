-- ============================================
-- NEWSLETTER SUBSCRIBERS TABLE SCHEMA UPDATE
-- Updated to support either email OR phone (not both required)
-- Fixed to handle existing duplicate phone numbers
-- ============================================

-- First, identify and handle duplicate phone numbers
-- Create a temporary table to track the duplicates we need to fix
CREATE TEMP TABLE phone_duplicates AS
SELECT phone, COUNT(*) as duplicate_count
FROM newsletter_subscribers 
WHERE phone IS NOT NULL 
GROUP BY phone 
HAVING COUNT(*) > 1;

-- For duplicate phone numbers, keep the most recent one and update others
-- Add a suffix to make them unique temporarily
WITH ranked_duplicates AS (
    SELECT id, phone, email,
           ROW_NUMBER() OVER (PARTITION BY phone ORDER BY created_at DESC) as rn
    FROM newsletter_subscribers 
    WHERE phone IN (SELECT phone FROM phone_duplicates)
)
UPDATE newsletter_subscribers 
SET phone = CASE 
    WHEN ranked_duplicates.phone IS NOT NULL AND ranked_duplicates.rn > 1 
    THEN ranked_duplicates.phone || '_dup_' || ranked_duplicates.rn 
    ELSE ranked_duplicates.phone 
END
FROM ranked_duplicates 
WHERE newsletter_subscribers.id = ranked_duplicates.id 
AND ranked_duplicates.rn > 1;

-- Now proceed with the schema changes

-- First, modify the existing table to allow email to be nullable
ALTER TABLE newsletter_subscribers 
ALTER COLUMN email DROP NOT NULL;

-- Remove the unique constraint on email since we might have phone-only subscribers
ALTER TABLE newsletter_subscribers 
DROP CONSTRAINT IF EXISTS newsletter_subscribers_email_key;

-- Create a new constraint to ensure at least one of email or phone is provided
ALTER TABLE newsletter_subscribers 
ADD CONSTRAINT check_email_or_phone 
CHECK (email IS NOT NULL OR phone IS NOT NULL);

-- Create a composite unique constraint to prevent duplicates
-- This allows multiple NULL emails or phones but prevents duplicate non-null values
CREATE UNIQUE INDEX idx_newsletter_unique_email_when_not_null 
ON newsletter_subscribers (email) 
WHERE email IS NOT NULL;

-- Now create the phone unique index (duplicates should be resolved)
CREATE UNIQUE INDEX idx_newsletter_unique_phone_when_not_null 
ON newsletter_subscribers (phone) 
WHERE phone IS NOT NULL;

-- Update the existing index on email to be partial (only for non-null emails)
DROP INDEX IF EXISTS idx_newsletter_subscribers_email;
CREATE INDEX idx_newsletter_subscribers_email ON newsletter_subscribers(email) 
WHERE email IS NOT NULL;

-- Add an index for phone lookups
CREATE INDEX idx_newsletter_subscribers_phone ON newsletter_subscribers(phone) 
WHERE phone IS NOT NULL;

-- Update RLS policies to work with optional email
-- First drop existing policies
DROP POLICY IF EXISTS "Admin full access to newsletter subscribers" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Public can insert newsletter subscriptions" ON newsletter_subscribers;

-- Create new policies
CREATE POLICY "Admin full access to newsletter subscribers" ON newsletter_subscribers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE clerk_user_id = auth.jwt() ->> 'sub' 
            AND is_active = true
        )
    );

-- Allow public inserts for newsletter signups (with either email or phone)
CREATE POLICY "Public can insert newsletter subscriptions" ON newsletter_subscribers
    FOR INSERT WITH CHECK (
        (email IS NOT NULL AND email != '') OR 
        (phone IS NOT NULL AND phone != '')
    );

-- Update the analytics view to handle nullable emails
DROP VIEW IF EXISTS newsletter_analytics;
CREATE VIEW newsletter_analytics AS
SELECT 
    COUNT(*) FILTER (WHERE status = 'active') as active_subscribers,
    COUNT(*) FILTER (WHERE status = 'unsubscribed') as unsubscribed_count,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_subscribers_30d,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as new_subscribers_7d,
    COUNT(*) FILTER (WHERE phone IS NOT NULL) as subscribers_with_phone,
    COUNT(*) FILTER (WHERE email IS NOT NULL) as subscribers_with_email,
    COUNT(*) FILTER (WHERE phone IS NOT NULL AND email IS NOT NULL) as subscribers_with_both,
    COUNT(*) FILTER (WHERE phone IS NOT NULL AND email IS NULL) as phone_only_subscribers,
    COUNT(*) FILTER (WHERE email IS NOT NULL AND phone IS NULL) as email_only_subscribers,
    COUNT(DISTINCT country_code) as countries_count,
    AVG(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - created_at))/86400) as avg_subscription_age_days
FROM newsletter_subscribers;

-- Create a function to validate subscription data
CREATE OR REPLACE FUNCTION validate_newsletter_subscription()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure at least one contact method is provided
    IF (NEW.email IS NULL OR NEW.email = '') AND (NEW.phone IS NULL OR NEW.phone = '') THEN
        RAISE EXCEPTION 'Either email or phone number must be provided';
    END IF;
    
    -- Validate email format if provided
    IF NEW.email IS NOT NULL AND NEW.email != '' THEN
        IF NEW.email !~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$' THEN
            RAISE EXCEPTION 'Invalid email format';
        END IF;
    END IF;
    
    -- Validate phone format if provided (basic validation)
    IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN
        IF LENGTH(NEW.phone) < 7 OR LENGTH(NEW.phone) > 20 THEN
            RAISE EXCEPTION 'Phone number must be between 7 and 20 characters';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for validation
DROP TRIGGER IF EXISTS validate_newsletter_subscription_trigger ON newsletter_subscribers;
CREATE TRIGGER validate_newsletter_subscription_trigger
    BEFORE INSERT OR UPDATE ON newsletter_subscribers
    FOR EACH ROW EXECUTE FUNCTION validate_newsletter_subscription();

-- Add some sample data to test both scenarios (only if they don't exist)
INSERT INTO newsletter_subscribers (email, status, source, preferences) VALUES 
('email-only@example.com', 'active', 'web', '{"email_notifications": true, "sms_notifications": false}')
ON CONFLICT DO NOTHING;

INSERT INTO newsletter_subscribers (phone, country_code, status, source, preferences) VALUES 
('+1234567890', 'US', 'active', 'web', '{"email_notifications": false, "sms_notifications": true}')
ON CONFLICT DO NOTHING;

INSERT INTO newsletter_subscribers (email, phone, country_code, status, source, preferences) VALUES 
('both@example.com', '+1987654321', 'CA', 'active', 'web', '{"email_notifications": true, "sms_notifications": true}')
ON CONFLICT DO NOTHING;

-- Show summary of changes
SELECT 
    'Migration completed. Phone duplicates handled.' as status,
    COUNT(*) FILTER (WHERE phone LIKE '%_dup_%') as duplicates_renamed,
    COUNT(*) FILTER (WHERE email IS NULL AND phone IS NOT NULL) as phone_only_count,
    COUNT(*) FILTER (WHERE email IS NOT NULL AND phone IS NULL) as email_only_count,
    COUNT(*) FILTER (WHERE email IS NOT NULL AND phone IS NOT NULL) as both_contact_methods
FROM newsletter_subscribers;

COMMENT ON TABLE newsletter_subscribers IS 'Stores newsletter subscriptions with either email or phone (or both) as contact methods';
COMMENT ON CONSTRAINT check_email_or_phone ON newsletter_subscribers IS 'Ensures at least one contact method (email or phone) is provided';