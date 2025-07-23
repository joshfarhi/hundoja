'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ShoppingBag, Package, UserPlus, Bell, X } from 'lucide-react';

const initialNotifications = [
  {
    id: 1,
    type: 'new_order',
    text: 'New order #ORD-003 received from John Doe',
    time: '2 minutes ago',
    icon: ShoppingBag,
    iconColor: 'text-blue-400',
  },
  {
    id: 2,
    type: 'low_stock',
    text: 'Low stock alert: "Shadow Hoodie" has only 3 items left',
    time: '1 hour ago',
    icon: Package,
    iconColor: 'text-yellow-400',
  },
  {
    id: 3,
    type: 'new_customer',
    text: 'A new customer, Jane Smith, has registered',
    time: '3 hours ago',
    icon: UserPlus,
    iconColor: 'text-green-400',
  },
  {
    id: 4,
    type: 'new_order',
    text: 'New order #ORD-002 received from Jane Smith',
    time: 'yesterday',
    icon: ShoppingBag,
    iconColor: 'text-blue-400',
  },
];

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState(initialNotifications);

  const handleClearAll = () => setNotifications([]);
  const handleClearOne = (id: number) => setNotifications(prev => prev.filter(n => n.id !== id));

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="absolute top-full right-0 mt-2 w-80 rounded-xl overflow-hidden z-50 bg-neutral-900/95 backdrop-blur-xl border border-neutral-700 shadow-2xl shadow-black/50"
    >
      <div className="p-4 border-b border-neutral-800 flex justify-between items-center">
        <h3 className="font-semibold text-white">Notifications</h3>
        {notifications.length > 0 && (
          <button 
            onClick={handleClearAll}
            className="text-xs text-cyan-400 hover:text-white font-semibold transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        <AnimatePresence>
          {notifications.length > 0 ? (
            notifications.map((notification) => {
              const Icon = notification.icon;
              return (
                <motion.div
                  key={notification.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
                  className="group flex items-start space-x-4 p-4 hover:bg-neutral-800/60 transition-colors"
                >
                  <div className="flex-shrink-0 mt-1">
                    <Icon className={cn(notification.iconColor, "w-5 h-5")} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white leading-snug">{notification.text}</p>
                    <p className="text-xs text-neutral-500 mt-1">{notification.time}</p>
                  </div>
                  <button 
                    onClick={() => handleClearOne(notification.id)}
                    className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-white transition-opacity"
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              );
            })
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 px-4"
            >
              <Bell size={32} className="text-neutral-600 mx-auto mb-4" />
              <h4 className="font-semibold text-white">All caught up!</h4>
              <p className="text-sm text-neutral-500 mt-1">You have no new notifications.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
} 