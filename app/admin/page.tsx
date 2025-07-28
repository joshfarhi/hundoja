'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/contexts/AdminContext';
import {
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  TrendingUp,
  TrendingDown,
  Eye,
  MoreHorizontal,
  Mail,
  X,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

interface AnalyticsData {
  currentMonth: {
    revenue: number;
    orders: number;
    customers: number;
    products: number;
  };
  previousMonth: {
    revenue: number;
    orders: number;
    customers: number;
    products: number;
  };
  growth: {
    revenue: {
      percentage: number;
      isPositive: boolean;
      trend: number;
    };
    orders: {
      percentage: number;
      isPositive: boolean;
      trend: number;
    };
    customers: {
      percentage: number;
      isPositive: boolean;
    };
    products: {
      percentage: number;
      isPositive: boolean;
    };
  };
  totals: {
    revenue: number;
    orders: number;
    customers: number;
    products: number;
  };
}

export default function AdminDashboard() {
  const { state, removeDemoItems } = useAdmin();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/analytics');
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      
      const data = await response.json();
      setAnalyticsData(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Calculate real-time stats from local state (fallback)
  const totalRevenue = state.orders.reduce((sum, order) => sum + order.total, 0);
  const totalCustomers = new Set(state.orders.map(order => order.customer.email)).size;
  
  // Use analytics data if available, otherwise fall back to local calculations
  const stats = [
    {
      title: 'Total Revenue',
      value: analyticsData ? `$${analyticsData.totals.revenue.toFixed(2)}` : `$${totalRevenue.toFixed(2)}`,
      change: analyticsData ? 
        `${analyticsData.growth.revenue.isPositive ? '+' : ''}${analyticsData.growth.revenue.percentage.toFixed(1)}%` :
        '0%',
      isPositive: analyticsData ? analyticsData.growth.revenue.isPositive : false,
      icon: DollarSign,
    },
    {
      title: 'Orders',
      value: analyticsData ? analyticsData.totals.orders.toString() : state.orders.length.toString(),
      change: analyticsData ? 
        `${analyticsData.growth.orders.isPositive ? '+' : ''}${analyticsData.growth.orders.percentage.toFixed(1)}%` :
        '0%',
      isPositive: analyticsData ? analyticsData.growth.orders.isPositive : false,
      icon: ShoppingBag,
    },
    {
      title: 'Customers',
      value: analyticsData ? analyticsData.totals.customers.toString() : totalCustomers.toString(),
      change: analyticsData ? 
        `${analyticsData.growth.customers.isPositive ? '+' : ''}${analyticsData.growth.customers.percentage.toFixed(1)}%` :
        '0%',
      isPositive: analyticsData ? analyticsData.growth.customers.isPositive : false,
      icon: Users,
    },
    {
      title: 'Products',
      value: analyticsData ? analyticsData.totals.products.toString() : state.products.length.toString(),
      change: analyticsData ? 
        `${analyticsData.growth.products.isPositive ? '+' : ''}${analyticsData.growth.products.percentage.toFixed(1)}%` :
        '0%',
      isPositive: analyticsData ? analyticsData.growth.products.isPositive : false,
      icon: Package,
    },
  ];

  // Get recent orders (first 4)
  const recentOrders = state.orders.slice(0, 4);
  const hasAnyDemoItems = !state.demoItemsHidden && (
    state.products.some(p => p.isDemo) || 
    state.orders.some(o => o.isDemo) || 
    state.contacts.some(c => c.isDemo)
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Dashboard Overview</h1>
          <p className="text-neutral-400 mt-1 text-sm sm:text-base">Welcome back! Here&apos;s what&apos;s happening with your store.</p>
        </div>
        <div className="flex items-center space-x-3">
          <motion.button
            onClick={fetchAnalytics}
            disabled={loading}
            className={cn(
              "flex items-center space-x-2 px-4 py-2",
              "bg-neutral-800 text-white rounded-lg",
              "hover:bg-neutral-700 transition-all duration-200 text-sm",
              loading && "opacity-50 cursor-not-allowed"
            )}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
          >
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            <span>Refresh</span>
          </motion.button>
          <motion.button
            className={cn(
              "px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500",
              "text-white rounded-lg hover:from-cyan-600 hover:to-blue-600",
              "transition-all duration-200 text-sm sm:text-base"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Generate Report
          </motion.button>
        </div>
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "flex items-center justify-between p-4 rounded-lg",
            "bg-red-500/10 border border-red-500/20"
          )}
        >
          <div className="flex items-center space-x-3">
            <div className="text-red-400 text-sm">
              <strong>Error:</strong> {error}
            </div>
          </div>
          <button
            onClick={fetchAnalytics}
            className="text-red-400 hover:text-red-300 text-sm underline"
          >
            Retry
          </button>
        </motion.div>
      )}

      {/* Demo Items Banner */}
      {hasAnyDemoItems && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "flex items-center justify-between p-4 rounded-lg",
            "bg-neutral-800/50 border border-neutral-700"
          )}
        >
          <div className="flex items-center space-x-3">
            <Sparkles className="text-neutral-400" size={20} />
            <div className="flex-1">
              <h3 className="text-white font-medium">Demo Data Active</h3>
              <p className="text-neutral-400 text-sm leading-tight mt-1">
                You have {state.products.filter(p => p.isDemo).length} demo products, {' '}
                {state.orders.filter(o => o.isDemo).length} demo orders, and {' '}
                {state.contacts.filter(c => c.isDemo).length} demo contacts
              </p>
            </div>
          </div>
          <motion.button
            onClick={removeDemoItems}
            className={cn(
              "flex items-center space-x-2 px-3 py-2 sm:px-4",
              "bg-neutral-700 text-white rounded-lg",
              "hover:bg-neutral-600 transition-all duration-200 text-xs sm:text-sm"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <X size={16} />
            <span className="hidden sm:inline">Remove All Demo Items</span>
          </motion.button>
        </motion.div>
      )}

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-neutral-800/50 border border-neutral-700"
        >
          <div className="flex items-center space-x-2">
            <Package className="text-neutral-400" size={16} />
            <span className="text-neutral-300 text-sm">Products</span>
          </div>
          <div className="text-white text-2xl font-bold">
            {loading ? '...' : (analyticsData ? analyticsData.totals.products : state.products.length)}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-lg bg-neutral-800/50 border border-neutral-700"
        >
          <div className="flex items-center space-x-2">
            <ShoppingBag className="text-neutral-400" size={16} />
            <span className="text-neutral-300 text-sm">Orders</span>
          </div>
          <div className="text-white text-2xl font-bold">
            {loading ? '...' : (analyticsData ? analyticsData.totals.orders : state.orders.length)}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-lg bg-neutral-800/50 border border-neutral-700"
        >
          <div className="flex items-center space-x-2">
            <Mail className="text-neutral-400" size={16} />
            <span className="text-neutral-300 text-sm">Contacts</span>
          </div>
          <div className="text-white text-2xl font-bold">{state.contacts.length}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-lg bg-neutral-800/50 border border-neutral-700"
        >
          <div className="flex items-center space-x-2">
            <Users className="text-neutral-400" size={16} />
            <span className="text-neutral-300 text-sm">Customers</span>
          </div>
          <div className="text-white text-2xl font-bold">
            {loading ? '...' : (analyticsData ? analyticsData.totals.customers : totalCustomers)}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-4 rounded-lg bg-neutral-800/50 border border-neutral-700"
        >
          <div className="flex items-center space-x-2">
            <DollarSign className="text-neutral-400" size={16} />
            <span className="text-neutral-300 text-sm">Revenue</span>
          </div>
          <div className="text-white text-2xl font-bold">
            {loading ? '...' : `$${analyticsData ? analyticsData.totals.revenue.toFixed(0) : totalRevenue.toFixed(0)}`}
          </div>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "p-6 rounded-xl bg-gradient-to-br from-neutral-900/80 to-neutral-800/40",
                "border border-white/10 hover:border-white/20 transition-all duration-300",
                "hover:shadow-lg hover:shadow-cyan-500/10"
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral-400 text-sm font-medium">{stat.title}</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {loading ? '...' : stat.value}
                  </p>
                </div>
                <div className={cn(
                  "p-3 rounded-lg",
                  "bg-gradient-to-br from-cyan-500/20 to-blue-500/20"
                )}>
                  <Icon className="text-cyan-400" size={24} />
                </div>
              </div>
              <div className="flex items-center mt-4">
                {loading ? (
                  <div className="text-neutral-400 text-sm">Loading...</div>
                ) : (
                  <>
                    {stat.isPositive ? (
                      <TrendingUp className="text-green-400" size={16} />
                    ) : (
                      <TrendingDown className="text-red-400" size={16} />
                    )}
                    <span className={cn(
                      "text-sm font-medium ml-1",
                      stat.isPositive ? "text-green-400" : "text-red-400"
                    )}>
                      {stat.change}
                    </span>
                    <span className="text-neutral-400 text-sm ml-1">vs last month</span>
                  </>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Orders */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className={cn(
          "rounded-xl bg-gradient-to-br from-neutral-900/80 to-neutral-800/40",
          "border border-white/10 overflow-hidden"
        )}
      >
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Recent Orders</h2>
              <p className="text-neutral-400 text-sm mt-1">Latest customer orders</p>
            </div>
            <motion.button
              className="p-2 hover:bg-white/10 rounded-lg transition-all"
              whileHover={{ scale: 1.05 }}
            >
              <MoreHorizontal className="text-neutral-400" size={20} />
            </motion.button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-800/50">
              <tr>
                <th className="text-left p-4 text-neutral-300 font-medium">Order</th>
                <th className="hidden sm:table-cell text-left p-4 text-neutral-300 font-medium">Customer</th>
                <th className="hidden md:table-cell text-left p-4 text-neutral-300 font-medium">Product</th>
                <th className="text-left p-4 text-neutral-300 font-medium">Amount</th>
                <th className="hidden lg:table-cell text-left p-4 text-neutral-300 font-medium">Status</th>
                <th className="hidden lg:table-cell text-left p-4 text-neutral-300 font-medium">Date</th>
                <th className="text-left p-4 text-neutral-300 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order, index) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 * index }}
                  className="border-b border-white/5 hover:bg-white/5 transition-all"
                >
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-medium truncate">{order.id}</span>
                      {order.isDemo && (
                        <span className={cn(
                          "px-2 py-1 text-xs font-medium rounded-full flex-shrink-0",
                          "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                        )}>
                          DEMO
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="hidden sm:table-cell p-4 text-neutral-300">{order.customer.name}</td>
                  <td className="hidden md:table-cell p-4 text-neutral-300">
                    {order.products.length > 1 
                      ? `${order.products[0].name} +${order.products.length - 1} more`
                      : order.products[0]?.name
                    }
                  </td>
                  <td className="p-4 text-white font-semibold">${order.total.toFixed(2)}</td>
                  <td className="hidden lg:table-cell p-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium capitalize",
                      order.status === 'completed' && "bg-green-500/20 text-green-400",
                      order.status === 'processing' && "bg-yellow-500/20 text-yellow-400",
                      order.status === 'shipped' && "bg-blue-500/20 text-blue-400",
                      order.status === 'pending' && "bg-neutral-500/20 text-neutral-400",
                      order.status === 'cancelled' && "bg-red-500/20 text-red-400"
                    )}>
                      {order.status}
                    </span>
                  </td>
                  <td className="hidden lg:table-cell p-4 text-neutral-400">
                    {new Date(order.orderDate).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <motion.button
                      className="p-2 hover:bg-white/10 rounded-lg transition-all"
                      whileHover={{ scale: 1.05 }}
                      title="View Order"
                    >
                      <Eye className="text-neutral-400" size={16} />
                    </motion.button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}