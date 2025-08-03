-- Fix admin preferences function overloading issue
-- This migration drops any existing functions and recreates them with consistent parameter types

-- Drop any existing functions with the same name to resolve overloading conflicts
DROP FUNCTION IF EXISTS get_or_create_admin_preferences(user_clerk_id CHARACTER VARYING);
DROP FUNCTION IF EXISTS get_or_create_admin_preferences(user_clerk_id TEXT);
DROP FUNCTION IF EXISTS get_or_create_admin_preferences(user_clerk_id VARCHAR);

-- Drop any existing update functions as well
DROP FUNCTION IF EXISTS update_demo_items_preference(user_clerk_id CHARACTER VARYING, hide_demo_items BOOLEAN);
DROP FUNCTION IF EXISTS update_demo_items_preference(user_clerk_id TEXT, hide_demo_items BOOLEAN);
DROP FUNCTION IF EXISTS update_demo_items_preference(user_clerk_id VARCHAR, hide_demo_items BOOLEAN);

-- Recreate the function with consistent TEXT parameter type
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

-- Recreate the update function with consistent TEXT parameter type
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

-- Verify the functions were created correctly
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname IN ('get_or_create_admin_preferences', 'update_demo_items_preference')
ORDER BY p.proname; 