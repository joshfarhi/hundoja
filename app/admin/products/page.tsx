'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useAdmin } from '@/contexts/AdminContext';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Star,
  Package,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  X,
  Sparkles,
} from 'lucide-react';

const statusConfig = {
  active: { label: 'Active', icon: CheckCircle, color: 'text-green-400 bg-green-500/20' },
  low_stock: { label: 'Low Stock', icon: AlertCircle, color: 'text-yellow-400 bg-yellow-500/20' },
  out_of_stock: { label: 'Out of Stock', icon: AlertCircle, color: 'text-red-400 bg-red-500/20' },
  draft: { label: 'Draft', icon: Edit, color: 'text-neutral-400 bg-neutral-500/20' },
  discontinued: { label: 'Discontinued', icon: Trash2, color: 'text-red-400 bg-red-500/20' },
};

export default function ProductsPage() {
  const { state, dispatch, removeDemoItems } = useAdmin();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredProducts = state.products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const calculateMargin = (price: number, cost: number) => {
    return (((price - cost) / price) * 100).toFixed(1);
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
          <h1 className="text-3xl font-bold text-white">Product Catalog</h1>
          <p className="text-neutral-400 mt-1">Manage your product inventory and listings</p>
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
          <Plus size={16} />
          <span>Add Product</span>
        </motion.button>
      </motion.div>

      {/* Demo Items Banner */}
      {state.products.some(p => p.isDemo) && (
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
              <h3 className="text-white font-medium">Demo Products Active</h3>
              <p className="text-purple-300 text-sm">These are example products to help you get started</p>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { title: 'Total Products', value: state.products.length, icon: Package, color: 'from-blue-500 to-cyan-500' },
          { title: 'Active', value: state.products.filter(p => p.status === 'active').length, icon: CheckCircle, color: 'from-green-500 to-emerald-500' },
          { title: 'Low Stock', value: state.products.filter(p => p.status === 'low_stock').length, icon: AlertCircle, color: 'from-yellow-500 to-orange-500' },
          { title: 'Out of Stock', value: state.products.filter(p => p.status === 'out_of_stock').length, icon: AlertCircle, color: 'from-red-500 to-pink-500' },
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              "p-4 rounded-xl bg-gradient-to-br from-neutral-900/80 to-neutral-800/40",
              "border border-white/10"
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-400 text-sm">{stat.title}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
              <div className={cn("p-2 rounded-lg bg-gradient-to-br", stat.color, "bg-opacity-20")}>
                <stat.icon className="text-white" size={20} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} />
          <input
            type="text"
            placeholder="Search products by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(
              "w-full pl-10 pr-4 py-3 bg-neutral-800/50 border border-white/10",
              "rounded-lg text-white placeholder-neutral-400",
              "focus:outline-none focus:border-cyan-500/50",
              "transition-all duration-200"
            )}
          />
        </div>

        {/* Category Filter */}
        <div className="relative">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={cn(
              "appearance-none px-4 py-3 pr-10 bg-neutral-800/50 border border-white/10",
              "rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
            )}
          >
            <option value="all">All Categories</option>
            <option value="Hoodies">Hoodies</option>
            <option value="T-Shirts">T-Shirts</option>
            <option value="Pants">Pants</option>
            <option value="Jackets">Jackets</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={16} />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={cn(
              "appearance-none px-4 py-3 pr-10 bg-neutral-800/50 border border-white/10",
              "rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
            )}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="draft">Draft</option>
            <option value="discontinued">Discontinued</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={16} />
        </div>
      </motion.div>

      {/* Products Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={cn(
          "rounded-xl bg-gradient-to-br from-neutral-900/80 to-neutral-800/40",
          "border border-white/10 overflow-hidden"
        )}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-800/50">
              <tr>
                <th className="text-left p-4 text-neutral-300 font-medium">Product</th>
                <th className="text-left p-4 text-neutral-300 font-medium">SKU</th>
                <th className="text-left p-4 text-neutral-300 font-medium">Price</th>
                <th className="text-left p-4 text-neutral-300 font-medium">Stock</th>
                <th className="text-left p-4 text-neutral-300 font-medium">Sold</th>
                <th className="text-left p-4 text-neutral-300 font-medium">Margin</th>
                <th className="text-left p-4 text-neutral-300 font-medium">Status</th>
                <th className="text-left p-4 text-neutral-300 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product, index) => {
                const statusInfo = statusConfig[product.status];
                const StatusIcon = statusInfo.icon;
                
                return (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 * index }}
                    className="border-b border-white/5 hover:bg-white/5 transition-all"
                  >
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-white font-medium">{product.name}</span>
                            {product.featured && (
                              <Star className="text-yellow-400 fill-current" size={14} />
                            )}
                            {product.isDemo && (
                              <span className={cn(
                                "px-2 py-1 text-xs font-medium rounded-full",
                                "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                              )}>
                                DEMO
                              </span>
                            )}
                          </div>
                          <div className="text-neutral-400 text-sm">{product.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-neutral-300 font-mono text-sm">{product.sku}</td>
                    <td className="p-4">
                      <div className="text-white font-semibold">${product.price}</div>
                      <div className="text-neutral-400 text-sm">Cost: ${product.cost}</div>
                    </td>
                    <td className="p-4">
                      <div className={cn(
                        "font-semibold",
                        product.stock > 10 ? "text-green-400" :
                        product.stock > 0 ? "text-yellow-400" : "text-red-400"
                      )}>
                        {product.stock}
                      </div>
                    </td>
                    <td className="p-4 text-neutral-300">{product.sold}</td>
                    <td className="p-4">
                      <span className="text-green-400 font-medium">
                        {calculateMargin(product.price, product.cost)}%
                      </span>
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
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <motion.button
                          className="p-2 hover:bg-white/10 rounded-lg transition-all"
                          whileHover={{ scale: 1.05 }}
                          title="View Product"
                        >
                          <Eye className="text-neutral-400" size={16} />
                        </motion.button>
                        <motion.button
                          className="p-2 hover:bg-white/10 rounded-lg transition-all"
                          whileHover={{ scale: 1.05 }}
                          title="Edit Product"
                        >
                          <Edit className="text-neutral-400" size={16} />
                        </motion.button>
                        <motion.button
                          onClick={() => dispatch({ type: 'DELETE_PRODUCT', payload: product.id })}
                          className={cn(
                            "p-2 hover:bg-red-500/20 rounded-lg transition-all",
                            product.isDemo && "hover:bg-purple-500/20"
                          )}
                          whileHover={{ scale: 1.05 }}
                          title={product.isDemo ? "Remove Demo Product" : "Delete Product"}
                        >
                          <Trash2 className={product.isDemo ? "text-purple-400" : "text-red-400"} size={16} />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto text-neutral-600 mb-4" size={48} />
            <p className="text-neutral-400 text-lg">No products found</p>
            <p className="text-neutral-500 text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}