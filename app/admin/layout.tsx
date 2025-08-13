'use client';

import React, { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import { AdminProvider } from '@/contexts/AdminContext';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { AnimatePresence } from 'framer-motion';
import { motion } from 'framer-motion';

// Hardcoded allowed admin emails for maximum security
const ALLOWED_ADMIN_EMAILS = [
  'joshfarhi12@gmail.com',
  'm.zalo@icloud.com', 
  'hundoja@gmail.com'
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    async function checkAdminStatus() {
      if (!userId || !user?.primaryEmailAddress?.emailAddress) {
        setIsAdmin(false);
        return;
      }
      
      const userEmail = user.primaryEmailAddress.emailAddress;
      
      // First check: Hardcoded email security (primary protection)
      if (!ALLOWED_ADMIN_EMAILS.includes(userEmail)) {
        setIsAdmin(false);
        return;
      }
      
      // Second check: Database verification (secondary protection)
      try {
        const { data, error } = await supabase
          .from('admin_users')
          .select('id, role, email')
          .eq('clerk_user_id', userId)
          .eq('is_active', true)
          .eq('email', userEmail);
        
        const isValidAdmin = !error && data && data.length > 0;
        setIsAdmin(isValidAdmin);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    }
    
    if (isLoaded && user) {
      checkAdminStatus();
    }
  }, [isLoaded, userId, user]);

  if (!isLoaded || isAdmin === null) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!userId || !isAdmin) {
    redirect('/');
  }

  return (
    <AdminProvider>
      <div className="min-h-screen bg-black text-white">
        <div className="flex">
          <AdminSidebar 
            isSidebarOpen={isSidebarOpen} 
            isCollapsed={isCollapsed} 
            onCollapseToggle={() => setIsCollapsed(!isCollapsed)}
            onMobileClose={() => setIsSidebarOpen(false)}
          />
          
          {/* Overlay for mobile */}
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 bg-black/50 z-30 lg:hidden"
              />
            )}
          </AnimatePresence>

          <div className={cn(
            "flex-1 transition-all duration-300",
            {
              "lg:ml-64": !isCollapsed,
              "lg:ml-20": isCollapsed,
            }
          )}>
            <AdminHeader onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
            <main className="p-4 sm:p-6">
              {children}
            </main>
          </div>
        </div>
      </div>
    </AdminProvider>
  );
}