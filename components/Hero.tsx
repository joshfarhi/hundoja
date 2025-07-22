'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import NewsletterForm from './NewsletterForm';

export default function Hero() {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat grayscale"
        style={{
          backgroundImage: 'url(/hundoja-hero.jpg)',
        }}
      />
      <div className="absolute inset-0 bg-black/60" />
      
      <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
        <motion.h1 
          className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 tracking-tight"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          HUNDOJA
        </motion.h1>
        
        <motion.p 
          className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          Where streetwear meets premium quality. Discover exclusive collections that define your urban style.
        </motion.p>
        
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <Link
            href="/products"
            className="bg-white text-black px-8 py-4 text-lg font-semibold hover:bg-gray-200 transition-all duration-300 transform hover:scale-105"
          >
            SHOP NOW
          </Link>
          <Link
            href="/about"
            className="border-2 border-white text-white px-8 py-4 text-lg font-semibold hover:bg-white hover:text-black transition-all duration-300"
          >
            LEARN MORE
          </Link>
        </motion.div>

        {/* Newsletter Form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="max-w-md mx-auto"
        >
          <NewsletterForm variant="hero" />
        </motion.div>
      </div>

      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white rounded-full mt-2 animate-bounce" />
        </div>
      </motion.div>
    </section>
  );
}