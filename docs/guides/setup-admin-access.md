# Setting Up Admin Access

## Step 1: Sign In to Your Account

1. Go to `http://localhost:3000/sign-in`
2. Sign in with your Clerk account
3. Make sure you're signed in before proceeding

## Step 2: Get Your Clerk User ID

1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Run this command to get your user ID:
   ```javascript
   console.log('User ID:', window.Clerk?.user?.id);
   ```
4. Copy the user ID (it will look something like `user_2abc123def456`)

## Step 3: Add Yourself as Admin

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Run this SQL command (replace `YOUR_CLERK_USER_ID` with your actual user ID):

```sql
INSERT INTO admin_users (
    clerk_user_id,
    role,
    is_active,
    first_name,
    last_name,
    email
) VALUES (
    'YOUR_CLERK_USER_ID',
    'admin',
    true,
    'Your First Name',
    'Your Last Name',
    'your-email@example.com'
);
```

## Step 4: Verify Admin Access

1. Go to `http://localhost:3000/api/test-admin` in your browser
2. You should see a response like:
   ```json
   {
     "authenticated": true,
     "userId": "your_user_id",
     "admin": true,
     "adminUser": {...},
     "message": "User is admin"
   }
   ```

## Step 5: Test the Admin Panel

1. Go to `http://localhost:3000/admin`
2. You should now be able to see the admin dashboard
3. Go to the Contacts page to see your submitted contact requests

## Troubleshooting

If you're still having issues:

1. **Check if you're signed in**: Visit `http://localhost:3000/api/test-admin` to verify authentication
2. **Verify admin user exists**: Check your Supabase `admin_users` table
3. **Check browser console**: Look for any JavaScript errors
4. **Clear browser cache**: Try hard refresh (Ctrl+F5 or Cmd+Shift+R)

## Alternative: Quick Admin Setup

If you want to quickly test without setting up admin access, you can temporarily modify the admin contacts API to bypass authentication:

1. Edit `app/api/admin/contacts/route.ts`
2. Comment out the authentication check temporarily
3. Test the contact form
4. Remember to re-enable authentication for production 