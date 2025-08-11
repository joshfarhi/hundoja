'use client';

import { useAuth, useSession } from '@clerk/nextjs';
import { useEffect } from 'react';

export function useSessionRefresh() {
  const { getToken, isSignedIn } = useAuth();
  const { session } = useSession();

  useEffect(() => {
    if (!isSignedIn || !session) return;

    const refreshToken = async () => {
      try {
        // Force token refresh to prevent oversized tokens
        await getToken({ template: 'supabase' });
      } catch (error) {
        console.warn('Token refresh failed:', error);
      }
    };

    // Refresh token every 30 minutes
    const interval = setInterval(refreshToken, 30 * 60 * 1000);
    
    // Initial refresh on mount
    refreshToken();

    return () => clearInterval(interval);
  }, [getToken, isSignedIn, session]);
}

export function clearClerkTokens() {
  if (typeof window === 'undefined') return;
  
  // Clear all Clerk-related cookies and localStorage
  const cookies = document.cookie.split(';');
  
  cookies.forEach(cookie => {
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    
    if (name.startsWith('__clerk') || name.startsWith('__session') || name.startsWith('__client')) {
      // Clear cookie for current domain
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;`;
      // Clear cookie for localhost specifically
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=localhost;`;
      // Clear cookie without domain
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=;`;
    }
  });
  
  // Clear localStorage items
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('__clerk') || key.startsWith('clerk-')) {
      localStorage.removeItem(key);
    }
  });
  
  // Clear sessionStorage items
  Object.keys(sessionStorage).forEach(key => {
    if (key.startsWith('__clerk') || key.startsWith('clerk-')) {
      sessionStorage.removeItem(key);
    }
  });
}