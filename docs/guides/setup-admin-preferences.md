# Admin User Preferences Setup

This document outlines the database changes needed to store admin user preferences (like demo data visibility) in the database instead of localStorage.

## Database Changes Required

### Step 1: Run the SQL Migration
Execute the SQL in `admin-user-preferences.sql` in your Supabase SQL editor. This script is safe to run multiple times as it uses `IF NOT EXISTS` checks.

### Step 2: Create Admin User Records
After running the migration, you need to create admin user records for existing users who should have admin access.

#### Example: Creating an admin user

```sql
-- Replace 'user_xxxxxxxxxx' with actual Clerk user ID
-- Replace 'admin@example.com' with actual admin email
INSERT INTO admin_users (clerk_user_id, email, role, is_active) 
VALUES ('user_xxxxxxxxxx', 'admin@example.com', 'admin', true)
ON CONFLICT (clerk_user_id) DO NOTHING;
```

## How it works

### Before (localStorage only):
- Demo data visibility stored in browser localStorage
- Not synced across devices
- Lost when clearing browser data
- Not user-specific (per-browser instead)

### After (Database + localStorage fallback):
- Primary storage in database per user
- Synced across all devices for the same user
- Persistent across browser sessions
- Falls back to localStorage if database fails
- Each new user gets fresh demo data until they remove it

## API Endpoints

### GET `/api/admin/preferences`
- Fetches user preferences from database
- Creates default preferences if none exist

### POST `/api/admin/preferences`
- Updates specific preference (like `demo_items_hidden`)
- Body: `{ "demo_items_hidden": true }`

### PUT `/api/admin/preferences`
- Updates multiple preferences at once
- Body: `{ "demo_items_hidden": true, "theme": "dark", "notifications_enabled": false }`

## Features

1. **User-specific**: Each admin user has their own preferences
2. **Cross-device sync**: Preferences follow the user across devices
3. **Fallback support**: Uses localStorage if database is unavailable
4. **Automatic creation**: Creates preference record on first access
5. **Row-level security**: Users can only access their own preferences

## Testing

1. Login as an admin user
2. Click "Remove All Demo Items"
3. Refresh the page - demo items should stay hidden
4. Login from different browser/device - demo items should still be hidden
5. Create new admin user - should see demo items initially

## Migration Steps

1. Run `admin-user-preferences.sql` in Supabase
2. Create admin user records for existing users
3. Deploy the updated code
4. Test with existing and new admin users

## Troubleshooting

### Error: "relation already exists"
The updated SQL file uses `CREATE TABLE IF NOT EXISTS` and other safe operations. If you still get conflicts, the script will skip existing elements and only create what's missing.

### Error: "function already exists"  
The script uses `CREATE OR REPLACE FUNCTION` which will update existing functions safely.

### Admin user can't access preferences
Make sure the user has a record in the `admin_users` table with their correct Clerk user ID.

### Demo items not persisting
Check that:
1. The API routes are working (`/api/admin/preferences`)
2. The user has admin access
3. The database functions are created correctly

### Finding a user's Clerk ID
You can find a user's Clerk ID in the Clerk dashboard or by logging `user.id` in your app while they're signed in.