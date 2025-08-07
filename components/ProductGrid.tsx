'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Search, Filter, Grid, List, Package, ShoppingBag } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  price: number;
  stock_quantity: number;
  images: string[];
  is_active: boolean;
  categories: { 
    id: string;
    slug: string; 
    name: string; 
  };
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
}

interface ProductGridProps {
  initialProducts: Product[];
  categories: Category[];
}

export default function ProductGrid({ initialProducts, categories }: ProductGridProps) {
  const { dispatch } = useCart();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 1000 });
  const [showFilters, setShowFilters] = useState(false);

  // Set up real-time subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('public:products')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'products' }, 
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setProducts(prev => [payload.new as Product, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setProducts(prev => prev.map(p => p.id === payload.new.id ? payload.new as Product : p));
          } else if (payload.eventType === 'DELETE') {
            setProducts(prev => prev.filter(p => p.id !== payload.old.id));
          }
        }
      )
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Advanced filtering and sorting
  const filteredAndSortedProducts = useMemo(() => {
    const filtered = products.filter(product => {
      // Category filter
      const categoryMatch = selectedCategory === 'all' || product.categories?.slug === selectedCategory;
      
      // Search filter
      const searchMatch = searchQuery === '' || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Price range filter
      const priceMatch = product.price >= priceRange.min && product.price <= priceRange.max;
      
      // Stock filter (only show products with stock > 0)
      const stockMatch = product.stock_quantity > 0;
      
      return categoryMatch && searchMatch && priceMatch && stockMatch;
    });

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'stock':
          return b.stock_quantity - a.stock_quantity;
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return filtered;
  }, [products, selectedCategory, sortBy, searchQuery, priceRange]);

  const addToCart = (product: Product) => {
    if (product.stock_quantity > 0) {
      dispatch({
        type: 'ADD_ITEM',
        payload: { 
          id: product.id, 
          name: product.name, 
          price: product.price, 
          image: product.images[0] || '/placeholder-product.jpg'
        },
      });
    }
  };

  // Get price range from all products
  const maxPrice = useMemo(() => {
    return Math.max(...products.map(p => p.price), 1000);
  }, [products]);

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="bg-neutral-900/50 rounded-xl p-4 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} />
          <input
            type="text"
            placeholder="Search products by name, description, or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-neutral-800 text-white rounded-lg border border-neutral-700 focus:border-cyan-500 focus:outline-none transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={cn(
                'px-4 py-2 rounded-lg transition-colors text-sm font-medium',
                selectedCategory === 'all' 
                  ? 'bg-white text-black' 
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              )}
            >
              All Products
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.slug)}
                className={cn(
                  'px-4 py-2 rounded-lg transition-colors text-sm font-medium',
                  selectedCategory === category.slug 
                    ? 'bg-white text-black' 
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                )}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Sort and View Controls */}
          <div className="flex items-center gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-neutral-800 text-white rounded-lg px-3 py-2 border border-neutral-700 focus:border-cyan-500 focus:outline-none text-sm"
            >
              <option value="newest">Newest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name-asc">Name: A to Z</option>
              <option value="name-desc">Name: Z to A</option>
              <option value="stock">Most in Stock</option>
            </select>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'p-2 rounded-lg transition-colors',
                showFilters ? 'bg-cyan-500 text-white' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              )}
            >
              <Filter size={20} />
            </button>

            <div className="flex bg-neutral-800 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-2 transition-colors',
                  viewMode === 'grid' ? 'bg-cyan-500 text-white' : 'text-neutral-300 hover:bg-neutral-700'
                )}
              >
                <Grid size={20} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-2 transition-colors',
                  viewMode === 'list' ? 'bg-cyan-500 text-white' : 'text-neutral-300 hover:bg-neutral-700'
                )}
              >
                <List size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filters (Collapsible) */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="pt-4 border-t border-neutral-700"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Price Range: ${priceRange.min} - ${priceRange.max}
                </label>
                <div className="flex gap-3">
                  <input
                    type="range"
                    min="0"
                    max={maxPrice}
                    value={priceRange.min}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, min: parseInt(e.target.value) }))}
                    className="flex-1"
                  />
                  <input
                    type="range"
                    min="0"
                    max={maxPrice}
                    value={priceRange.max}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, max: parseInt(e.target.value) }))}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-neutral-400">
        <p>
          Showing {filteredAndSortedProducts.length} of {products.length} products
          {selectedCategory !== 'all' && (
            <span> in {categories.find(c => c.slug === selectedCategory)?.name}</span>
          )}
        </p>
      </div>

      {/* Products Grid/List */}
      {filteredAndSortedProducts.length === 0 ? (
        <div className="text-center py-12">
          <Package className="mx-auto text-neutral-600 mb-4" size={64} />
          <h3 className="text-xl font-semibold text-neutral-400 mb-2">No products found</h3>
          <p className="text-neutral-500">Try adjusting your filters or search terms</p>
        </div>
      ) : (
        <div className={cn(
          viewMode === 'grid' 
            ? 'grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4 lg:gap-6'
            : 'space-y-4'
        )}>
          {filteredAndSortedProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                'group relative bg-white overflow-hidden hover:opacity-90 transition-all duration-300',
                viewMode === 'list' ? 'flex gap-4 p-4 bg-neutral-900 border border-neutral-800 rounded-lg' : ''
              )}
            >
              {/* Product Image */}
              <div className={cn(
                'relative overflow-hidden',
                viewMode === 'grid' ? 'aspect-square' : 'w-32 h-32 flex-shrink-0 rounded-lg'
              )}>
                <Link href={`/products/${product.id}`}>
                  {product.images && product.images.length > 0 ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-neutral-200 flex items-center justify-center">
                      <Package className="text-neutral-400" size={48} />
                    </div>
                  )}
                </Link>
                
                {viewMode === 'grid' && (
                  /* Overlay text like in screenshot */
                  <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-center py-4">
                    <h3 className="text-white font-bold text-sm uppercase tracking-wide line-clamp-1">
                      {product.name}
                    </h3>
                    {product.categories?.name && (
                      <p className="text-white/80 text-xs mt-1">
                        {product.categories.name}
                      </p>
                    )}
                  </div>
                )}
                
                {/* Stock Badge for list view */}
                {viewMode === 'list' && (
                  <div className="absolute top-2 right-2">
                    <span className={cn(
                      'px-2 py-1 text-xs font-medium rounded-full',
                      product.stock_quantity > 10 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : product.stock_quantity > 0
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    )}>
                      {product.stock_quantity > 0 ? `${product.stock_quantity} left` : 'Out of stock'}
                    </span>
                  </div>
                )}
              </div>

              {/* Product Info - Only show in list view */}
              {viewMode === 'list' && (
                <div className="flex-1">
                  <div className="flex-1">
                    <Link href={`/products/${product.id}`}>
                      <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors line-clamp-2">
                        {product.name}
                      </h3>
                    </Link>
                    
                    <p className="text-neutral-400 text-sm mt-1">
                      {product.categories?.name || 'Uncategorized'}
                    </p>
                    
                    <p className="text-neutral-500 text-sm mt-2 line-clamp-2">
                      {product.description}
                    </p>
                    
                    <p className="text-neutral-500 text-xs mt-1 font-mono">
                      SKU: {product.sku}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <span className="text-white font-bold text-xl">
                      ${product.price.toFixed(2)}
                    </span>
                    
                    <button
                      onClick={() => addToCart(product)}
                      disabled={product.stock_quantity === 0}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
                        product.stock_quantity > 0
                          ? 'bg-white text-black hover:bg-gray-200 hover:scale-105'
                          : 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
                      )}
                    >
                      <ShoppingBag size={16} />
                      {product.stock_quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}