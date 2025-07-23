'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import { AdminProvider } from '@/contexts/AdminContext';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { AnimatePresence } from 'framer-motion';
import { motion } from 'framer-motion';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoaded, userId } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    async function checkAdminStatus() {
      if (!userId) {
        setIsAdmin(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('admin_users')
          .select('id, role')
          .eq('clerk_user_id', userId)
          .eq('is_active', true);
        
        setIsAdmin(!error && data && data.length > 0);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    }
    
    if (isLoaded) {
      checkAdminStatus();
    }
  }, [isLoaded, userId]);

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