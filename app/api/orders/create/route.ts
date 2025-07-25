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

    // Generate order number with fallback
    let orderNumber;
    const { data: generatedNumber, error: orderNumberError } = await supabase
      .rpc('generate_order_number');

    if (orderNumberError || !generatedNumber) {
      // Fallback order number generation
      const randomSuffix = Math.random().toString(36).substr(2, 4).toUpperCase();
      orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomSuffix}`;
      console.warn('Using fallback order number generation:', orderNumber);
    } else {
      orderNumber = generatedNumber;
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