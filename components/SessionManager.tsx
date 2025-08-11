'use client';

import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { clearClerkTokens, useSessionRefresh } from '@/lib/clerk-session';

export default function SessionManager() {
  const { isLoaded, isSignedIn } = useAuth();
  
  // Use the session refresh hook
  useSessionRefresh();

  useEffect(() => {
    if (!isLoaded) return;

    // Check if we have the handshake token in URL (indicates token size issue)
    const urlParams = new URLSearchParams(window.location.search);
    const hasHandshake = urlParams.has('__clerk_handshake');
    
    if (hasHandshake) {
      console.warn('Clerk handshake detected - clearing tokens to prevent HTTP 431');
      clearClerkTokens();
      
      // Redirect to clean URL without the handshake parameter
      const cleanUrl = window.location.origin + window.location.pathname;
      window.location.replace(cleanUrl);
      return;
    }

    // Also check for oversized cookies
    const cookieSize = document.cookie.length;
    if (cookieSize > 8192) { // 8KB limit for headers
      console.warn(`Cookie size too large (${cookieSize} bytes) - clearing Clerk tokens`);
      clearClerkTokens();
      window.location.reload();
    }
  }, [isLoaded]);

  return null; // This component doesn't render anything
}