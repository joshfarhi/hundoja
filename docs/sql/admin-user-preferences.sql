-- ============================================
-- ADMIN USER MANAGEMENT & PREFERENCES
-- ============================================

-- Admin users table (for role-based access control)
-- Check if table exists and create if not
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_user_id VARCHAR(255) NOT NULL UNIQUE, -- Clerk user ID
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'admin', -- admin, super_admin, moderator
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Add any missing columns to existing admin_users table
DO $$ 
BEGIN
    -- Add last_login column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'admin_users' AND column_name = 'last_login') THEN
        ALTER TABLE admin_users ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'admin_users' AND column_name = 'updated_at') THEN
        ALTER TABLE admin_users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Admin user preferences table
CREATE TABLE IF NOT EXISTS admin_user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
    clerk_user_id VARCHAR(255) NOT NULL, -- Clerk user ID for direct lookup
    demo_items_hidden BOOLEAN DEFAULT false,
    theme VARCHAR(20) DEFAULT 'dark', -- dark, light
    notifications_enabled BOOLEAN DEFAULT true,
    preferences JSONB DEFAULT '{}', -- For additional flexible preferences
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(clerk_user_id)
);

-- Indexes for performance (create only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_admin_users_clerk_user_id ON admin_users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_user_preferences_clerk_user_id ON admin_user_preferences(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_user_preferences_admin_user_id ON admin_user_preferences(admin_user_id);

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers only if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_admin_users_updated_at') THEN
        CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_admin_user_preferences_updated_at') THEN
        CREATE TRIGGER update_admin_user_preferences_updated_at BEFORE UPDATE ON admin_user_preferences
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Row Level Security (RLS)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies (drop and recreate to avoid conflicts)
DROP POLICY IF EXISTS "Admin users can view active admin records" ON admin_users;
DROP POLICY IF EXISTS "Admin users can manage own preferences" ON admin_user_preferences;

-- Admin users can only see their own record and other active admins
CREATE POLICY "Admin users can view active admin records" ON admin_users FOR SELECT
    USING (is_active = true);

-- Admin users can only update their own preferences
CREATE POLICY "Admin users can manage own preferences" ON admin_user_preferences
    FOR ALL USING (clerk_user_id = auth.jwt() ->> 'sub');

-- Function to get or create admin user preferences
CREATE OR REPLACE FUNCTION get_or_create_admin_preferences(user_clerk_id VARCHAR(255))
RETURNS admin_user_preferences AS $$
DECLARE
    result admin_user_preferences;
    admin_user_record admin_users;
BEGIN
    -- First, ensure the admin user exists
    SELECT * INTO admin_user_record FROM admin_users WHERE clerk_user_id = user_clerk_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Admin user not found for clerk_user_id: %', user_clerk_id;
    END IF;
    
    -- Try to get existing preferences
    SELECT * INTO result FROM admin_user_preferences WHERE clerk_user_id = user_clerk_id;
    
    -- If not found, create new preferences
    IF NOT FOUND THEN
        INSERT INTO admin_user_preferences (admin_user_id, clerk_user_id)
        VALUES (admin_user_record.id, user_clerk_id)
        RETURNING * INTO result;
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update demo items preference
CREATE OR REPLACE FUNCTION update_demo_items_preference(
    user_clerk_id VARCHAR(255),
    hide_demo_items BOOLEAN
)
RETURNS BOOLEAN AS $$
DECLARE
    prefs admin_user_preferences;
BEGIN
    -- Get or create preferences
    SELECT * INTO prefs FROM get_or_create_admin_preferences(user_clerk_id);
    
    -- Update the preference
    UPDATE admin_user_preferences 
    SET demo_items_hidden = hide_demo_items,
        updated_at = NOW()
    WHERE id = prefs.id;
    
    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;