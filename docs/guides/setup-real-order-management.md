# Real Order Management Implementation

This document outlines the implementation steps to connect the checkout process to the database and update the admin Orders Management page to display real orders instead of demo data.

## Current State Analysis

### ✅ Database Schema (Already Exists)
The database already has a comprehensive e-commerce schema with:

- `customers` - Customer profiles linked to Clerk users  
- `orders` - Complete order lifecycle management
- `order_items` - Individual line items with product snapshots
- `products` & `product_variants` - Product catalog

### ❌ Missing Connections
- Checkout process doesn't save orders to database
- Admin Orders page uses demo data instead of real orders
- No order creation API endpoints
- No customer record creation during checkout

## Implementation Steps

### Step 1: Database Enhancements (Optional)

The existing schema is comprehensive, but you may want to add these enhancements:

```sql
-- Add indexes for better performance (if not already exist)
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- Add Stripe payment intent tracking
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_payment_status VARCHAR(50);

-- Add order number generation function
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    new_number VARCHAR(50);
    counter INTEGER;
BEGIN
    -- Get current date in YYYYMMDD format
    -- Generate order number like ORD-20250125-0001
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 13) AS INTEGER)), 0) + 1
    INTO counter
    FROM orders 
    WHERE order_number LIKE 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-%';
    
    new_number := 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 4, '0');
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;
```

### Step 2: Create Order Processing API

Create `/app/api/orders/create/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  image: string;
}

interface OrderData {
  items: CartItem[];
  total: number;
  subtotal: number;
  tax?: number;
  shipping?: number;
  billing_address: {
    name: string;
    email: string;
    phone?: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  shipping_address: {
    name: string;
    email: string;
    phone?: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  stripe_payment_intent_id?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orderData: OrderData = await req.json();
    
    // Validate required fields
    if (!orderData.items || orderData.items.length === 0) {
      return NextResponse.json({ error: 'Order must have items' }, { status: 400 });
    }

    // Create or get customer record
    let customer;
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('*')
      .eq('clerk_user_id', userId)
      .single();

    if (existingCustomer) {
      customer = existingCustomer;
    } else {
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          clerk_user_id: userId,
          email: orderData.billing_address.email,
          first_name: orderData.billing_address.name.split(' ')[0] || '',
          last_name: orderData.billing_address.name.split(' ').slice(1).join(' ') || '',
          phone: orderData.billing_address.phone || null,
        })
        .select()
        .single();

      if (customerError) {
        console.error('Error creating customer:', customerError);
        return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
      }
      customer = newCustomer;
    }

    // Generate order number
    const { data: orderNumber, error: orderNumberError } = await supabase
      .rpc('generate_order_number');

    if (orderNumberError) {
      console.error('Error generating order number:', orderNumberError);
      return NextResponse.json({ error: 'Failed to generate order number' }, { status: 500 });
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_id: customer.id,
        email: orderData.billing_address.email,
        status: 'pending',
        payment_status: 'pending',
        subtotal: orderData.subtotal,
        tax_amount: orderData.tax || 0,
        shipping_amount: orderData.shipping || 0,
        total_amount: orderData.total,
        billing_address: orderData.billing_address,
        shipping_address: orderData.shipping_address,
        stripe_payment_intent_id: orderData.stripe_payment_intent_id,
        stripe_payment_status: 'pending',
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    // Create order items
    const orderItems = orderData.items.map(item => ({
      order_id: order.id,
      product_id: item.id, // This should map to actual product ID
      sku: `${item.id}-${item.size || 'default'}-${item.color || 'default'}`,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      total: item.price * item.quantity,
      product_snapshot: {
        name: item.name,
        price: item.price,
        image: item.image,
        size: item.size,
        color: item.color,
      },
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      // Rollback order creation
      await supabase.from('orders').delete().eq('id', order.id);
      return NextResponse.json({ error: 'Failed to create order items' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      order_id: order.id,
      order_number: order.order_number 
    });

  } catch (error) {
    console.error('Error in order creation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Step 3: Create Webhook for Payment Updates

Create `/app/api/webhooks/stripe/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createStripeInstance } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';
import { headers } from 'next/headers';

const stripe = createStripeInstance();

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        
        // Update order payment status
        const { error } = await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            status: 'processing',
            stripe_payment_status: 'succeeded',
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        if (error) {
          console.error('Error updating order payment status:', error);
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        
        await supabase
          .from('orders')
          .update({
            payment_status: 'failed',
            stripe_payment_status: 'failed',
          })
          .eq('stripe_payment_intent_id', failedPayment.id);
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 });
  }
}
```

### Step 4: Update Checkout Process

Update `components/CheckoutForm.tsx`:

```typescript
// Add this after successful payment confirmation and before clearing cart
const orderData = {
  items: state.items,
  total: state.total,
  subtotal: state.total, // Adjust if you have tax/shipping
  billing_address: {
    name: 'Customer Name', // Get from form
    email: 'customer@email.com', // Get from Clerk user
    line1: 'Address Line 1', // Get from form
    city: 'City', // Get from form
    state: 'State', // Get from form
    postal_code: 'ZIP', // Get from form
    country: 'US',
  },
  shipping_address: {
    // Same as billing or separate form
  },
  stripe_payment_intent_id: paymentIntent.id,
};

// Create order in database
const orderResponse = await fetch('/api/orders/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(orderData),
});

if (!orderResponse.ok) {
  console.error('Failed to create order record');
}
```

### Step 5: Update Admin Orders Page

Update `app/admin/orders/page.tsx` to fetch real orders:

```typescript
// Replace demo data with real database fetch
useEffect(() => {
  async function fetchOrders() {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            name,
            quantity,
            price,
            total,
            product_snapshot
          ),
          customers (
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Transform data to match current interface
      const transformedOrders = orders.map(order => ({
        id: order.order_number,
        customer: {
          name: `${order.customers?.first_name || ''} ${order.customers?.last_name || ''}`.trim() || 'Unknown',
          email: order.email,
        },
        products: order.order_items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        total: order.total_amount,
        status: order.status,
        paymentStatus: order.payment_status,
        orderDate: order.created_at,
        isDemo: false,
      }));

      setOrders(transformedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  }

  fetchOrders();
}, []);
```

## Environment Variables

Add to `.env.local`:

```env
# Stripe Webhook (for payment status updates)
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Testing Steps

### 1. Test Order Creation
1. Add items to cart
2. Go through checkout process
3. Complete payment
4. Check that order appears in Supabase `orders` table
5. Verify order items are created in `order_items` table

### 2. Test Admin Integration
1. Access admin orders page
2. Verify real orders appear instead of demo data
3. Check order details display correctly
4. Test order status updates

### 3. Test Payment Webhooks
1. Set up Stripe webhook endpoint
2. Complete a test payment
3. Verify order status updates to "processing"
4. Test failed payment scenarios

## Database Verification Queries

```sql
-- Check recent orders
SELECT o.order_number, o.email, o.total_amount, o.status, o.created_at
FROM orders o
ORDER BY o.created_at DESC
LIMIT 10;

-- Check order items for a specific order
SELECT oi.name, oi.quantity, oi.price, oi.total
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
WHERE o.order_number = 'ORD-20250125-0001';

-- Check customers
SELECT clerk_user_id, email, first_name, last_name
FROM customers
ORDER BY created_at DESC;
```

## Benefits After Implementation

### For Customers
- ✅ Order history in account dashboard
- ✅ Email confirmations with order details  
- ✅ Real-time order status tracking
- ✅ Proper receipt generation

### For Admins
- ✅ Real order management and fulfillment
- ✅ Customer management and support
- ✅ Sales analytics and reporting
- ✅ Inventory tracking integration
- ✅ Payment status monitoring

## Migration Notes

- Existing demo orders will remain until "Remove All Demo Items" is clicked
- New real orders will appear alongside demo orders initially
- Customer accounts will be created automatically during first purchase
- Order numbers follow format: `ORD-YYYYMMDD-NNNN`

This implementation transforms the demo checkout into a fully functional e-commerce order management system with database persistence and admin visibility.