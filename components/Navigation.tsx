'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, UserButton } from '@clerk/nextjs';
import { ShoppingBag, Menu, X, Home, Store, User, Mail } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

export default function Navigation() {
  const { isSignedIn, userId } = useAuth();
  const { state, dispatch } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Check if user is admin from database
  useEffect(() => {
    async function checkAdminStatus() {
      if (!userId) {
        setIsAdmin(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('admin_users')
          .select('id, role')
          .eq('clerk_user_id', userId)
          .eq('is_active', true);
        
        setIsAdmin(!error && data && data.length > 0);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    }
    
    checkAdminStatus();
  }, [userId]);

  const navItems = [
    { name: 'Home', link: '/', icon: <Home size={20} /> },
    { name: 'Shop', link: '/products', icon: <Store size={20} /> },
    { name: 'About', link: '/about', icon: <User size={20} /> },
    { name: 'Contact', link: '/contact', icon: <Mail size={20} /> },
    ...(isAdmin ? [{ name: 'Admin', link: '/admin', icon: <User size={20} /> }] : []),
  ];

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-black/90 backdrop-blur-xl border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-2xl font-bold text-white tracking-wider">
              HUNDOJA
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item, index) => (
                <Link
                  key={index}
                  href={item.link}
                  className={cn(
                    "relative px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white transition-all duration-300",
                    "hover:bg-white/[0.05] rounded-lg group"
                  )}
                >
                  <span className="relative z-10">{item.name}</span>
                  <span className="absolute inset-x-0 w-1/2 mx-auto -bottom-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent h-px opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>

            {/* Right side items */}
            <div className="flex items-center space-x-3">
              {/* Cart Button */}
              <button
                onClick={() => dispatch({ type: 'TOGGLE_CART' })}
                className={cn(
                  "relative p-2 text-neutral-300 hover:text-white transition-all duration-300",
                  "hover:bg-white/[0.05] rounded-lg group"
                )}
              >
                <ShoppingBag size={20} />
                {state.items.length > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold"
                  >
                    {state.items.reduce((total, item) => total + item.quantity, 0)}
                  </motion.span>
                )}
              </button>

              {/* Auth Buttons */}
              {isSignedIn ? (
                <UserButton 
                  appearance={{
                    elements: {
                      avatarBox: "h-8 w-8 ring-2 ring-white/20 hover:ring-white/40 transition-all"
                    }
                  }}
                />
              ) : (
                <div className="hidden md:flex items-center space-x-2">
                  <Link
                    href="/sign-in"
                    className={cn(
                      "px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white transition-all duration-300",
                      "hover:bg-white/[0.05] rounded-lg"
                    )}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/sign-up"
                    className={cn(
                      "relative px-4 py-2 text-sm font-medium text-black bg-white rounded-lg",
                      "hover:bg-neutral-200 transition-all duration-300 overflow-hidden group"
                    )}
                  >
                    <span className="relative z-10">Sign Up</span>
                    <span className="absolute inset-x-0 w-1/2 mx-auto -bottom-px bg-gradient-to-r from-transparent via-blue-500 to-transparent h-px" />
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={cn(
                  "md:hidden p-2 text-neutral-300 hover:text-white transition-all duration-300",
                  "hover:bg-white/[0.05] rounded-lg"
                )}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isMenuOpen ? 'close' : 'open'}
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                  </motion.div>
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="md:hidden bg-black/95 backdrop-blur-xl border-t border-white/[0.08]"
            >
              <div className="px-4 py-6 space-y-1">
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      href={item.link}
                      onClick={() => setIsMenuOpen(false)}
                      className={cn(
                        "flex items-center space-x-3 px-4 py-3 text-neutral-300 hover:text-white transition-all duration-300",
                        "hover:bg-white/[0.05] rounded-lg group"
                      )}
                    >
                      <span className="text-neutral-400 group-hover:text-cyan-400 transition-colors">
                        {item.icon}
                      </span>
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  </motion.div>
                ))}
                
                {!isSignedIn && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="pt-6 border-t border-white/[0.08] space-y-1"
                  >
                    <Link
                      href="/sign-in"
                      onClick={() => setIsMenuOpen(false)}
                      className={cn(
                        "flex items-center space-x-3 px-4 py-3 text-neutral-300 hover:text-white transition-all duration-300",
                        "hover:bg-white/[0.05] rounded-lg group font-medium"
                      )}
                    >
                      <span className="text-neutral-400 group-hover:text-cyan-400 transition-colors">
                        <User size={20} />
                      </span>
                      <span>Sign In</span>
                    </Link>
                    <div className="px-4 py-2">
                      <Link
                        href="/sign-up"
                        onClick={() => setIsMenuOpen(false)}
                        className={cn(
                          "block w-full px-4 py-3 text-black bg-white rounded-lg font-medium text-center",
                          "hover:bg-neutral-200 transition-all duration-300"
                        )}
                      >
                        Sign Up
                      </Link>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}