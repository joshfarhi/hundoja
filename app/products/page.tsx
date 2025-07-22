'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import CartSidebar from '@/components/CartSidebar';
import Footer from '@/components/Footer';
import { products } from '@/data/products';
import { useCart } from '@/contexts/CartContext';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ShoppingCart, Eye, Filter, ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';

export default function ProductsPage() {
  const { dispatch } = useCart();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [sortOrder, setSortOrder] = useState('asc');
  const [isSortOpen, setIsSortOpen] = useState(false);
  
  // Close sort dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isSortOpen && !(event.target as Element).closest('.sort-dropdown')) {
        setIsSortOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSortOpen]);
  
  const categories = ['all', 'hoodies', 't-shirts', 'jackets', 'pants'];
  
  const sortOptions = [
    { value: 'featured', label: 'Featured' },
    { value: 'name', label: 'Name' },
    { value: 'price', label: 'Price' },
    { value: 'category', label: 'Category' },
  ];
  
  const filteredAndSortedProducts = React.useMemo(() => {
    let filtered = selectedCategory === 'all' 
      ? products 
      : products.filter(product => 
          product.category.toLowerCase() === selectedCategory.replace('-', ' ')
        );
    
    return filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'category':
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        case 'featured':
        default:
          aValue = a.featured ? 0 : 1;
          bValue = b.featured ? 0 : 1;
          break;
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [selectedCategory, sortBy, sortOrder]);

  const addToCart = (product: any) => {
    dispatch({
      type: 'ADD_ITEM',
      payload: {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
      },
    });
  };

  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      <CartSidebar />
      
      <div className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              ALL PRODUCTS
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Explore our complete collection of premium streetwear
            </p>
          </motion.div>

          {/* Filter and Sort Controls */}
          <div className="flex flex-col lg:flex-row gap-6 mb-12">
            {/* Category Filters */}
            <motion.div
              className="flex flex-wrap justify-center lg:justify-start gap-3 flex-1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="flex items-center text-neutral-400 mr-4">
                <Filter size={16} className="mr-2" />
                <span className="text-sm font-medium">Filter by:</span>
              </div>
              {categories.map((category) => (
                <motion.button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    "relative px-6 py-2 text-sm font-medium rounded-lg transition-all duration-300",
                    "border border-white/20 backdrop-blur-sm overflow-hidden group",
                    selectedCategory === category
                      ? "bg-white text-black border-white"
                      : "text-white hover:bg-white/10 hover:border-white/40"
                  )}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="relative z-10">
                    {category.toUpperCase().replace('-', ' ')}
                  </span>
                  {selectedCategory === category && (
                    <span className="absolute inset-x-0 w-1/2 mx-auto -bottom-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent h-px" />
                  )}
                </motion.button>
              ))}
            </motion.div>
            
            {/* Sort Controls */}
            <motion.div
              className="flex justify-center lg:justify-end"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <div className="relative sort-dropdown">
                <motion.button
                  onClick={() => setIsSortOpen(!isSortOpen)}
                  className={cn(
                    "flex items-center space-x-2 px-6 py-3 text-sm font-medium rounded-lg",
                    "bg-gradient-to-r from-neutral-800/80 to-neutral-700/60 text-white",
                    "border border-white/20 backdrop-blur-sm transition-all duration-300",
                    "hover:border-white/40 hover:bg-white/5",
                    isSortOpen && "border-cyan-500/50 bg-white/5"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ArrowUpDown size={16} />
                  <span>Sort by: {sortOptions.find(opt => opt.value === sortBy)?.label}</span>
                  <motion.div
                    animate={{ rotate: isSortOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown size={16} />
                  </motion.div>
                </motion.button>
                
                {/* Sort Dropdown */}
                <motion.div
                  initial={false}
                  animate={{ 
                    opacity: isSortOpen ? 1 : 0,
                    y: isSortOpen ? 0 : -10,
                    scale: isSortOpen ? 1 : 0.95
                  }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "absolute top-full right-0 mt-2 w-64 rounded-lg overflow-hidden z-50",
                    "bg-neutral-900/95 backdrop-blur-xl border border-white/20",
                    "shadow-2xl shadow-black/50",
                    !isSortOpen && "pointer-events-none"
                  )}
                >
                  <div className="p-3">
                    <div className="text-xs font-medium text-neutral-400 mb-3 uppercase tracking-wider">
                      Sort Options
                    </div>
                    
                    {/* Sort by options */}
                    <div className="space-y-1 mb-4">
                      {sortOptions.map((option) => (
                        <motion.button
                          key={option.value}
                          onClick={() => {
                            setSortBy(option.value);
                            setIsSortOpen(false);
                          }}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-md transition-all duration-200",
                            "hover:bg-white/10 text-sm",
                            sortBy === option.value 
                              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" 
                              : "text-neutral-300 hover:text-white"
                          )}
                          whileHover={{ x: 4 }}
                        >
                          {option.label}
                        </motion.button>
                      ))}
                    </div>
                    
                    {/* Sort order toggle */}
                    <div className="border-t border-white/10 pt-3">
                      <div className="text-xs font-medium text-neutral-400 mb-2 uppercase tracking-wider">
                        Order
                      </div>
                      <div className="flex gap-1">
                        <motion.button
                          onClick={() => setSortOrder('asc')}
                          className={cn(
                            "flex-1 px-3 py-2 rounded-md transition-all duration-200 text-xs font-medium",
                            sortOrder === 'asc'
                              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                              : "text-neutral-400 hover:text-white hover:bg-white/5"
                          )}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Ascending
                        </motion.button>
                        <motion.button
                          onClick={() => setSortOrder('desc')}
                          className={cn(
                            "flex-1 px-3 py-2 rounded-md transition-all duration-200 text-xs font-medium",
                            sortOrder === 'desc'
                              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                              : "text-neutral-400 hover:text-white hover:bg-white/5"
                          )}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Descending
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedProducts.map((product, index) => (
              <motion.div
                key={product.id}
                layout
                className={cn(
                  "group relative bg-gradient-to-br from-neutral-900/80 to-neutral-800/40",
                  "rounded-2xl overflow-hidden backdrop-blur-sm border border-white/[0.05]",
                  "hover:border-white/[0.1] transition-all duration-500 hover:shadow-2xl",
                  "hover:shadow-cyan-500/10 hover:-translate-y-1"
                )}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -30, scale: 0.9 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <div className="relative aspect-square overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover transition-all duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all duration-500" />
                  
                  {/* Hover overlay with buttons */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="flex space-x-3">
                      <Link href={`/products/${product.id}`}>
                        <motion.button
                          className={cn(
                            "p-3 bg-white/20 backdrop-blur-md rounded-full text-white",
                            "hover:bg-white/30 transition-all duration-300 border border-white/20"
                          )}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Eye size={20} />
                        </motion.button>
                      </Link>
                      <motion.button
                        onClick={() => addToCart(product)}
                        className={cn(
                          "p-3 bg-white/20 backdrop-blur-md rounded-full text-white",
                          "hover:bg-white/30 transition-all duration-300 border border-white/20"
                        )}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <ShoppingCart size={20} />
                      </motion.button>
                    </div>
                  </div>
                  
                  {/* Gradient shine effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                  </div>
                  
                  {/* Featured badge */}
                  {product.featured && (
                    <div className="absolute top-4 left-4">
                      <div className="px-3 py-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-semibold rounded-full">
                        FEATURED
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="p-6 relative">
                  <div className="absolute top-0 left-1/2 w-20 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent transform -translate-x-1/2" />
                  
                  <Link href={`/products/${product.id}`}>
                    <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-cyan-300 transition-all duration-300">
                      {product.name}
                    </h3>
                  </Link>
                  <p className="text-neutral-400 text-sm mb-4 line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-white font-bold text-xl">
                        ${product.price}
                      </span>
                      <span className="text-neutral-500 text-xs uppercase tracking-wider">
                        {product.category}
                      </span>
                    </div>
                    <motion.button
                      onClick={() => addToCart(product)}
                      className={cn(
                        "relative px-4 py-2 text-sm font-medium text-black bg-white rounded-lg",
                        "hover:bg-neutral-200 transition-all duration-300 overflow-hidden group/btn"
                      )}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="relative z-10">ADD TO CART</span>
                      <span className="absolute inset-x-0 w-1/2 mx-auto -bottom-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent h-px" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredAndSortedProducts.length === 0 && (
            <motion.div 
              className="col-span-full text-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-700 flex items-center justify-center">
                  <Filter size={32} className="text-neutral-400" />
                </div>
                <p className="text-neutral-400 text-lg mb-2">
                  No products found in this category.
                </p>
                <p className="text-neutral-500 text-sm">
                  Try selecting a different category or view all products.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
}