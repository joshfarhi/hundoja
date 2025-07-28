# Setting Up Admin User for Analytics

This guide will help you set up an admin user in your database so the analytics dashboard can display real growth data.

## Prerequisites

1. You have a Clerk account set up
2. You have access to your Supabase database
3. You have run the main database schema (`docs/sql/supabase-schema.sql`)
4. You have run the admin preferences migration (`docs/sql/admin-user-preferences.sql`)

## Step 1: Get Your Clerk User ID

1. Sign in to your application
2. Open the browser developer tools (F12)
3. Go to the Console tab
4. Run this JavaScript code to get your user ID:

```javascript
// This will show your Clerk user ID
console.log('Your Clerk User ID:', window.Clerk?.user?.id);
```

5. Copy the user ID (it will look something like `user_2abc123def456`)

## Step 2: Insert Admin User into Database

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Run this SQL command, replacing `YOUR_CLERK_USER_ID` with your actual user ID:

```sql
-- Insert yourself as an admin user
INSERT INTO admin_users (clerk_user_id, email, first_name, last_name, role, is_active) 
VALUES (
    'YOUR_CLERK_USER_ID',  -- Replace with your actual Clerk user ID
    'your-email@example.com',  -- Replace with your email
    'Your',  -- Replace with your first name
    'Name',  -- Replace with your last name
    'admin',
    true
);
```

## Step 3: Verify Admin Access

1. Refresh your admin dashboard
2. The analytics should now load properly
3. You should see real growth calculations instead of hardcoded percentages

## Step 4: Test the Analytics API

You can test the analytics API directly:

```bash
# Make sure you're signed in, then visit:
GET /api/admin/analytics
```

This should return JSON with real analytics data.

## Troubleshooting

### "Admin access required" error
- Make sure you've inserted your user ID correctly
- Check that the `is_active` field is set to `true`
- Verify your Clerk user ID is correct

### Analytics showing 0% growth
- This is normal if you don't have historical data yet
- The system compares current month vs previous month
- Add some test orders/products to see growth calculations

### Database connection errors
- Check your Supabase connection settings
- Verify your environment variables are set correctly
- Make sure the database schema is properly applied

## Adding More Admin Users

To add additional admin users:

```sql
INSERT INTO admin_users (clerk_user_id, email, first_name, last_name, role, is_active) 
VALUES (
    'user_another123',  -- Their Clerk user ID
    'admin2@example.com',  -- Their email
    'Admin',  -- Their first name
    'User',  -- Their last name
    'admin',
    true
);
```

## Security Notes

- Only add trusted users as admins
- The system uses Row Level Security (RLS) to protect data
- Admin users can only access their own preferences
- Monitor admin user activity regularly

## Next Steps

Once your admin user is set up:

1. **Add test data** to see growth calculations in action
2. **Configure webhooks** to sync real order data
3. **Set up email notifications** for admin alerts
4. **Customize dashboard layout** through user preferences

Your analytics dashboard should now display real month-over-month growth percentages based on your actual data! 