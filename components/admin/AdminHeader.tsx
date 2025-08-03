'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Bell, Search, Menu } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';
import NotificationDropdown from './NotificationDropdown';
import { useNotifications } from '@/hooks/useNotifications';

const getPageTitle = (pathname: string) => {
  if (pathname.startsWith('/admin/products')) return 'Products';
  if (pathname.startsWith('/admin/orders')) return 'Orders';
  if (pathname.startsWith('/admin/customers')) return 'Customers';
  if (pathname.startsWith('/admin/analytics')) return 'Analytics';
  if (pathname.startsWith('/admin/settings')) return 'Settings';
  if (pathname.startsWith('/admin/contacts')) return 'Contact Requests';
  return 'Dashboard';
};

export default function AdminHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const { unreadCount } = useNotifications();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Left section */}
      <div className="flex items-center space-x-4">
        <button onClick={onMenuClick} className="lg:hidden text-white p-2 -ml-2">
          <Menu size={24} />
        </button>
        <motion.h1 
          key={pageTitle} // Add key to re-trigger animation on change
          className="text-xl font-semibold text-white"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {pageTitle}
        </motion.h1>
      </div>

      {/* Center section - Search */}
      <div className="hidden lg:block flex-1 max-w-md mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} />
          <input
            type="text"
            placeholder="Search products, orders, customers..."
            className={cn(
              "w-full pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700",
              "rounded-lg text-white placeholder-neutral-400",
              "focus:outline-none focus:ring-2 focus:ring-cyan-500",
              "transition-all duration-200"
            )}
          />
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Search button for mobile */}
        <button className="lg:hidden text-neutral-400 hover:text-white p-2">
          <Search size={20} />
        </button>
        {/* Notifications */}
        <div ref={notificationRef} className="relative">
          <motion.button
            onClick={() => setIsNotificationsOpen(prev => !prev)}
            className={cn(
              "relative p-2 text-neutral-400 hover:text-white",
              "hover:bg-neutral-800 rounded-lg transition-colors"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <motion.span 
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-neutral-900 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <span className="text-xs text-white font-semibold">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              </motion.span>
            )}
          </motion.button>
          <AnimatePresence>
            {isNotificationsOpen && <NotificationDropdown />}
          </AnimatePresence>
        </div>

        {/* User Button */}
        <UserButton 
          appearance={{
            elements: {
              avatarBox: "h-9 w-9"
            }
          }}
        />
      </div>
    </header>
  );
}