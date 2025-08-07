-- ============================================
-- ADMIN USER PREFERENCES TABLE
-- Add to existing Supabase schema
-- ============================================

-- Admin user preferences table
CREATE TABLE IF NOT EXISTS admin_user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_user_id VARCHAR(255) NOT NULL UNIQUE,
    demo_items_hidden BOOLEAN DEFAULT false,
    
    -- UI preferences
    sidebar_collapsed BOOLEAN DEFAULT false,
    theme VARCHAR(20) DEFAULT 'dark', -- dark, light, auto
    notifications_enabled BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    
    -- Dashboard preferences
    dashboard_layout JSONB DEFAULT '{}',
    favorite_reports JSONB DEFAULT '[]',
    
    -- Other preferences
    timezone VARCHAR(100) DEFAULT 'UTC',
    date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY',
    items_per_page INTEGER DEFAULT 20,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraint to admin_users
    CONSTRAINT fk_admin_user_preferences_clerk_user_id 
        FOREIGN KEY (clerk_user_id) 
        REFERENCES admin_users(clerk_user_id) 
        ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_user_preferences_clerk_user_id 
    ON admin_user_preferences(clerk_user_id);

-- Updated timestamp trigger
CREATE TRIGGER update_admin_user_preferences_updated_at 
    BEFORE UPDATE ON admin_user_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE admin_user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Policy for SELECT operations
CREATE POLICY "Admin can view own preferences" ON admin_user_preferences
    FOR SELECT USING (
        clerk_user_id = auth.jwt() ->> 'sub' AND
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.clerk_user_id = auth.jwt() ->> 'sub' 
            AND is_active = true
        )
    );

-- Policy for INSERT operations
CREATE POLICY "Admin can create own preferences" ON admin_user_preferences
    FOR INSERT WITH CHECK (
        clerk_user_id = auth.jwt() ->> 'sub' AND
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.clerk_user_id = auth.jwt() ->> 'sub' 
            AND is_active = true
        )
    );

-- Policy for UPDATE operations
CREATE POLICY "Admin can update own preferences" ON admin_user_preferences
    FOR UPDATE USING (
        clerk_user_id = auth.jwt() ->> 'sub' AND
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.clerk_user_id = auth.jwt() ->> 'sub' 
            AND is_active = true
        )
    ) WITH CHECK (
        clerk_user_id = auth.jwt() ->> 'sub' AND
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.clerk_user_id = auth.jwt() ->> 'sub' 
            AND is_active = true
        )
    );

-- Policy for DELETE operations
CREATE POLICY "Admin can delete own preferences" ON admin_user_preferences
    FOR DELETE USING (
        clerk_user_id = auth.jwt() ->> 'sub' AND
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.clerk_user_id = auth.jwt() ->> 'sub' 
            AND is_active = true
        )
    );

-- Helper function to get or create admin preferences
CREATE OR REPLACE FUNCTION get_or_create_admin_preferences(user_clerk_id TEXT)
RETURNS TABLE(
    clerk_user_id VARCHAR(255),
    demo_items_hidden BOOLEAN,
    sidebar_collapsed BOOLEAN,
    theme VARCHAR(20),
    notifications_enabled BOOLEAN,
    email_notifications BOOLEAN,
    dashboard_layout JSONB,
    favorite_reports JSONB,
    timezone VARCHAR(100),
    date_format VARCHAR(20),
    items_per_page INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if admin user exists and is active
    IF NOT EXISTS (
        SELECT 1 FROM admin_users 
        WHERE admin_users.clerk_user_id = user_clerk_id 
        AND is_active = true
    ) THEN
        RAISE EXCEPTION 'User is not an active admin';
    END IF;

    -- Insert default preferences if they don't exist
    INSERT INTO admin_user_preferences (clerk_user_id)
    VALUES (user_clerk_id)
    ON CONFLICT (clerk_user_id) DO NOTHING;

    -- Return preferences
    RETURN QUERY
    SELECT 
        p.clerk_user_id,
        p.demo_items_hidden,
        p.sidebar_collapsed,
        p.theme,
        p.notifications_enabled,
        p.email_notifications,
        p.dashboard_layout,
        p.favorite_reports,
        p.timezone,
        p.date_format,
        p.items_per_page
    FROM admin_user_preferences p
    WHERE p.clerk_user_id = user_clerk_id;
END;
$$;

-- Helper function to update demo items preference
CREATE OR REPLACE FUNCTION update_demo_items_preference(
    user_clerk_id TEXT,
    hide_demo_items BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if admin user exists and is active
    IF NOT EXISTS (
        SELECT 1 FROM admin_users 
        WHERE admin_users.clerk_user_id = user_clerk_id 
        AND is_active = true
    ) THEN
        RAISE EXCEPTION 'User is not an active admin';
    END IF;

    -- Insert or update preference
    INSERT INTO admin_user_preferences (clerk_user_id, demo_items_hidden)
    VALUES (user_clerk_id, hide_demo_items)
    ON CONFLICT (clerk_user_id) 
    DO UPDATE SET 
        demo_items_hidden = hide_demo_items,
        updated_at = NOW();

    RETURN true;
END;
$$;