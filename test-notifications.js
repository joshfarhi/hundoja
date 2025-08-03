// Test script to verify notifications are working
// Run this with: node test-notifications.js

const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testNotifications() {
  console.log('🧪 Testing notifications...\n');

  try {
    // Test 1: Create a new order notification
    console.log('1. Creating new order notification...');
    const orderResult = await supabase
      .from('notifications')
      .insert({
        type: 'new_order',
        title: 'Test Order Received',
        message: 'Test order #TEST-001 received from Test Customer',
        icon_name: 'ShoppingBag',
        icon_color: 'text-blue-400',
        metadata: {
          order_id: 'test-order-123',
          order_number: 'TEST-001',
          customer_name: 'Test Customer',
          total_amount: 99.99
        }
      })
      .select();

    if (orderResult.error) {
      console.error('❌ Order notification failed:', orderResult.error);
    } else {
      console.log('✅ Order notification created:', orderResult.data[0].id);
    }

    // Test 2: Create a low stock notification
    console.log('\n2. Creating low stock notification...');
    const stockResult = await supabase
      .from('notifications')
      .insert({
        type: 'low_stock',
        title: 'Low Stock Alert',
        message: 'Low stock alert: "Test Product" has only 2 items left',
        icon_name: 'Package',
        icon_color: 'text-yellow-400',
        metadata: {
          product_id: 'test-product-123',
          product_name: 'Test Product',
          current_stock: 2
        }
      })
      .select();

    if (stockResult.error) {
      console.error('❌ Stock notification failed:', stockResult.error);
    } else {
      console.log('✅ Stock notification created:', stockResult.data[0].id);
    }

    // Test 3: Create a new customer notification
    console.log('\n3. Creating new customer notification...');
    const customerResult = await supabase
      .from('notifications')
      .insert({
        type: 'new_customer',
        title: 'New Customer Registration',
        message: 'A new customer, Test User, has registered',
        icon_name: 'UserPlus',
        icon_color: 'text-green-400',
        metadata: {
          customer_id: 'test-customer-123',
          customer_name: 'Test User',
          email: 'test@example.com'
        }
      })
      .select();

    if (customerResult.error) {
      console.error('❌ Customer notification failed:', customerResult.error);
    } else {
      console.log('✅ Customer notification created:', customerResult.data[0].id);
    }

    // Test 4: Fetch notifications with relative time
    console.log('\n4. Fetching notifications with relative time...');
    const fetchResult = await supabase
      .rpc('get_notifications_with_relative_time');

    if (fetchResult.error) {
      console.error('❌ Fetch notifications failed:', fetchResult.error);
    } else {
      console.log('✅ Fetched notifications:', fetchResult.data.length);
      fetchResult.data.forEach((notification, index) => {
        console.log(`   ${index + 1}. ${notification.title} (${notification.relative_time})`);
      });
    }

    console.log('\n🎉 All tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the tests
testNotifications(); 