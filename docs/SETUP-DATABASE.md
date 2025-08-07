# Database Setup Instructions

To complete the newsletter and admin preferences setup, you need to run the following SQL scripts in your Supabase SQL Editor.

## Required SQL Scripts

### 1. Newsletter Subscribers Table
Run the contents of `/docs/sql/newsletter-table.sql` in Supabase SQL Editor to create:
- `newsletter_subscribers` table
- `newsletter_campaigns` table (for future use)
- `newsletter_analytics` view
- Proper indexes and RLS policies

### 2. Fix Newsletter RLS Issues  
Run the contents of `/docs/sql/fix-newsletter-rls.sql` to:
- Fix RLS policies blocking newsletter signups
- Resolve "new row violates row-level security policy" for newsletter_subscribers
- Allow public newsletter signups while protecting admin access

### 3. Admin User Preferences (Fix RLS Issues)
Run the contents of `/docs/sql/fix-admin-preferences-rls.sql` to:
- Create or fix the `admin_user_preferences` table  
- Fix RLS policies that are causing admin preference errors
- Create helper functions for preference management

## Setup Steps

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor

2. **Run Newsletter Table Script**
   ```sql
   -- Copy and paste contents of docs/sql/newsletter-table.sql
   ```

3. **Fix Newsletter RLS Issues**
   ```sql
   -- Copy and paste contents of docs/sql/fix-newsletter-rls.sql
   ```

4. **Fix Admin Preferences RLS Issues**
   ```sql
   -- Copy and paste contents of docs/sql/fix-admin-preferences-rls.sql
   ```

4. **Verify Setup**
   - Check that tables exist in the Table Editor
   - Verify that the newsletter form works without errors
   - Confirm admin preferences load correctly

## What This Fixes

### Newsletter Issues Fixed:
- ✅ Newsletter subscribers are now stored in database
- ✅ Admin can view all newsletter signups in `/admin/newsletter`
- ✅ Analytics show correct subscriber counts
- ✅ Phone numbers and country codes are tracked
- ✅ Export to CSV functionality

### Admin Preferences Issues Fixed:
- ✅ Resolves "new row violates row-level security policy" error
- ✅ Admin preferences load and save correctly
- ✅ Demo items can be hidden/shown as intended

## Testing

After running the SQL scripts:

1. **Test Newsletter Signup**
   - Go to homepage and submit newsletter form
   - Should see success message
   - Check `/admin/newsletter` to see the new subscriber

2. **Test Admin Preferences**
   - Navigate to admin dashboard
   - Should load without RLS errors
   - Preferences should save correctly

## Environment Variables

Make sure you have these in your `.env.local`:
```env
# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional: Email settings (currently disabled)
ENCRYPTION_KEY=your-32-character-secret-key
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
```

## Admin Access Setup

To access the admin dashboard and newsletter management:

1. **Get your Clerk User ID**
   - Sign in to your app
   - Check your user profile in Clerk dashboard

2. **Add Admin Access**
   ```sql
   INSERT INTO admin_users (clerk_user_id, role, is_active) 
   VALUES ('your_clerk_user_id_here', 'admin', true);
   ```

3. **Access Admin Features**
   - Navigate to `/admin`
   - Click "Newsletter" in sidebar
   - Manage subscribers, view analytics, export data