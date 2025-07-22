'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { products, Product } from '@/data/products';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';
import { ShoppingCart, Eye } from 'lucide-react';

export default function FeaturedProducts() {
  const { dispatch } = useCart();
  const featuredProducts = products.filter(product => product.featured);

  const addToCart = (product: Product) => {
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
            <motion.div
              key={product.id}
              className={cn(
                "group relative bg-gradient-to-br from-neutral-900/80 to-neutral-800/40",
                "rounded-2xl overflow-hidden backdrop-blur-sm border border-white/[0.05]",
                "hover:border-white/[0.1] transition-all duration-500 hover:shadow-2xl",
                "hover:shadow-cyan-500/10 hover:-translate-y-1"
              )}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
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

        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <Link href="/products">
            <motion.button
              className={cn(
                "relative px-8 py-4 text-lg font-semibold text-white rounded-lg",
                "bg-gradient-to-r from-neutral-800 to-neutral-700 border border-white/20",
                "hover:from-white hover:to-neutral-100 hover:text-black",
                "transition-all duration-500 overflow-hidden group"
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="relative z-10">VIEW ALL PRODUCTS</span>
              <span className="absolute inset-x-0 w-1/2 mx-auto -bottom-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent h-px" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000" />
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}