'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Mail, Send, CheckCircle, AlertCircle } from 'lucide-react';

interface NewsletterFormProps {
  variant?: 'hero' | 'footer';
  className?: string;
}

export default function NewsletterForm({ variant = 'footer', className }: NewsletterFormProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setStatus('error');
      setMessage('Please enter your email address');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to subscribe');
      }

      setStatus('success');
      setMessage('🎉 Successfully subscribed to our newsletter!');
      setEmail('');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    }
  };

  const isHero = variant === 'hero';

  return (
    <div className={cn("w-full max-w-md mx-auto", className)}>
      <form onSubmit={handleSubmit} className="space-y-3">
        {isHero && (
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold text-white mb-1">
              Stay Updated
            </h3>
            <p className="text-gray-300 text-sm">
              Get exclusive drops and style updates
            </p>
          </div>
        )}

        <div className="relative">
          <Mail 
            className={cn(
              "absolute left-3 top-1/2 transform -translate-y-1/2",
              isHero ? "text-gray-300" : "text-gray-400"
            )} 
            size={18} 
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            disabled={status === 'loading'}
            className={cn(
              "w-full pl-10 pr-4 py-3 rounded-lg border transition-all duration-200",
              "focus:outline-none focus:ring-2",
              isHero ? [
                "bg-black/30 border-white/20 text-white placeholder-gray-300",
                "focus:ring-white/30 focus:border-white/40",
                "backdrop-blur-sm"
              ] : [
                "bg-neutral-800 border-neutral-700 text-white placeholder-gray-400",
                "focus:ring-cyan-500/50 focus:border-cyan-500/50"
              ],
              status === 'loading' && "opacity-50 cursor-not-allowed"
            )}
          />
        </div>

        <motion.button
          type="submit"
          disabled={status === 'loading' || !email}
          className={cn(
            "w-full py-2 sm:py-3 px-4 sm:px-6 font-semibold transition-all duration-300",
            "flex items-center justify-center space-x-2",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "bg-white text-black hover:bg-gray-200 transform hover:scale-105",
            "text-sm sm:text-base",
            "focus:outline-none focus:ring-2 focus:ring-white/30"
          )}
          whileHover={{ scale: status === 'loading' ? 1 : 1.05 }}
          whileTap={{ scale: status === 'loading' ? 1 : 0.98 }}
        >
          {status === 'loading' ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Subscribing...</span>
            </>
          ) : (
            <>
              <Send size={16} />
              <span>SUBSCRIBE</span>
            </>
          )}
        </motion.button>
      </form>

      {/* Status Messages */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "mt-3 p-3 rounded-lg flex items-center space-x-2 text-sm",
            status === 'success' && "bg-green-500/20 text-green-300 border border-green-500/30",
            status === 'error' && "bg-red-500/20 text-red-300 border border-red-500/30"
          )}
        >
          {status === 'success' && <CheckCircle size={16} />}
          {status === 'error' && <AlertCircle size={16} />}
          <span>{message}</span>
        </motion.div>
      )}

      {!isHero && (
        <p className="text-xs text-gray-400 mt-2 text-center">
          Join our community for exclusive updates on upcoming fashion releases and style insights—unsubscribe anytime.
        </p>
      )}
    </div>
  );
}