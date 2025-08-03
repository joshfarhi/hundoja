'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Bell, X } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

export default function NotificationDropdown() {
  const {
    notifications,
    loading,
    error,
    markAsRead,
    deleteNotification,
    clearAllNotifications,
    getIconComponent,
  } = useNotifications();

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
            onClick={clearAllNotifications}
            className="text-xs text-cyan-400 hover:text-white font-semibold transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="text-center py-12 px-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
            <p className="text-sm text-neutral-500">Loading notifications...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 px-4">
            <p className="text-sm text-red-400 mb-2">Error loading notifications</p>
            <p className="text-xs text-neutral-500">{error}</p>
          </div>
        ) : (
          <AnimatePresence>
            {notifications.length > 0 ? (
              notifications.map((notification) => {
                const Icon = getIconComponent(notification.icon_name);
                return (
                  <motion.div
                    key={notification.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
                    className={cn(
                      "group flex items-start space-x-4 p-4 hover:bg-neutral-800/60 transition-colors cursor-pointer",
                      !notification.is_read && "bg-blue-500/10 border-l-2 border-blue-500"
                    )}
                    onClick={() => !notification.is_read && markAsRead(notification.id)}
                  >
                    <div className="flex-shrink-0 mt-1">
                      <Icon className={cn(notification.icon_color, "w-5 h-5")} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white leading-snug font-medium">{notification.title}</p>
                      <p className="text-sm text-neutral-400 leading-snug mt-1">{notification.message}</p>
                      <p className="text-xs text-neutral-500 mt-2">{notification.relative_time}</p>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
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
        )}
      </div>
    </motion.div>
  );
} 