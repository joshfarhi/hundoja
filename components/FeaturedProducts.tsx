'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';

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

        <div className="grid grid-cols-2 gap-2 max-w-2xl mx-auto">
          {featuredProducts.slice(0, 4).map((product, index) => (
            <Link href={`/products/${product.id}`} key={product.id}>
              <motion.div
                className={cn(
                  "group relative bg-white",
                  "overflow-hidden",
                  "hover:opacity-90 transition-all duration-300 cursor-pointer"
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
                    className="object-cover transition-all duration-500 group-hover:scale-105"
                  />
                  
                  {/* Overlay text like in screenshot */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-center py-4">
                    <h3 className="text-white font-bold text-sm uppercase tracking-wide">
                      {product.name}
                    </h3>
                    {product.categories?.name && (
                      <p className="text-white/80 text-xs mt-1">
                        {product.categories.name}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}