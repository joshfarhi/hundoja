import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('id, role')
      .eq('clerk_user_id', userId)
      .eq('is_active', true)
      .single();

    if (adminError || !adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get date ranges for calculations
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Helper function to calculate growth
    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) {
        return { percentage: current > 0 ? 100 : 0, isPositive: current > 0 };
      }
      const change = ((current - previous) / previous) * 100;
      return { percentage: change, isPositive: change >= 0 };
    };

    // Fetch current month data (last 30 days)
    const { data: currentMonthOrders, error: currentOrdersError } = await supabase
      .from('orders')
      .select('total_amount, customer_id, created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .lte('created_at', now.toISOString());

    // Fetch previous month data (30-60 days ago)
    const { data: previousMonthOrders, error: previousOrdersError } = await supabase
      .from('orders')
      .select('total_amount, customer_id, created_at')
      .gte('created_at', sixtyDaysAgo.toISOString())
      .lt('created_at', thirtyDaysAgo.toISOString());

    // Fetch two months ago data (60-90 days ago) for trend analysis
    const { data: twoMonthsAgoOrders, error: twoMonthsError } = await supabase
      .from('orders')
      .select('total_amount, customer_id, created_at')
      .gte('created_at', ninetyDaysAgo.toISOString())
      .lt('created_at', sixtyDaysAgo.toISOString());

    // Fetch product data
    const { data: currentMonthProducts, error: productsError } = await supabase
      .from('products')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .lte('created_at', now.toISOString());

    const { data: previousMonthProducts, error: prevProductsError } = await supabase
      .from('products')
      .select('created_at')
      .gte('created_at', sixtyDaysAgo.toISOString())
      .lt('created_at', thirtyDaysAgo.toISOString());

    // Fetch customer data
    const { data: currentMonthCustomers, error: customersError } = await supabase
      .from('customers')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .lte('created_at', now.toISOString());

    const { data: previousMonthCustomers, error: prevCustomersError } = await supabase
      .from('customers')
      .select('created_at')
      .gte('created_at', sixtyDaysAgo.toISOString())
      .lt('created_at', thirtyDaysAgo.toISOString());

    if (currentOrdersError || previousOrdersError || twoMonthsError || 
        productsError || prevProductsError || customersError || prevCustomersError) {
      console.error('Database errors:', {
        currentOrdersError, previousOrdersError, twoMonthsError,
        productsError, prevProductsError, customersError, prevCustomersError
      });
      return NextResponse.json({ error: 'Failed to fetch analytics data' }, { status: 500 });
    }

    // Calculate metrics
    const currentMonthRevenue = currentMonthOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
    const previousMonthRevenue = previousMonthOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
    const twoMonthsAgoRevenue = twoMonthsAgoOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

    const currentMonthOrderCount = currentMonthOrders?.length || 0;
    const previousMonthOrderCount = previousMonthOrders?.length || 0;
    const twoMonthsAgoOrderCount = twoMonthsAgoOrders?.length || 0;

    const currentMonthCustomerCount = currentMonthCustomers?.length || 0;
    const previousMonthCustomerCount = previousMonthCustomers?.length || 0;

    const currentMonthProductCount = currentMonthProducts?.length || 0;
    const previousMonthProductCount = previousMonthProducts?.length || 0;

    // Calculate growth percentages
    const revenueGrowth = calculateGrowth(currentMonthRevenue, previousMonthRevenue);
    const ordersGrowth = calculateGrowth(currentMonthOrderCount, previousMonthOrderCount);
    const customersGrowth = calculateGrowth(currentMonthCustomerCount, previousMonthCustomerCount);
    const productsGrowth = calculateGrowth(currentMonthProductCount, previousMonthProductCount);

    // Calculate trend (comparing current vs two months ago for longer-term trend)
    const revenueTrend = calculateGrowth(currentMonthRevenue, twoMonthsAgoRevenue);
    const ordersTrend = calculateGrowth(currentMonthOrderCount, twoMonthsAgoOrderCount);

    // Get total lifetime metrics
    const { data: totalOrders, error: totalOrdersError } = await supabase
      .from('orders')
      .select('total_amount, customer_id');

    const { data: totalProducts, error: totalProductsError } = await supabase
      .from('products')
      .select('id');

    const { data: totalCustomers, error: totalCustomersError } = await supabase
      .from('customers')
      .select('id');

    if (totalOrdersError || totalProductsError || totalCustomersError) {
      console.error('Total metrics errors:', { totalOrdersError, totalProductsError, totalCustomersError });
    }

    const totalRevenue = totalOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
    const totalOrderCount = totalOrders?.length || 0;
    const totalProductCount = totalProducts?.length || 0;
    const totalCustomerCount = totalCustomers?.length || 0;

    // Calculate unique customers from orders
    const uniqueCustomers = new Set(totalOrders?.map(order => order.customer_id).filter(Boolean)).size;

    return NextResponse.json({
      currentMonth: {
        revenue: currentMonthRevenue,
        orders: currentMonthOrderCount,
        customers: currentMonthCustomerCount,
        products: currentMonthProductCount,
      },
      previousMonth: {
        revenue: previousMonthRevenue,
        orders: previousMonthOrderCount,
        customers: previousMonthCustomerCount,
        products: previousMonthProductCount,
      },
      growth: {
        revenue: {
          percentage: revenueGrowth.percentage,
          isPositive: revenueGrowth.isPositive,
          trend: revenueTrend.percentage,
        },
        orders: {
          percentage: ordersGrowth.percentage,
          isPositive: ordersGrowth.isPositive,
          trend: ordersTrend.percentage,
        },
        customers: {
          percentage: customersGrowth.percentage,
          isPositive: customersGrowth.isPositive,
        },
        products: {
          percentage: productsGrowth.percentage,
          isPositive: productsGrowth.isPositive,
        },
      },
      totals: {
        revenue: totalRevenue,
        orders: totalOrderCount,
        customers: uniqueCustomers,
        products: totalProductCount,
      },
      dateRanges: {
        currentMonth: {
          start: thirtyDaysAgo.toISOString(),
          end: now.toISOString(),
        },
        previousMonth: {
          start: sixtyDaysAgo.toISOString(),
          end: thirtyDaysAgo.toISOString(),
        },
      },
    });

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 