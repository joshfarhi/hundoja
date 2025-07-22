import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { encrypt } from '@/lib/email-settings';

// GET - Fetch all email settings
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('*')
      .eq('clerk_user_id', userId)
      .eq('is_active', true)
      .single();

    if (!adminUser) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch all email settings
    const { data: settings, error } = await supabase
      .from('email_settings')
      .select('*')
      .order('setting_key');

    if (error) throw error;

    // Decrypt encrypted values for display (but don't show actual passwords)
    const processedSettings = settings.map(setting => ({
      ...setting,
      setting_value: setting.encrypted ? 
        (setting.setting_value && setting.setting_value !== '' ? '••••••••' : '') : 
        setting.setting_value
    }));

    return NextResponse.json(processedSettings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT - Update email settings
export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('*')
      .eq('clerk_user_id', userId)
      .eq('is_active', true)
      .single();

    if (!adminUser) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const formData = await req.json();

    // Get current settings to know which ones are encrypted
    const { data: currentSettings } = await supabase
      .from('email_settings')
      .select('*');

    const settingsMap = new Map(
      currentSettings?.map(s => [s.setting_key, s]) || []
    );

    // Update each setting
    for (const [key, value] of Object.entries(formData)) {
      const currentSetting = settingsMap.get(key);
      
      // Skip if value hasn't changed (for encrypted fields showing ••••••••)
      if (currentSetting?.encrypted && value === '••••••••') {
        continue;
      }

      const finalValue = currentSetting?.encrypted ? encrypt(value as string) : value;

      const { error } = await supabase
        .from('email_settings')
        .upsert({
          setting_key: key,
          setting_value: finalValue,
          encrypted: currentSetting?.encrypted || false,
          updated_by: adminUser.id,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'setting_key'
        });

      if (error) throw error;
    }

    return NextResponse.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

