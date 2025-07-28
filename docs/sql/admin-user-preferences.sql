-- ============================================
-- ADMIN USER PREFERENCES & MANAGEMENT
-- ============================================

-- Admin users table (for admin authentication and role management)
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_user_id VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'admin', -- admin, super_admin, manager
    permissions JSONB DEFAULT '{}', -- Specific permissions for the user
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add any missing columns to existing admin_users table
DO $$ 
BEGIN
    -- Add first_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'admin_users' AND column_name = 'first_name') THEN
        ALTER TABLE admin_users ADD COLUMN first_name VARCHAR(100);
    END IF;
    
    -- Add last_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'admin_users' AND column_name = 'last_name') THEN
        ALTER TABLE admin_users ADD COLUMN last_name VARCHAR(100);
    END IF;
    
    -- Add permissions column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'admin_users' AND column_name = 'permissions') THEN
        ALTER TABLE admin_users ADD COLUMN permissions JSONB DEFAULT '{}';
    END IF;
    
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
    clerk_user_id VARCHAR(255) NOT NULL UNIQUE,
    demo_items_hidden BOOLEAN DEFAULT false,
    dashboard_layout JSONB DEFAULT '{}', -- Custom dashboard layout preferences
    notification_settings JSONB DEFAULT '{}', -- Email, push notification preferences
    theme_preferences JSONB DEFAULT '{}', -- UI theme preferences
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add any missing columns to existing admin_user_preferences table
DO $$ 
BEGIN
    -- Add dashboard_layout column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'admin_user_preferences' AND column_name = 'dashboard_layout') THEN
        ALTER TABLE admin_user_preferences ADD COLUMN dashboard_layout JSONB DEFAULT '{}';
    END IF;
    
    -- Add notification_settings column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'admin_user_preferences' AND column_name = 'notification_settings') THEN
        ALTER TABLE admin_user_preferences ADD COLUMN notification_settings JSONB DEFAULT '{}';
    END IF;
    
    -- Add theme_preferences column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'admin_user_preferences' AND column_name = 'theme_preferences') THEN
        ALTER TABLE admin_user_preferences ADD COLUMN theme_preferences JSONB DEFAULT '{}';
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'admin_user_preferences' AND column_name = 'updated_at') THEN
        ALTER TABLE admin_user_preferences ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- ============================================
-- FUNCTIONS FOR PREFERENCE MANAGEMENT
-- ============================================

-- Function to get or create admin preferences
CREATE OR REPLACE FUNCTION get_or_create_admin_preferences(user_clerk_id TEXT)
RETURNS JSONB AS $$
DECLARE
    preferences_record admin_user_preferences%ROWTYPE;
BEGIN
    -- Try to get existing preferences
    SELECT * INTO preferences_record 
    FROM admin_user_preferences 
    WHERE clerk_user_id = user_clerk_id;
    
    -- If no preferences exist, create default ones
    IF NOT FOUND THEN
        INSERT INTO admin_user_preferences (clerk_user_id, demo_items_hidden)
        VALUES (user_clerk_id, false)
        RETURNING * INTO preferences_record;
    END IF;
    
    -- Return preferences as JSONB
    RETURN jsonb_build_object(
        'demo_items_hidden', preferences_record.demo_items_hidden,
        'dashboard_layout', preferences_record.dashboard_layout,
        'notification_settings', preferences_record.notification_settings,
        'theme_preferences', preferences_record.theme_preferences
    );
END;
$$ LANGUAGE plpgsql;

-- Function to update demo items preference
CREATE OR REPLACE FUNCTION update_demo_items_preference(user_clerk_id TEXT, hide_demo_items BOOLEAN)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO admin_user_preferences (clerk_user_id, demo_items_hidden)
    VALUES (user_clerk_id, hide_demo_items)
    ON CONFLICT (clerk_user_id) 
    DO UPDATE SET 
        demo_items_hidden = hide_demo_items,
        updated_at = NOW();
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_admin_users_clerk_user_id ON admin_users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_user_preferences_clerk_user_id ON admin_user_preferences(clerk_user_id);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

-- Drop existing triggers if they exist to avoid conflicts
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
DROP TRIGGER IF EXISTS update_admin_user_preferences_updated_at ON admin_user_preferences;

-- Create triggers
CREATE TRIGGER update_admin_users_updated_at 
    BEFORE UPDATE ON admin_users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_user_preferences_updated_at 
    BEFORE UPDATE ON admin_user_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on admin tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_user_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Admin users can view own data" ON admin_users;
DROP POLICY IF EXISTS "Admin users can update own data" ON admin_users;
DROP POLICY IF EXISTS "Admin users can view own preferences" ON admin_user_preferences;
DROP POLICY IF EXISTS "Admin users can update own preferences" ON admin_user_preferences;
DROP POLICY IF EXISTS "Admin users can insert own preferences" ON admin_user_preferences;

-- Admin users can only see their own data
CREATE POLICY "Admin users can view own data" ON admin_users
    FOR SELECT USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Admin users can update own data" ON admin_users
    FOR UPDATE USING (clerk_user_id = auth.jwt() ->> 'sub');

-- Admin preferences: users can only see their own preferences
CREATE POLICY "Admin users can view own preferences" ON admin_user_preferences
    FOR SELECT USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Admin users can update own preferences" ON admin_user_preferences
    FOR UPDATE USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Admin users can insert own preferences" ON admin_user_preferences
    FOR INSERT WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

-- ============================================
-- SAMPLE ADMIN USER INSERTION
-- ============================================

-- Insert a sample admin user (replace with actual Clerk user ID)
-- INSERT INTO admin_users (clerk_user_id, email, first_name, last_name, role) 
-- VALUES ('user_2abc123def456', 'admin@hundoja.com', 'Admin', 'User', 'admin');

-- ============================================
-- NOTES
-- ============================================

/*
This migration sets up:

1. **Admin User Management**
   - Admin users table for authentication
   - Role-based access control
   - Permission management

2. **User Preferences**
   - Demo items visibility preference
   - Dashboard layout customization
   - Notification settings
   - Theme preferences

3. **Database Functions**
   - get_or_create_admin_preferences() - Auto-creates preferences for new users
   - update_demo_items_preference() - Updates demo items visibility

4. **Security**
   - Row Level Security (RLS) policies
   - Users can only access their own data
   - Proper authentication checks

To use this:

1. Run this SQL in your Supabase SQL editor
2. Replace the sample admin user with your actual Clerk user ID
3. The analytics API will automatically check admin status
4. Preferences will be created automatically for new admin users

Remember to:
- Update the Clerk user ID in the sample insertion
- Test the admin authentication flow
- Verify RLS policies work correctly
- Monitor admin user creation and preference management
*/