'use client';

import React from 'react';
import { UserButton, useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Bell, Search, Menu } from 'lucide-react';

export default function AdminHeader() {
  const { user } = useUser();

  return (
    <header className="h-16 bg-black/50 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-6">
      {/* Left section */}
      <div className="flex items-center space-x-4">
        <motion.h1 
          className="text-xl font-semibold text-white"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          Dashboard
        </motion.h1>
      </div>

      {/* Center section - Search */}
      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} />
          <input
            type="text"
            placeholder="Search products, orders, customers..."
            className={cn(
              "w-full pl-10 pr-4 py-2 bg-neutral-800/50 border border-white/10",
              "rounded-lg text-white placeholder-neutral-400",
              "focus:outline-none focus:border-cyan-500/50 focus:bg-neutral-800/80",
              "transition-all duration-200"
            )}
          />
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <motion.button
          className={cn(
            "relative p-2 text-neutral-400 hover:text-white",
            "hover:bg-white/10 rounded-lg transition-all duration-200"
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </motion.button>

        {/* User */}
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="text-sm font-medium text-white">
              {user?.firstName} {user?.lastName}
            </div>
            <div className="text-xs text-neutral-400">Administrator</div>
          </div>
          <UserButton 
            appearance={{
              elements: {
                avatarBox: "h-8 w-8 ring-2 ring-cyan-500/30 hover:ring-cyan-500/60 transition-all"
              }
            }}
          />
        </div>
      </div>
    </header>
  );
}