'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-white">Customer Management</h1>
        <p className="text-neutral-400 mt-1">View and manage customer accounts and profiles</p>
        <div className="mt-8 p-12 rounded-xl bg-gradient-to-br from-neutral-900/80 to-neutral-800/40 border border-white/10">
          <Users className="mx-auto text-neutral-600 mb-4" size={64} />
          <p className="text-neutral-400 text-lg">Customer management coming soon</p>
          <p className="text-neutral-500 text-sm">This section will include customer profiles, order history, and analytics</p>
        </div>
      </motion.div>
    </div>
  );
}