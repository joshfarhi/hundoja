import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

// Encryption key - in production, use a proper key from environment variables
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-encryption-key!!';

// Simple encryption/decryption functions
function encrypt(text: string): string {
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decrypt(encryptedText: string): string {
  try {
    const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedText; // Return as-is if decryption fails
  }
}

// Helper function to get decrypted setting value
export async function getSettingValue(key: string): Promise<string | null> {
  try {
    const { data: setting } = await supabase
      .from('email_settings')
      .select('*')
      .eq('setting_key', key)
      .single();

    if (!setting || !setting.setting_value) return null;

    return setting.encrypted ? decrypt(setting.setting_value) : setting.setting_value;
  } catch (error) {
    console.error(`Error getting setting ${key}:`, error);
    return null;
  }
}

export { encrypt, decrypt };