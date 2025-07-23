'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { UserButton, useUser } from '@clerk/nextjs';
import Image from 'next/image';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  MessageSquare,
  Users,
  Settings,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const sidebarItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Orders',
    href: '/admin/orders',
    icon: ShoppingBag,
  },
  {
    title: 'Products',
    href: '/admin/products',
    icon: Package,
  },
  {
    title: 'Contact Requests',
    href: '/admin/contacts',
    icon: MessageSquare,
  },
  {
    title: 'Customers',
    href: '/admin/customers',
    icon: Users,
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
];

export default function AdminSidebar({ isSidebarOpen, isCollapsed: isDesktopCollapsed, onCollapseToggle, onMobileClose }: { isSidebarOpen: boolean, isCollapsed: boolean, onCollapseToggle: () => void, onMobileClose: () => void }) {
  const pathname = usePathname();
  const { user } = useUser();

  return (
    <div className={cn(
      "fixed left-0 top-0 z-40 h-screen bg-neutral-900 border-r border-neutral-800 transition-transform duration-300 ease-in-out flex flex-col",
      "lg:translate-x-0",
      isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
      isDesktopCollapsed ? "lg:w-20" : "lg:w-64",
      "w-64" // Full width on mobile when open
    )}>
      {/* Header */}
      <div className={cn(
        "flex items-center border-b border-neutral-800 h-16 flex-shrink-0 px-4",
        isDesktopCollapsed ? "lg:justify-center" : "lg:justify-between"
      )}>
        <AnimatePresence>
          {!isDesktopCollapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="whitespace-nowrap overflow-hidden"
            >
              <Image src="/Hundoja-2025-logo.webp" alt="Hundoja Logo" width={120} height={40} className="mt-2" />
            </motion.div>
          )}
        </AnimatePresence>
        
        <button
          onClick={onCollapseToggle}
          className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors hidden lg:block"
        >
          {isDesktopCollapsed ? <ChevronRight size={24} /> : <ChevronLeft size={20} />}
        </button>

        <button
          onClick={onMobileClose}
          className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors lg:hidden"
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2 flex-grow">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link href={item.href} title={item.title} key={item.href}>
              <motion.div
                className={cn(
                  "flex items-center space-x-4 px-3 py-3 rounded-lg transition-colors duration-200",
                  "hover:bg-neutral-800 group relative",
                  isActive && "bg-cyan-500/10",
                  isDesktopCollapsed && "lg:justify-center lg:space-x-0"
                )}
                whileTap={{ scale: 0.98 }}
              >
                <Icon 
                  size={22} 
                  className={cn(
                    "transition-colors flex-shrink-0",
                    isActive ? "text-cyan-400" : "text-neutral-400 group-hover:text-white"
                  )} 
                />
                <AnimatePresence>
                  {(!isDesktopCollapsed || isSidebarOpen) && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0, transition: { duration: 0.1 } }}
                      transition={{ duration: 0.2, delay: 0.1 }}
                      className={cn(
                        "font-medium whitespace-nowrap overflow-hidden",
                        isActive ? "text-white" : "text-neutral-300 group-hover:text-white"
                      )}
                    >
                      {item.title}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-4 border-t border-neutral-800 flex-shrink-0">
        <div className={cn(
            "flex items-center",
            isDesktopCollapsed ? "lg:justify-center" : "lg:justify-start lg:space-x-3"
          )}>
          <UserButton 
            appearance={{
              elements: {
                avatarBox: "h-10 w-10 ring-2 ring-neutral-700 hover:ring-cyan-500/60 transition-all flex-shrink-0"
              }
            }}
          />
          <AnimatePresence>
            {!isDesktopCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="whitespace-nowrap overflow-hidden"
              >
                <div className="text-sm font-medium text-white">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-xs text-neutral-400">Administrator</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}