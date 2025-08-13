import { auth, currentUser } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';

// Hardcoded allowed admin emails for maximum security
const ALLOWED_ADMIN_EMAILS = [
  'joshfarhi12@gmail.com',
  'm.zalo@icloud.com',
  'hundoja@gmail.com'
];

export async function checkAdminAccess() {
  const { userId } = await auth();
  const user = await currentUser();
  
  if (!userId || !user?.primaryEmailAddress?.emailAddress) {
    return { isAdmin: false, error: 'No user found' };
  }
  
  const userEmail = user.primaryEmailAddress.emailAddress;
  
  // First check: Hardcoded email security (primary protection)
  if (!ALLOWED_ADMIN_EMAILS.includes(userEmail)) {
    return { isAdmin: false, error: 'Email not authorized' };
  }
  
  // Second check: Database verification (secondary protection)
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('id, role, email')
      .eq('clerk_user_id', userId)
      .eq('is_active', true)
      .eq('email', userEmail);
    
    if (error || !data || data.length === 0) {
      return { isAdmin: false, error: 'Not found in admin database' };
    }
    
    return { isAdmin: true, user: data[0] };
  } catch (error) {
    console.error('Error checking admin status:', error);
    return { isAdmin: false, error: 'Database error' };
  }
}