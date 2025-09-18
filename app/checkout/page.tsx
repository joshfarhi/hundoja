'use client';

import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import Navigation from '@/components/Navigation';
import CartSidebar from '@/components/CartSidebar';
import Footer from '@/components/Footer';
import CheckoutForm from '@/components/CheckoutForm';
import { getStripe } from '@/lib/stripe';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import type { Stripe } from '@stripe/stripe-js';

export default function CheckoutPage() {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const { state } = useCart();
  const { isSignedIn } = useAuth();

  useEffect(() => {
    setStripePromise(getStripe());
  }, []);

  if (!isSignedIn) {
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
            <h1 className="text-3xl font-bold text-white mb-4">
              Sign In Required
            </h1>
            <p className="text-gray-400 mb-8">
              Please sign in to proceed with checkout
            </p>
            <Link
              href="/sign-in"
              className="bg-white text-black px-8 py-3 font-semibold hover:bg-gray-200 transition-colors"
            >
              Sign In
            </Link>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  if (state.items.length === 0) {
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
            <h1 className="text-3xl font-bold text-white mb-4">
              Your cart is empty
            </h1>
            <p className="text-gray-400 mb-8">
              Add some items to your cart before checking out
            </p>
            <Link
              href="/products"
              className="bg-white text-black px-8 py-3 font-semibold hover:bg-gray-200 transition-colors"
            >
              Shop Now
            </Link>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  const options = {
    mode: 'payment' as const,
    amount: Math.round(state.total * 100),
    currency: 'usd',
    appearance: {
      theme: 'night' as const,
      variables: {
        colorPrimary: '#ffffff',
      },
    },
  };

  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      <CartSidebar />
      
      <div className="pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4">
          <motion.h1
            className="text-3xl md:text-4xl font-bold text-white mb-8 text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            CHECKOUT
          </motion.h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <motion.div
              className="bg-zinc-900 p-6 rounded-lg"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h2 className="text-xl font-semibold text-white mb-6">
                Order Summary
              </h2>
              
              <div className="space-y-4 mb-6">
                {state.items.map((item) => (
                  <div key={`${item.id}-${item.size}-${item.color}`} className="flex justify-between text-white">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      {item.size && <p className="text-sm text-gray-400">Size: {item.size}</p>}
                      {item.color && <p className="text-sm text-gray-400">Color: {item.color}</p>}
                      <p className="text-sm text-gray-400">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/10 pt-4 space-y-2">
                <div className="flex justify-between text-white">
                  <span>Subtotal</span>
                  <span>${state.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-white">
                  <span>Shipping</span>
                  <span>
                    {state.shipping === 0 && state.items.length > 0 ? (
                      <span className="text-gray-400">Calculating...</span>
                    ) : state.shipping === 0 && state.subtotal >= 150 ? (
                      <span className="text-green-400">FREE</span>
                    ) : (
                      `$${state.shipping.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="border-t border-white/20 pt-2">
                  <div className="flex justify-between text-white text-lg font-bold">
                    <span>Total</span>
                    <span>${state.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-zinc-900 p-6 rounded-lg"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <h2 className="text-xl font-semibold text-white mb-6">
                Payment Details
              </h2>
              
              {stripePromise ? (
                <Elements stripe={stripePromise} options={options}>
                  <CheckoutForm />
                </Elements>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <div className="text-white">Loading payment form...</div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}