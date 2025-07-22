'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  TrendingUp,
  TrendingDown,
  Eye,
  MoreHorizontal,
} from 'lucide-react';

const stats = [
  {
    title: 'Total Revenue',
    value: '$12,426',
    change: '+12.5%',
    isPositive: true,
    icon: DollarSign,
  },
  {
    title: 'Orders',
    value: '156',
    change: '+8.2%',
    isPositive: true,
    icon: ShoppingBag,
  },
  {
    title: 'Customers',
    value: '1,234',
    change: '+3.1%',
    isPositive: true,
    icon: Users,
  },
  {
    title: 'Products',
    value: '48',
    change: '-2.4%',
    isPositive: false,
    icon: Package,
  },
];

const recentOrders = [
  {
    id: '#ORD-001',
    customer: 'John Doe',
    product: 'Shadow Oversized Hoodie',
    amount: '$89.99',
    status: 'Completed',
    date: '2024-01-15',
  },
  {
    id: '#ORD-002',
    customer: 'Jane Smith',
    product: 'Urban Cargo Pants',
    amount: '$129.99',
    status: 'Processing',
    date: '2024-01-15',
  },
  {
    id: '#ORD-003',
    customer: 'Mike Johnson',
    product: 'Minimal Logo Tee',
    amount: '$45.99',
    status: 'Shipped',
    date: '2024-01-14',
  },
  {
    id: '#ORD-004',
    customer: 'Sarah Wilson',
    product: 'Statement Bomber Jacket',
    amount: '$189.99',
    status: 'Pending',
    date: '2024-01-14',
  },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>
          <p className="text-neutral-400 mt-1">Welcome back! Here&apos;s what&apos;s happening with your store.</p>
        </div>
        <motion.button
          className={cn(
            "px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500",
            "text-white rounded-lg hover:from-cyan-600 hover:to-blue-600",
            "transition-all duration-200"
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Generate Report
        </motion.button>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                  <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                </div>
                <div className={cn(
                  "p-3 rounded-lg",
                  "bg-gradient-to-br from-cyan-500/20 to-blue-500/20"
                )}>
                  <Icon className="text-cyan-400" size={24} />
                </div>
              </div>
              <div className="flex items-center mt-4">
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
                <th className="text-left p-4 text-neutral-300 font-medium">Order ID</th>
                <th className="text-left p-4 text-neutral-300 font-medium">Customer</th>
                <th className="text-left p-4 text-neutral-300 font-medium">Product</th>
                <th className="text-left p-4 text-neutral-300 font-medium">Amount</th>
                <th className="text-left p-4 text-neutral-300 font-medium">Status</th>
                <th className="text-left p-4 text-neutral-300 font-medium">Date</th>
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
                  <td className="p-4 text-white font-medium">{order.id}</td>
                  <td className="p-4 text-neutral-300">{order.customer}</td>
                  <td className="p-4 text-neutral-300">{order.product}</td>
                  <td className="p-4 text-white font-semibold">{order.amount}</td>
                  <td className="p-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium",
                      order.status === 'Completed' && "bg-green-500/20 text-green-400",
                      order.status === 'Processing' && "bg-yellow-500/20 text-yellow-400",
                      order.status === 'Shipped' && "bg-blue-500/20 text-blue-400",
                      order.status === 'Pending' && "bg-neutral-500/20 text-neutral-400"
                    )}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4 text-neutral-400">{order.date}</td>
                  <td className="p-4">
                    <motion.button
                      className="p-2 hover:bg-white/10 rounded-lg transition-all"
                      whileHover={{ scale: 1.05 }}
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