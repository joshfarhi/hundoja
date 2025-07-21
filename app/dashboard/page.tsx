'use client';

import React from 'react';
import { useUser, SignOutButton } from '@clerk/nextjs';
import Navigation from '@/components/Navigation';
import CartSidebar from '@/components/CartSidebar';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { User, Package, Settings, LogOut } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useUser();

  const orders = [
    {
      id: '#001',
      date: '2024-01-15',
      status: 'Delivered',
      total: 89.99,
      items: ['Shadow Oversized Hoodie']
    },
    {
      id: '#002',
      date: '2024-01-10',
      status: 'Shipped',
      total: 175.98,
      items: ['Urban Cargo Pants', 'Minimal Logo Tee']
    },
    {
      id: '#003',
      date: '2024-01-05',
      status: 'Processing',
      total: 189.99,
      items: ['Statement Bomber Jacket']
    }
  ];

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
                
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No orders yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order, index) => (
                      <motion.div
                        key={order.id}
                        className="border border-white/10 rounded-lg p-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-white font-semibold">Order {order.id}</h3>
                            <p className="text-gray-400 text-sm">Placed on {order.date}</p>
                          </div>
                          <div className="text-right">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              order.status === 'Delivered' ? 'bg-green-900 text-green-300' :
                              order.status === 'Shipped' ? 'bg-blue-900 text-blue-300' :
                              'bg-yellow-900 text-yellow-300'
                            }`}>
                              {order.status}
                            </span>
                            <p className="text-white font-bold mt-2">${order.total}</p>
                          </div>
                        </div>
                        
                        <div className="border-t border-white/10 pt-4">
                          <p className="text-gray-300 text-sm">Items:</p>
                          <ul className="text-white">
                            {order.items.map((item, i) => (
                              <li key={i}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
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