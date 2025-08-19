-- ============================================
-- SIMPLE NEWSLETTER SCHEMA UPDATE
-- Step-by-step approach to handle duplicates
-- ============================================

-- STEP 1: First, let's see what duplicates exist
SELECT phone, COUNT(*) as count, 
       STRING_AGG(id::text, ', ') as subscriber_ids,
       STRING_AGG(email, ', ') as emails
FROM newsletter_subscribers 
WHERE phone IS NOT NULL 
GROUP BY phone 
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- STEP 2: Delete older duplicate phone entries (keep the most recent one)
-- This will remove the duplicates so we can create the unique constraint
DELETE FROM newsletter_subscribers 
WHERE id IN (
    SELECT id 
    FROM (
        SELECT id, 
               ROW_NUMBER() OVER (PARTITION BY phone ORDER BY created_at DESC) as rn
        FROM newsletter_subscribers 
        WHERE phone IS NOT NULL
    ) ranked 
    WHERE rn > 1
);

-- STEP 3: Now proceed with schema changes
-- Make email nullable
ALTER TABLE newsletter_subscribers 
ALTER COLUMN email DROP NOT NULL;

-- Remove email unique constraint
ALTER TABLE newsletter_subscribers 
DROP CONSTRAINT IF EXISTS newsletter_subscribers_email_key;

-- Add constraint to ensure at least one contact method
ALTER TABLE newsletter_subscribers 
ADD CONSTRAINT check_email_or_phone 
CHECK (email IS NOT NULL OR phone IS NOT NULL);

-- Create unique indexes for non-null values
CREATE UNIQUE INDEX idx_newsletter_unique_email_when_not_null 
ON newsletter_subscribers (email) 
WHERE email IS NOT NULL;

CREATE UNIQUE INDEX idx_newsletter_unique_phone_when_not_null 
ON newsletter_subscribers (phone) 
WHERE phone IS NOT NULL;

-- Update existing indexes
DROP INDEX IF EXISTS idx_newsletter_subscribers_email;
CREATE INDEX idx_newsletter_subscribers_email ON newsletter_subscribers(email) 
WHERE email IS NOT NULL;

CREATE INDEX idx_newsletter_subscribers_phone ON newsletter_subscribers(phone) 
WHERE phone IS NOT NULL;

-- Update RLS policies
DROP POLICY IF EXISTS "Admin full access to newsletter subscribers" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Public can insert newsletter subscriptions" ON newsletter_subscribers;

CREATE POLICY "Admin full access to newsletter subscribers" ON newsletter_subscribers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE clerk_user_id = auth.jwt() ->> 'sub' 
            AND is_active = true
        )
    );

CREATE POLICY "Public can insert newsletter subscriptions" ON newsletter_subscribers
    FOR INSERT WITH CHECK (
        (email IS NOT NULL AND email != '') OR 
        (phone IS NOT NULL AND phone != '')
    );

-- Update analytics view
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

-- Add validation function
CREATE OR REPLACE FUNCTION validate_newsletter_subscription()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.email IS NULL OR NEW.email = '') AND (NEW.phone IS NULL OR NEW.phone = '') THEN
        RAISE EXCEPTION 'Either email or phone number must be provided';
    END IF;
    
    IF NEW.email IS NOT NULL AND NEW.email != '' THEN
        IF NEW.email !~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$' THEN
            RAISE EXCEPTION 'Invalid email format';
        END IF;
    END IF;
    
    IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN
        IF LENGTH(NEW.phone) < 7 OR LENGTH(NEW.phone) > 20 THEN
            RAISE EXCEPTION 'Phone number must be between 7 and 20 characters';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_newsletter_subscription_trigger ON newsletter_subscribers;
CREATE TRIGGER validate_newsletter_subscription_trigger
    BEFORE INSERT OR UPDATE ON newsletter_subscribers
    FOR EACH ROW EXECUTE FUNCTION validate_newsletter_subscription();

-- Show final summary
SELECT 
    'Migration completed successfully!' as status,
    COUNT(*) FILTER (WHERE email IS NULL AND phone IS NOT NULL) as phone_only_count,
    COUNT(*) FILTER (WHERE email IS NOT NULL AND phone IS NULL) as email_only_count,
    COUNT(*) FILTER (WHERE email IS NOT NULL AND phone IS NOT NULL) as both_contact_methods,
    COUNT(*) as total_subscribers
FROM newsletter_subscribers;