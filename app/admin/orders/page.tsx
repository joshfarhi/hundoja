'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/contexts/AdminContext';
import {
  Search,
  Download,
  Eye,
  Edit,
  Trash2,
  ChevronDown,
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  X,
  Sparkles,
} from 'lucide-react';

const statusConfig = {
  pending: { label: 'Pending', icon: Clock, color: 'text-yellow-400 bg-yellow-500/20' },
  processing: { label: 'Processing', icon: Package, color: 'text-blue-400 bg-blue-500/20' },
  shipped: { label: 'Shipped', icon: Truck, color: 'text-purple-400 bg-purple-500/20' },
  completed: { label: 'Completed', icon: CheckCircle, color: 'text-green-400 bg-green-500/20' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'text-red-400 bg-red-500/20' },
};

export default function OrdersPage() {
  const { state, dispatch, removeDemoItems } = useAdmin();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredOrders = state.orders.filter(order => {
    const matchesSearch = order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-white">Orders Management</h1>
          <p className="text-neutral-400 mt-1">Manage and track all customer orders</p>
        </div>
        <motion.button
          className={cn(
            "flex items-center space-x-2 px-4 py-2",
            "bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg",
            "hover:from-cyan-600 hover:to-blue-600 transition-all duration-200"
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Download size={16} />
          <span>Export Orders</span>
        </motion.button>
      </motion.div>

      {/* Demo Items Banner */}
      {state.orders.some(o => o.isDemo) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "flex items-center justify-between p-4 rounded-lg",
            "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30"
          )}
        >
          <div className="flex items-center space-x-3">
            <Sparkles className="text-purple-400" size={20} />
            <div>
              <h3 className="text-white font-medium">Demo Orders Active</h3>
              <p className="text-purple-300 text-sm">These are example orders to help you get started</p>
            </div>
          </div>
          <motion.button
            onClick={removeDemoItems}
            className={cn(
              "flex items-center space-x-2 px-4 py-2",
              "bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg",
              "hover:from-red-600 hover:to-pink-600 transition-all duration-200"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <X size={16} />
            <span>Remove All Demo Items</span>
          </motion.button>
        </motion.div>
      )}

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} />
          <input
            type="text"
            placeholder="Search orders by customer name or order ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(
              "w-full pl-10 pr-4 py-3 bg-neutral-800/50 border border-white/10",
              "rounded-lg text-white placeholder-neutral-400",
              "focus:outline-none focus:border-cyan-500/50 focus:bg-neutral-800/80",
              "transition-all duration-200"
            )}
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={cn(
              "appearance-none px-4 py-3 pr-10 bg-neutral-800/50 border border-white/10",
              "rounded-lg text-white focus:outline-none focus:border-cyan-500/50",
              "transition-all duration-200"
            )}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={16} />
        </div>
      </motion.div>

      {/* Orders Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={cn(
          "rounded-xl bg-gradient-to-br from-neutral-900/80 to-neutral-800/40",
          "border border-white/10 overflow-hidden"
        )}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-800/50">
              <tr>
                <th className="text-left p-4 text-neutral-300 font-medium">Order</th>
                <th className="text-left p-4 text-neutral-300 font-medium">Customer</th>
                <th className="text-left p-4 text-neutral-300 font-medium">Products</th>
                <th className="text-left p-4 text-neutral-300 font-medium">Total</th>
                <th className="text-left p-4 text-neutral-300 font-medium">Status</th>
                <th className="text-left p-4 text-neutral-300 font-medium">Date</th>
                <th className="text-left p-4 text-neutral-300 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order, index) => {
                const statusInfo = statusConfig[order.status];
                const StatusIcon = statusInfo.icon;
                
                return (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 * index }}
                    className="border-b border-white/5 hover:bg-white/5 transition-all"
                  >
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <div className="font-medium text-white">{order.id}</div>
                        {order.isDemo && (
                          <span className={cn(
                            "px-2 py-1 text-xs font-medium rounded-full",
                            "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                          )}>
                            DEMO
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-neutral-400">
                        {formatDate(order.orderDate)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {order.customer.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="text-white font-medium">{order.customer.name}</div>
                          <div className="text-xs text-neutral-400">{order.customer.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        {order.products.map((product, idx) => (
                          <div key={idx} className="text-sm">
                            <span className="text-neutral-300">{product.name}</span>
                            <span className="text-neutral-500 ml-2">×{product.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-white font-semibold">${order.total.toFixed(2)}</div>
                      <div className={cn(
                        "text-xs px-2 py-1 rounded-full inline-block mt-1",
                        order.paymentStatus === 'paid' ? "text-green-400 bg-green-500/20" : "text-yellow-400 bg-yellow-500/20"
                      )}>
                        {order.paymentStatus}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className={cn(
                        "flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium w-fit",
                        statusInfo.color
                      )}>
                        <StatusIcon size={14} />
                        <span>{statusInfo.label}</span>
                      </div>
                    </td>
                    <td className="p-4 text-neutral-400 text-sm">
                      {order.deliveryDate ? formatDate(order.deliveryDate) : 'TBD'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <motion.button
                          className="p-2 hover:bg-white/10 rounded-lg transition-all"
                          whileHover={{ scale: 1.05 }}
                          title="View Details"
                        >
                          <Eye className="text-neutral-400" size={16} />
                        </motion.button>
                        <motion.button
                          className="p-2 hover:bg-white/10 rounded-lg transition-all"
                          whileHover={{ scale: 1.05 }}
                          title="Edit Order"
                        >
                          <Edit className="text-neutral-400" size={16} />
                        </motion.button>
                        <motion.button
                          onClick={() => dispatch({ type: 'DELETE_ORDER', payload: order.id })}
                          className={cn(
                            "p-2 hover:bg-red-500/20 rounded-lg transition-all",
                            order.isDemo && "hover:bg-purple-500/20"
                          )}
                          whileHover={{ scale: 1.05 }}
                          title={order.isDemo ? "Remove Demo Order" : "Cancel Order"}
                        >
                          <Trash2 className={order.isDemo ? "text-purple-400" : "text-red-400"} size={16} />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto text-neutral-600 mb-4" size={48} />
            <p className="text-neutral-400 text-lg">No orders found</p>
            <p className="text-neutral-500 text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}