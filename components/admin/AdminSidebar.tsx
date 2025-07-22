'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
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

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <motion.div
      className={cn(
        "fixed left-0 top-0 z-40 h-screen transition-all duration-300",
        "bg-gradient-to-b from-neutral-900 to-neutral-800 border-r border-white/10",
        isCollapsed ? "w-16" : "w-64"
      )}
      initial={{ x: -100 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-xl font-bold text-white"
          >
            HUNDOJA ADMIN
          </motion.div>
        )}
        <motion.button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-all"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </motion.button>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {sidebarItems.map((item, index) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={item.href}>
                <motion.div
                  className={cn(
                    "flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200",
                    "hover:bg-white/10 group relative overflow-hidden",
                    isActive && "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30"
                  )}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon 
                    size={20} 
                    className={cn(
                      "transition-colors",
                      isActive ? "text-cyan-400" : "text-neutral-400 group-hover:text-white"
                    )} 
                  />
                  {!isCollapsed && (
                    <motion.span
                      className={cn(
                        "font-medium transition-colors",
                        isActive ? "text-white" : "text-neutral-300 group-hover:text-white"
                      )}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {item.title}
                    </motion.span>
                  )}
                  {isActive && (
                    <motion.div
                      className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </motion.div>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className={cn(
          "p-3 rounded-lg bg-gradient-to-r from-neutral-800/50 to-neutral-700/50",
          "border border-white/10"
        )}>
          {!isCollapsed ? (
            <div className="text-xs text-neutral-400">
              <div className="font-medium text-white mb-1">Admin Panel</div>
              <div>Manage your store</div>
            </div>
          ) : (
            <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"></div>
          )}
        </div>
      </div>
    </motion.div>
  );
}