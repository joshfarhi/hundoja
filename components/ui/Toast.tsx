'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { cn } from '@/lib/utils';

const toastVariants = {
  initial: { opacity: 0, y: -50, scale: 0.3 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.5, transition: { duration: 0.2 } }
};

const getToastIcon = (type: string) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="w-5 h-5" />;
    case 'error':
      return <AlertCircle className="w-5 h-5" />;
    case 'warning':
      return <AlertTriangle className="w-5 h-5" />;
    case 'info':
    default:
      return <Info className="w-5 h-5" />;
  }
};

const getToastStyles = (type: string) => {
  switch (type) {
    case 'success':
      return 'bg-green-900/90 border-green-500 text-green-100';
    case 'error':
      return 'bg-red-900/90 border-red-500 text-red-100';
    case 'warning':
      return 'bg-yellow-900/90 border-yellow-500 text-yellow-100';
    case 'info':
    default:
      return 'bg-blue-900/90 border-blue-500 text-blue-100';
  }
};

export const ToastContainer: React.FC = () => {
  const { toasts, hideToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            variants={toastVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn(
              'flex items-center gap-3 p-4 rounded-lg border backdrop-blur-sm shadow-lg min-w-[300px] max-w-[500px]',
              getToastStyles(toast.type)
            )}
          >
            {getToastIcon(toast.type)}
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
              onClick={() => hideToast(toast.id)}
              className="p-1 hover:bg-black/20 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
