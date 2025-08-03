import { supabase } from './supabase';

export interface NotificationData {
  type: 'new_order' | 'low_stock' | 'new_customer' | 'payment_received' | 'contact_request' | 'system_alert';
  title: string;
  message: string;
  icon_name?: string;
  icon_color?: string;
  metadata?: Record<string, any>;
}

const defaultIcons: Record<string, string> = {
  new_order: 'ShoppingBag',
  low_stock: 'Package',
  new_customer: 'UserPlus',
  payment_received: 'CreditCard',
  contact_request: 'Mail',
  system_alert: 'AlertTriangle',
};

const defaultColors: Record<string, string> = {
  new_order: 'text-blue-400',
  low_stock: 'text-yellow-400',
  new_customer: 'text-green-400',
  payment_received: 'text-green-400',
  contact_request: 'text-purple-400',
  system_alert: 'text-red-400',
};

export async function createNotification(data: NotificationData): Promise<void> {
  try {
    const { type, title, message, icon_name, icon_color, metadata = {} } = data;

    await supabase
      .from('notifications')
      .insert({
        type,
        title,
        message,
        icon_name: icon_name || defaultIcons[type] || 'Bell',
        icon_color: icon_color || defaultColors[type] || 'text-blue-400',
        metadata
      });

    console.log(`Notification created: ${type} - ${title}`);
  } catch (error) {
    console.error('Error creating notification:', error);
    // Don't throw error to avoid breaking the main functionality
  }
}

// Convenience functions for common notification types
export async function createOrderNotification(orderData: {
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  orderId: string;
}): Promise<void> {
  await createNotification({
    type: 'new_order',
    title: 'New Order Received',
    message: `New order #${orderData.orderNumber} received from ${orderData.customerName}`,
    metadata: {
      order_id: orderData.orderId,
      order_number: orderData.orderNumber,
      customer_name: orderData.customerName,
      total_amount: orderData.totalAmount
    }
  });
}

export async function createLowStockNotification(productData: {
  productName: string;
  currentStock: number;
  productId: string;
}): Promise<void> {
  await createNotification({
    type: 'low_stock',
    title: 'Low Stock Alert',
    message: `Low stock alert: "${productData.productName}" has only ${productData.currentStock} items left`,
    metadata: {
      product_id: productData.productId,
      product_name: productData.productName,
      current_stock: productData.currentStock
    }
  });
}

export async function createCustomerNotification(customerData: {
  customerName: string;
  email: string;
  customerId: string;
}): Promise<void> {
  await createNotification({
    type: 'new_customer',
    title: 'New Customer Registration',
    message: `A new customer, ${customerData.customerName}, has registered`,
    metadata: {
      customer_id: customerData.customerId,
      customer_name: customerData.customerName,
      email: customerData.email
    }
  });
}

export async function createPaymentNotification(paymentData: {
  orderNumber: string;
  amount: number;
  orderId: string;
}): Promise<void> {
  await createNotification({
    type: 'payment_received',
    title: 'Payment Received',
    message: `Payment received for order #${paymentData.orderNumber}`,
    metadata: {
      order_id: paymentData.orderId,
      order_number: paymentData.orderNumber,
      amount: paymentData.amount
    }
  });
}

export async function createContactNotification(contactData: {
  name: string;
  email: string;
  subject: string;
  contactId: string;
}): Promise<void> {
  await createNotification({
    type: 'contact_request',
    title: 'New Contact Request',
    message: `New contact request from ${contactData.name}: ${contactData.subject}`,
    metadata: {
      contact_id: contactData.contactId,
      name: contactData.name,
      email: contactData.email,
      subject: contactData.subject
    }
  });
} 