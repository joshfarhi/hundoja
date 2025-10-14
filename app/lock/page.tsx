'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function LockPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Invalid password' }));
        setError(data.error || 'Invalid password');
        return;
      }
      router.replace('/');
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="relative min-h-[100dvh] sm:min-h-screen flex items-center justify-center overflow-hidden px-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div 
        className="absolute inset-0 bg-cover bg-no-repeat grayscale"
        style={{
          backgroundImage: 'url(/hundoja-hero.jpg)',
          backgroundPosition: 'left 20% top 30%',
        }}
      />
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10 text-center max-w-md mx-auto w-full sm:px-6">
        <motion.div 
          className="mb-8 flex justify-center"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="w-[196px] sm:w-[280px]">
            <Image src="/Hundoja-2025-logo.webp" alt="Hundoja Logo" width={280} height={93} priority />
          </div>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="bg-black/40 border border-white/10 rounded-lg p-6 space-y-4 backdrop-blur"
        >
          <h1 className="text-white text-2xl font-semibold">Enter Password</h1>
          <p className="text-neutral-300 text-sm">This site is temporarily locked.</p>

          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              autoComplete="current-password"
              autoCapitalize="none"
              spellCheck={false}
              inputMode="text"
              className="w-full px-4 py-3 rounded-md bg-black/60 border border-white/10 text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-white/30"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm" role="alert">{error}</div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            aria-busy={isLoading}
            className="w-full py-3 rounded-md bg-white text-black font-semibold hover:bg-neutral-200 transition disabled:opacity-60"
          >
            {isLoading ? 'Unlocking…' : 'Unlock'}
          </button>
        </motion.form>
      </div>

      <motion.div
        className="hidden sm:block absolute bottom-8 left-1/2 transform -translate-x-1/2"
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


