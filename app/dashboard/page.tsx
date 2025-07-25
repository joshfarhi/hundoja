'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useUser, SignOutButton } from '@clerk/nextjs';
import Navigation from '@/components/Navigation';
import CartSidebar from '@/components/CartSidebar';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { User, Package, Settings, LogOut, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Order {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  order_items: {
    product_name: string;
  }[];
}

const OrderCard = React.memo(function OrderCard({ order, index, formatDate, getStatusColor }: {
  order: Order;
  index: number;
  formatDate: (dateString: string) => string;
  getStatusColor: (status: string) => string;
}) {
  return (
  <motion.div
    className="border border-white/10 rounded-lg p-6 hover:border-white/20 transition-colors"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: index * 0.1 }}
  >
    <div className="flex justify-between items-start mb-4">
      <div>
        <h3 className="text-white font-semibold">Order #{order.id.slice(-8).toUpperCase()}</h3>
        <p className="text-gray-400 text-sm">Placed on {formatDate(order.created_at)}</p>
      </div>
      <div className="text-right">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </span>
        <p className="text-white font-bold mt-2">${order.total_amount.toFixed(2)}</p>
      </div>
    </div>
    
    <div className="border-t border-white/10 pt-4">
      <p className="text-gray-300 text-sm mb-2">Items:</p>
      <ul className="text-white space-y-1">
        {order.order_items.map((item, i) => (
          <li key={i} className="text-sm">• {item.product_name}</li>
        ))}
      </ul>
    </div>
  </motion.div>
  );
});

export default function DashboardPage() {
  const { user } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      if (!user?.id) return;

      try {
        setLoading(true);
        
        // First, get the customer ID from the customers table using Clerk user ID
        const { data: customer, error: customerError } = await supabase
          .from('customers')
          .select('id')
          .eq('clerk_user_id', user.id)
          .single();

        if (customerError) {
          console.error('Customer lookup error:', customerError);
          setError('Unable to find customer record');
          return;
        }

        if (!customer) {
          setOrders([]);
          return;
        }

        // Fetch orders with order items
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select(`
            id,
            created_at,
            status,
            total_amount,
            order_items (
              product_name
            )
          `)
          .eq('customer_id', customer.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (ordersError) {
          console.error('Orders fetch error:', ordersError);
          setError('Unable to load orders');
          return;
        }

        setOrders(ordersData || []);
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [user?.id]);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-green-900 text-green-300';
      case 'shipped':
        return 'bg-blue-900 text-blue-300';
      case 'processing':
        return 'bg-yellow-900 text-yellow-300';
      case 'cancelled':
        return 'bg-red-900 text-red-300';
      default:
        return 'bg-gray-900 text-gray-300';
    }
  }, []);

  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);

  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      <CartSidebar />
      
      <div className="pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Welcome back, {user?.firstName}
            </h1>
            <p className="text-gray-400">
              Manage your account and track your orders
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <motion.div
              className="lg:col-span-1"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="bg-zinc-900 rounded-lg p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{user?.fullName}</h3>
                    <p className="text-gray-400 text-sm">{user?.primaryEmailAddress?.emailAddress}</p>
                  </div>
                </div>

                <nav className="space-y-2">
                  <button className="w-full text-left flex items-center gap-3 px-4 py-3 text-white bg-white/10 rounded-lg">
                    <Package className="w-5 h-5" />
                    Orders
                  </button>
                  <button className="w-full text-left flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                    <User className="w-5 h-5" />
                    Profile
                  </button>
                  <button className="w-full text-left flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                    <Settings className="w-5 h-5" />
                    Settings
                  </button>
                  <SignOutButton>
                    <button className="w-full text-left flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                      <LogOut className="w-5 h-5" />
                      Sign Out
                    </button>
                  </SignOutButton>
                </nav>
              </div>
            </motion.div>

            <motion.div
              className="lg:col-span-3"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <div className="bg-zinc-900 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-white mb-6">Order History</h2>
                
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                    <span className="ml-3 text-gray-400">Loading your orders...</span>
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-red-600 mx-auto mb-4" />
                    <p className="text-red-400 mb-2">Error loading orders</p>
                    <p className="text-gray-400 text-sm">{error}</p>
                    <button 
                      onClick={handleRetry} 
                      className="mt-4 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 mb-2">No orders yet</p>
                    <p className="text-gray-500 text-sm mb-4">Start shopping to see your orders here</p>
                    <Link 
                      href="/products" 
                      className="inline-block px-6 py-2 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Browse Products
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order, index) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        index={index}
                        formatDate={formatDate}
                        getStatusColor={getStatusColor}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}