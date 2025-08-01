import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

// Encryption key must be provided via environment variable
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY && process.env.NODE_ENV !== 'test') {
  // Only throw error in runtime, not during build
  if (typeof window === 'undefined' && process.env.NEXT_PHASE !== 'phase-production-build') {
    throw new Error('ENCRYPTION_KEY environment variable is required for email settings encryption');
  }
}

// Generate a key from the environment variable (only when needed)
let KEY: Buffer | null = null;
const IV_LENGTH = 16; // For AES, this is always 16

function getKey(): Buffer {
  if (!KEY && ENCRYPTION_KEY) {
    KEY = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  }
  if (!KEY) {
    throw new Error('ENCRYPTION_KEY environment variable is required for email settings encryption');
  }
  return KEY;
}

// Secure encryption/decryption functions
function encrypt(text: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedText: string): string {
  try {
    const key = getKey();
    const textParts = encryptedText.split(':');
    if (textParts.length !== 2) {
      // Handle legacy encryption format
      return encryptedText;
    }
    const iv = Buffer.from(textParts[0], 'hex');
    const encrypted = textParts[1];
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    // Log error but don't expose encryption details
    if (process.env.NODE_ENV === 'development') {
      console.error('Decryption error:', error);
    }
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
    // Log error but don't expose details in production
    if (process.env.NODE_ENV === 'development') {
      console.error(`Error getting setting ${key}:`, error);
    }
    return null;
  }
}

export { encrypt, decrypt };