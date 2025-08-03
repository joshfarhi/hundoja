# Fix Admin Preferences Function Overloading Error

## 🚨 Error Description

You're encountering this error in your terminal:

```
Error fetching admin preferences: {
  code: 'PGRST203',
  details: null,
  hint: 'Try renaming the parameters or the function itself in the database so function overloading can be resolved',
  message: 'Could not choose the best candidate function between: public.get_or_create_admin_preferences(user_clerk_id => character varying), public.get_or_create_admin_preferences(user_clerk_id => text)'
}
```

## 🔍 Root Cause

This error occurs when PostgreSQL has multiple functions with the same name but different parameter types. In this case, there are two versions of `get_or_create_admin_preferences`:

1. One with `user_clerk_id CHARACTER VARYING`
2. One with `user_clerk_id TEXT`

PostgreSQL can't determine which function to use when called from the API, causing the function overloading conflict.

## ✅ Solution

### Option 1: Manual Fix (Recommended)

1. **Go to Supabase Dashboard**
   - Navigate to your Supabase project
   - Open the SQL Editor

2. **Run the Migration SQL**
   - Copy the contents of `fix-admin-preferences-function.sql`
   - Paste it into the SQL editor
   - Execute the SQL

3. **Verify the Fix**
   - The SQL will drop all conflicting functions
   - Recreate them with consistent `TEXT` parameter types
   - Show you the final function signatures

### Option 2: Automated Script

1. **Set Environment Variables**
   ```bash
   # In your .env.local file
   NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ```

2. **Run the Fix Script**
   ```bash
   node run-fix-admin-preferences.js
   ```

3. **Follow Manual Steps if Needed**
   - If the script can't execute the SQL automatically
   - Follow the manual steps provided by the script

## 📋 What the Fix Does

The migration script:

1. **Drops Conflicting Functions**
   ```sql
   DROP FUNCTION IF EXISTS get_or_create_admin_preferences(user_clerk_id CHARACTER VARYING);
   DROP FUNCTION IF EXISTS get_or_create_admin_preferences(user_clerk_id TEXT);
   DROP FUNCTION IF EXISTS get_or_create_admin_preferences(user_clerk_id VARCHAR);
   ```

2. **Recreates Functions with Consistent Types**
   - Uses `TEXT` parameter type consistently
   - Maintains the same functionality
   - Ensures no overloading conflicts

3. **Verifies the Fix**
   - Shows the final function signatures
   - Confirms only one version exists

## 🧪 Testing the Fix

After running the migration:

1. **Restart your development server**
   ```bash
   npm run dev
   ```

2. **Test the admin preferences**
   - Go to your admin dashboard
   - Check if the error is gone
   - Test preference functionality

3. **Check the logs**
   - The error should no longer appear in your terminal
   - API calls to `/api/admin/preferences` should work

## 🔧 Prevention

To prevent this issue in the future:

1. **Use Consistent Data Types**
   - Always use `TEXT` for string parameters in PostgreSQL functions
   - Avoid mixing `CHARACTER VARYING`, `VARCHAR`, and `TEXT`

2. **Version Control Your Database**
   - Keep SQL migrations in version control
   - Use consistent naming conventions
   - Document function signatures

3. **Test Database Changes**
   - Always test migrations in development first
   - Verify function signatures after deployment

## 📞 Support

If you continue to have issues:

1. Check the Supabase logs for additional error details
2. Verify your environment variables are correct
3. Ensure you have the necessary permissions in Supabase
4. Contact support if the issue persists 