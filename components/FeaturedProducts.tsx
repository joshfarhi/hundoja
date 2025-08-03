'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';
import { ShoppingCart } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  price: number;
  stock_quantity: number;
  images: string[];
  is_active: boolean;
  is_featured: boolean;
  sizes?: string[];
  colors?: string[];
  categories: { 
    id: string;
    slug: string; 
    name: string; 
  };
  created_at: string;
}

export default function FeaturedProducts() {
  const { dispatch } = useCart();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFeaturedProducts() {
      try {
        setLoading(true);
        
        const response = await fetch('/api/products?featured=true&limit=8');
        
        if (!response.ok) {
          throw new Error('Failed to fetch featured products');
        }
        
        const data = await response.json();
        setFeaturedProducts(data.products || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching featured products:', err);
        setError(err instanceof Error ? err.message : 'Failed to load products');
      } finally {
        setLoading(false);
      }
    }

    fetchFeaturedProducts();
  }, []);

  const addToCart = (product: Product) => {
    dispatch({
      type: 'ADD_ITEM',
      payload: {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.images?.[0] || '',
      },
    });
  };

  if (loading) {
    return (
      <section className="py-20 px-4 bg-black">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              FEATURED COLLECTION
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Discover our most popular pieces. Each item is carefully crafted to embody the essence of modern streetwear.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, index) => (
              <motion.div
                key={index}
                className="bg-neutral-900/80 rounded-2xl overflow-hidden animate-pulse"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="aspect-square bg-neutral-800" />
                <div className="p-4">
                  <div className="h-4 bg-neutral-800 rounded mb-2" />
                  <div className="h-3 bg-neutral-800 rounded w-1/2" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 px-4 bg-black">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            FEATURED COLLECTION
          </h2>
          <p className="text-red-400 mb-8">Error loading featured products: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-cyan-500 text-black font-semibold rounded-lg hover:bg-cyan-400 transition-colors"
          >
            Try Again
          </button>
        </div>
      </section>
    );
  }

  if (featuredProducts.length === 0) {
    return (
      <section className="py-20 px-4 bg-black">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            FEATURED COLLECTION
          </h2>
          <p className="text-gray-400 text-lg">No featured products available at the moment.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-4 bg-black">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            FEATURED COLLECTION
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Discover our most popular pieces. Each item is carefully crafted to embody the essence of modern streetwear.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product, index) => (
            <Link href={`/products/${product.id}`} key={product.id}>
              <motion.div
                className={cn(
                  "group relative bg-gradient-to-br from-neutral-900/80 to-neutral-800/40",
                  "rounded-2xl overflow-hidden backdrop-blur-sm border border-white/[0.05]",
                  "hover:border-white/[0.1] transition-all duration-500 hover:shadow-2xl",
                  "hover:shadow-white/10 hover:-translate-y-1 cursor-pointer"
                )}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="relative aspect-square overflow-hidden">
                  <Image
                    src={product.images?.[0] || '/placeholder-product.jpg'}
                    alt={product.name}
                    fill
                    className="object-cover transition-all duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all duration-500" />
                  
                  {/* Gradient shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </div>
                
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-white group-hover:text-gray-300 transition-colors">
                      {product.name}
                    </h3>
                    <span className="text-white font-bold">${product.price.toFixed(2)}</span>
                  </div>
                  
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {product.description}
                  </p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-gray-500 uppercase tracking-wider">
                      {product.categories?.name || 'Uncategorized'}
                    </span>
                    <span className={cn(
                      "text-xs px-2 py-1 rounded-full",
                      product.stock_quantity > 0 
                        ? "bg-white/20 text-white" 
                        : "bg-neutral-600/20 text-neutral-400"
                    )}>
                      {product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>
                  
                  {/* Sizes and Colors */}
                  {(product.sizes?.length > 0 || product.colors?.length > 0) && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {product.sizes?.slice(0, 3).map((size, index) => (
                        <span key={`size-${index}`} className="text-xs px-1.5 py-0.5 bg-white/10 text-white rounded">
                          {size}
                        </span>
                      ))}
                      {product.colors?.slice(0, 2).map((color, index) => (
                        <span key={`color-${index}`} className="text-xs px-1.5 py-0.5 bg-white/10 text-white rounded">
                          {color}
                        </span>
                      ))}
                      {(product.sizes?.length > 3 || product.colors?.length > 2) && (
                        <span className="text-xs px-1.5 py-0.5 bg-neutral-500/20 text-neutral-400 rounded">
                          +{((product.sizes?.length || 0) - 3 + (product.colors?.length || 0) - 2)} more
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Add to Cart Button */}
                  <motion.button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      addToCart(product);
                    }}
                    disabled={product.stock_quantity === 0}
                    className={cn(
                      "w-full py-2 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2",
                      product.stock_quantity > 0
                        ? "bg-white text-black hover:bg-gray-200 hover:scale-[1.02]"
                        : "bg-neutral-700 text-neutral-500 cursor-not-allowed"
                    )}
                    whileHover={product.stock_quantity > 0 ? { scale: 1.02 } : {}}
                    whileTap={product.stock_quantity > 0 ? { scale: 0.98 } : {}}
                  >
                    <ShoppingCart size={16} />
                    {product.stock_quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
                  </motion.button>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}