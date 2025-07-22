-- Create only the email_settings table and related components
-- This avoids conflicts with existing tables

-- Create email_settings table (for Gmail configuration)
CREATE TABLE IF NOT EXISTS public.email_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    encrypted BOOLEAN DEFAULT false,
    description TEXT,
    updated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for email settings
CREATE INDEX IF NOT EXISTS idx_email_settings_key ON public.email_settings(setting_key);

-- Enable RLS for email settings
ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for email settings (assuming admin_users table exists)
CREATE POLICY "Admin users can manage email settings" ON public.email_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE clerk_user_id = auth.jwt() ->> 'sub' AND is_active = true
        )
    );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.email_settings
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Insert default Gmail settings
INSERT INTO public.email_settings (setting_key, setting_value, encrypted, description) VALUES
('gmail_user', '', false, 'Gmail email address for sending newsletters and notifications'),
('gmail_app_password', '', true, 'Gmail app password for SMTP authentication'),
('newsletter_from_name', 'Hundoja', false, 'Display name for newsletter emails'),
('admin_notification_enabled', 'true', false, 'Enable admin notifications for new subscribers')
ON CONFLICT (setting_key) DO NOTHING;