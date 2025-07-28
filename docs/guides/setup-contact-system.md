# Setting Up Contact System

This guide will help you set up the contact form system so that submissions appear in your admin dashboard.

## Prerequisites

1. You have a Supabase database set up
2. You have run the main database schema (`docs/sql/supabase-schema.sql`)
3. Your environment variables are configured

## Step 1: Verify Database Schema

First, make sure the contact_requests table exists in your database. Run this in your Supabase SQL Editor:

```sql
-- Check if contact_requests table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'contact_requests'
);
```

If it returns `false`, you need to run the main schema:

```sql
-- Run the main schema (this includes contact_requests table)
-- Copy and paste the contents of docs/sql/supabase-schema.sql
```

## Step 2: Create Contact Requests Table (if missing)

If the table doesn't exist, you can create it manually:

```sql
-- Create contact_requests table
CREATE TABLE IF NOT EXISTS contact_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    subject VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'general',
    priority VARCHAR(20) DEFAULT 'normal',
    status VARCHAR(20) DEFAULT 'new',
    assigned_to VARCHAR(255),
    tags TEXT[],
    
    -- Response tracking
    first_response_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    source VARCHAR(50) DEFAULT 'web',
    user_agent TEXT,
    ip_address INET,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contact_requests_status ON contact_requests(status);
CREATE INDEX IF NOT EXISTS idx_contact_requests_category ON contact_requests(category);
CREATE INDEX IF NOT EXISTS idx_contact_requests_priority ON contact_requests(priority);
CREATE INDEX IF NOT EXISTS idx_contact_requests_email ON contact_requests(email);
CREATE INDEX IF NOT EXISTS idx_contact_requests_created_at ON contact_requests(created_at);

-- Create trigger for updated_at
CREATE TRIGGER update_contact_requests_updated_at 
    BEFORE UPDATE ON contact_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Step 3: Test the Contact Form

1. **Visit your contact page**: `http://localhost:3000/contact`
2. **Fill out the form** with test data
3. **Submit the form**
4. **Check the browser console** for any error messages
5. **Check your server logs** for detailed error information

## Step 4: Verify Database Connection

Test if your Supabase connection is working:

```sql
-- Test insert
INSERT INTO contact_requests (
    ticket_number, 
    name, 
    email, 
    subject, 
    message, 
    category, 
    priority
) VALUES (
    'TKT-TEST-001',
    'Test User',
    'test@example.com',
    'Test Subject',
    'Test message content',
    'general',
    'normal'
);

-- Check if it was inserted
SELECT * FROM contact_requests WHERE ticket_number = 'TKT-TEST-001';

-- Clean up test data
DELETE FROM contact_requests WHERE ticket_number = 'TKT-TEST-001';
```

## Step 5: Check Environment Variables

Make sure these environment variables are set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Troubleshooting

### "relation 'contact_requests' does not exist"
- Run the database schema: `docs/sql/supabase-schema.sql`
- Or create the table manually using the SQL above

### "permission denied"
- Check your Supabase RLS (Row Level Security) policies
- Make sure the table has proper permissions

### "invalid input syntax for type inet"
- The IP address field might be causing issues
- Check if your IP address format is valid

### "duplicate key value violates unique constraint"
- The ticket_number is already in use
- This is rare but can happen with concurrent requests

### Database Connection Issues
- Verify your Supabase URL and API key
- Check if your Supabase project is active
- Ensure your IP is not blocked by Supabase

## Testing the Complete Flow

1. **Submit a contact form** from the website
2. **Check the admin dashboard** at `/admin/contacts`
3. **Verify the contact appears** in the list
4. **Test filtering and search** functionality

## Next Steps

Once the contact system is working:

1. **Set up email notifications** for new contact requests
2. **Configure admin user permissions**
3. **Add response functionality** to reply to contacts
4. **Set up automated workflows** for different contact categories

## Support

If you're still having issues:

1. Check the browser console for JavaScript errors
2. Check the server logs for API errors
3. Verify your database schema is correct
4. Test the Supabase connection directly

The contact system should now be fully functional and submissions will appear in your admin dashboard! 