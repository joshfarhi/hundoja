'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth, UserButton } from '@clerk/nextjs';
import { ShoppingBag, Menu, X } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

export default function Navigation() {
  const { isSignedIn } = useAuth();
  const { state, dispatch } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-2xl font-bold text-white">
              HUNDOJA
            </Link>

            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-white hover:text-gray-300 transition-colors">
                Home
              </Link>
              <Link href="/products" className="text-white hover:text-gray-300 transition-colors">
                Shop
              </Link>
              <Link href="/about" className="text-white hover:text-gray-300 transition-colors">
                About
              </Link>
              <Link href="/contact" className="text-white hover:text-gray-300 transition-colors">
                Contact
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => dispatch({ type: 'TOGGLE_CART' })}
                className="relative text-white hover:text-gray-300 transition-colors"
              >
                <ShoppingBag size={24} />
                {state.items.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-white text-black text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {state.items.reduce((total, item) => total + item.quantity, 0)}
                  </span>
                )}
              </button>

              {isSignedIn ? (
                <UserButton 
                  appearance={{
                    elements: {
                      avatarBox: "h-8 w-8"
                    }
                  }}
                />
              ) : (
                <div className="hidden md:flex space-x-4">
                  <Link
                    href="/sign-in"
                    className="text-white hover:text-gray-300 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/sign-up"
                    className="bg-white text-black px-4 py-2 rounded hover:bg-gray-200 transition-colors"
                  >
                    Sign Up
                  </Link>
                </div>
              )}

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden text-white"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden bg-black border-t border-white/10">
            <div className="px-4 py-2 space-y-2">
              <Link href="/" className="block text-white hover:text-gray-300 py-2">
                Home
              </Link>
              <Link href="/products" className="block text-white hover:text-gray-300 py-2">
                Shop
              </Link>
              <Link href="/about" className="block text-white hover:text-gray-300 py-2">
                About
              </Link>
              <Link href="/contact" className="block text-white hover:text-gray-300 py-2">
                Contact
              </Link>
              {!isSignedIn && (
                <div className="pt-4 border-t border-white/10">
                  <Link
                    href="/sign-in"
                    className="block text-white hover:text-gray-300 py-2"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/sign-up"
                    className="block bg-white text-black px-4 py-2 rounded hover:bg-gray-200 transition-colors mt-2"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}