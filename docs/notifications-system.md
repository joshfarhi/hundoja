# Real-Time Notifications System

This document describes the real-time notifications system implemented for the HUNDOJA admin dashboard.

## Overview

The notifications system provides real-time updates to admin users about various events in the e-commerce platform, including new orders, customer registrations, contact requests, and system alerts.

## Features

- **Real-time Updates**: Notifications appear instantly using Supabase real-time subscriptions
- **Persistent Storage**: All notifications are stored in the database
- **Read/Unread Status**: Notifications can be marked as read
- **Individual & Bulk Actions**: Delete individual notifications or clear all
- **Visual Indicators**: Unread count badge on the notification bell
- **Rich Metadata**: Each notification includes relevant data for context

## Database Schema

### Notifications Table

```sql
CREATE TABLE public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(50) NOT NULL, -- 'new_order', 'low_stock', 'new_customer', etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    icon_name VARCHAR(50) DEFAULT 'Bell', -- Lucide icon name
    icon_color VARCHAR(50) DEFAULT 'text-blue-400',
    is_read BOOLEAN DEFAULT FALSE,
    is_cleared BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}', -- Additional data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Database Function

The system includes a PostgreSQL function `get_notifications_with_relative_time()` that returns notifications with human-readable relative timestamps.

## Notification Types

| Type | Icon | Color | Description |
|------|------|-------|-------------|
| `new_order` | ShoppingBag | text-blue-400 | New order received |
| `low_stock` | Package | text-yellow-400 | Product low stock alert |
| `new_customer` | UserPlus | text-green-400 | New customer registration |
| `payment_received` | CreditCard | text-green-400 | Payment confirmation |
| `contact_request` | Mail | text-purple-400 | New contact form submission |
| `system_alert` | AlertTriangle | text-red-400 | System warnings/errors |

## API Endpoints

### GET /api/admin/notifications
Fetch all notifications for the authenticated admin user.

**Response:**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "type": "new_order",
      "title": "New Order Received",
      "message": "New order #ORD-001 received from John Doe",
      "icon_name": "ShoppingBag",
      "icon_color": "text-blue-400",
      "is_read": false,
      "is_cleared": false,
      "metadata": { "order_id": "123", "customer_name": "John Doe" },
      "created_at": "2024-01-01T12:00:00Z",
      "relative_time": "2 minutes ago"
    }
  ]
}
```

### POST /api/admin/notifications
Create a new notification.

**Request Body:**
```json
{
  "type": "new_order",
  "title": "New Order Received",
  "message": "New order #ORD-001 received from John Doe",
  "icon_name": "ShoppingBag",
  "icon_color": "text-blue-400",
  "metadata": { "order_id": "123" }
}
```

### PUT /api/admin/notifications
Mark a notification as read.

**Request Body:**
```json
{
  "id": "notification-uuid",
  "is_read": true
}
```

### DELETE /api/admin/notifications?id={id}
Delete a specific notification.

### DELETE /api/admin/notifications?clearAll=true
Clear all notifications (marks them as cleared).

## React Hook: useNotifications

The `useNotifications` hook provides a complete interface for managing notifications:

```typescript
const {
  notifications,        // Array of notifications
  loading,             // Loading state
  error,               // Error state
  unreadCount,         // Number of unread notifications
  markAsRead,          // Function to mark as read
  deleteNotification,  // Function to delete notification
  clearAllNotifications, // Function to clear all
  getIconComponent,    // Function to get icon component
  refetch             // Function to refetch notifications
} = useNotifications();
```

## Real-Time Updates

The system uses Supabase real-time subscriptions to automatically update the UI when:

- New notifications are created
- Notifications are marked as read
- Notifications are deleted/cleared

## Integration Points

### Automatic Notification Creation

The system automatically creates notifications for:

1. **New Orders** (`/api/orders/create`)
   - Triggered when a customer places an order
   - Includes order details and customer information

2. **Newsletter Subscriptions** (`/api/newsletter`)
   - Triggered when someone subscribes to the newsletter
   - Includes subscriber information

3. **Contact Requests** (`/api/contact`)
   - Triggered when someone submits a contact form
   - Includes contact details and message subject

### Manual Notification Creation

You can create notifications programmatically using the utility functions:

```typescript
import { createNotification, createOrderNotification } from '@/lib/notifications';

// Generic notification
await createNotification({
  type: 'system_alert',
  title: 'System Maintenance',
  message: 'Scheduled maintenance in 30 minutes',
  icon_name: 'AlertTriangle',
  icon_color: 'text-red-400'
});

// Specific notification types
await createOrderNotification({
  orderNumber: 'ORD-001',
  customerName: 'John Doe',
  totalAmount: 99.99,
  orderId: 'order-123'
});
```

## UI Components

### NotificationDropdown
The main notification dropdown component that displays all notifications with:
- Loading states
- Error handling
- Read/unread visual indicators
- Individual delete buttons
- Clear all functionality

### AdminHeader Integration
The notification bell in the admin header shows:
- Unread count badge
- Real-time updates
- Click to open dropdown

## Setup Instructions

1. **Run the Database Migration**
   ```sql
   -- Execute the notifications-migration.sql file
   ```

2. **Update Environment Variables**
   Ensure your Supabase configuration is properly set up for real-time subscriptions.

3. **Test the System**
   ```bash
   node test-notifications.js
   ```

## Best Practices

1. **Error Handling**: Notification creation should never break the main functionality
2. **Performance**: Use the `is_cleared` flag instead of deleting records
3. **User Experience**: Provide immediate feedback for user actions
4. **Security**: All endpoints require admin authentication
5. **Scalability**: Consider pagination for large notification lists

## Troubleshooting

### Common Issues

1. **Real-time not working**: Check Supabase real-time configuration
2. **Notifications not appearing**: Verify database permissions and RLS policies
3. **Icon not showing**: Ensure the icon name matches a Lucide React icon
4. **Permission errors**: Verify the user is an admin in the `admin_users` table

### Debug Mode

Enable debug logging by checking the browser console for notification-related messages.

## Future Enhancements

- Email notifications for critical alerts
- Notification preferences per admin user
- Notification categories and filtering
- Push notifications for mobile
- Notification sound alerts
- Bulk actions (mark multiple as read)
- Notification templates
- Notification analytics 