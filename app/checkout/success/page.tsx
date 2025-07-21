'use client';

import React from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import CartSidebar from '@/components/CartSidebar';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      <CartSidebar />
      
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          className="text-center max-w-md mx-auto px-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <CheckCircle className="w-24 h-24 text-green-500 mx-auto" />
          </motion.div>
          
          <h1 className="text-3xl font-bold text-white mb-4">
            Order Successful!
          </h1>
          <p className="text-gray-400 mb-8">
            Thank you for your purchase. You will receive an email confirmation shortly.
          </p>
          
          <div className="space-y-4">
            <Link
              href="/products"
              className="block bg-white text-black px-8 py-3 font-semibold hover:bg-gray-200 transition-colors"
            >
              Continue Shopping
            </Link>
            <Link
              href="/dashboard"
              className="block border border-white text-white px-8 py-3 font-semibold hover:bg-white hover:text-black transition-colors"
            >
              View Orders
            </Link>
          </div>
        </motion.div>
      </div>
      
      <Footer />
    </div>
  );
}