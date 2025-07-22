'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { BarChart3, TrendingUp, PieChart, Activity } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-white">Analytics & Reports</h1>
        <p className="text-neutral-400 mt-1">Track performance, sales, and customer insights</p>
        <div className="mt-8 p-12 rounded-xl bg-gradient-to-br from-neutral-900/80 to-neutral-800/40 border border-white/10">
          <BarChart3 className="mx-auto text-neutral-600 mb-4" size={64} />
          <p className="text-neutral-400 text-lg">Analytics dashboard coming soon</p>
          <p className="text-neutral-500 text-sm">This section will include sales reports, customer analytics, and performance metrics</p>
        </div>
      </motion.div>
    </div>
  );
}