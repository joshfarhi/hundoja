import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Bell, ShoppingBag, Package, UserPlus, CreditCard, AlertTriangle } from 'lucide-react';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  icon_name: string;
  icon_color: string;
  is_read: boolean;
  is_cleared: boolean;
  metadata: any;
  created_at: string;
  relative_time: string;
}

const iconMap: { [key: string]: any } = {
  Bell,
  ShoppingBag,
  Package,
  UserPlus,
  CreditCard,
  AlertTriangle,
};

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/notifications');
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const data = await response.json();
      setNotifications(data.notifications || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (id: string) => {
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, is_read: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, is_read: true }
            : notification
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, []);

  // Delete a single notification
  const deleteNotification = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/admin/notifications?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }

      // Remove from local state
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/notifications?clearAll=true', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to clear notifications');
      }

      // Clear local state
      setNotifications([]);
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  }, []);

  // Get icon component
  const getIconComponent = useCallback((iconName: string) => {
    return iconMap[iconName] || Bell;
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    // Initial fetch
    fetchNotifications();

    // Set up real-time subscription
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          console.log('Notification change:', payload);
          
          if (payload.eventType === 'INSERT') {
            // New notification added
            const newNotification = payload.new as Notification;
            setNotifications(prev => [newNotification, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            // Notification updated (marked as read/cleared)
            const updatedNotification = payload.new as Notification;
            setNotifications(prev => 
              prev.map(notification => 
                notification.id === updatedNotification.id 
                  ? updatedNotification
                  : notification
              ).filter(notification => !notification.is_cleared)
            );
          } else if (payload.eventType === 'DELETE') {
            // Notification deleted
            const deletedNotification = payload.old as Notification;
            setNotifications(prev => 
              prev.filter(notification => notification.id !== deletedNotification.id)
            );
          }
        }
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications]);

  // Get unread count
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead,
    deleteNotification,
    clearAllNotifications,
    getIconComponent,
    refetch: fetchNotifications,
  };
} 