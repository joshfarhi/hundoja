'use client';

import React from 'react';
import { motion } from 'framer-motion';
import NewsletterForm from './NewsletterForm';
import Image from 'next/image';

export default function Hero() {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-no-repeat grayscale"
        style={{
          backgroundImage: 'url(/hundoja-hero.jpg)',
          backgroundPosition: 'left 20% top 30%',
        }}
      />
      <div className="absolute inset-0 bg-black/60" />
      
      <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
        <motion.div 
          className="mb-6 flex justify-center"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="w-[196px] sm:w-[280px]">
            <Image src="/Hundoja-2025-logo.webp" alt="Hundoja Logo" width={280} height={93} priority />
          </div>
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