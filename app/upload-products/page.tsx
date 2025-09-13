'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import CartSidebar from '@/components/CartSidebar';
import Footer from '@/components/Footer';
import ProductUploadForm from '@/components/ProductUploadForm';
import ProductBulkUpload from '@/components/ProductBulkUpload';
import { useToast } from '@/contexts/ToastContext';
import {
  FileText,
  Plus,
  Package,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

type UploadMode = 'single' | 'bulk';

export default function UploadProductsPage() {
  const { showToast } = useToast();
  const [uploadMode, setUploadMode] = useState<UploadMode>('single');

  const handleUploadSuccess = () => {
    showToast('Products uploaded successfully!', 'success');
    // You could redirect to products page or refresh the current page
    // router.refresh(); // if using Next.js router
  };

  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      <CartSidebar />

      <div className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft size={16} />
              Back to Products
            </Link>

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Upload Products
            </h1>
            <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
              Add new products to your storefront directly. Choose between adding products one by one or bulk uploading via CSV.
            </p>
          </div>

          {/* Upload Mode Selector */}
          <div className="flex justify-center mb-8">
            <div className="bg-neutral-900 rounded-xl p-1 flex">
              <button
                onClick={() => setUploadMode('single')}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  uploadMode === 'single'
                    ? 'bg-white text-black shadow-lg'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Plus size={18} />
                Single Product
              </button>
              <button
                onClick={() => setUploadMode('bulk')}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  uploadMode === 'bulk'
                    ? 'bg-white text-black shadow-lg'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <FileText size={18} />
                Bulk Upload
              </button>
            </div>
          </div>

          {/* Upload Form */}
          <motion.div
            key={uploadMode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {uploadMode === 'single' ? (
              <ProductUploadForm
                onSuccess={handleUploadSuccess}
                onCancel={() => setUploadMode('single')}
              />
            ) : (
              <ProductBulkUpload
                onSuccess={handleUploadSuccess}
                onCancel={() => setUploadMode('single')}
              />
            )}
          </motion.div>

          {/* Help Section */}
          <div className="mt-12 bg-neutral-900/50 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Upload Guidelines</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Package size={20} />
                  Single Product Upload
                </h3>
                <ul className="text-neutral-300 space-y-2 text-sm">
                  <li>• Fill in all required fields (name, SKU, price, category)</li>
                  <li>• Add product images by URL</li>
                  <li>• Set sizes and colors as comma-separated values</li>
                  <li>• Products are active by default</li>
                  <li>• Mark as featured to highlight on homepage</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <FileText size={20} />
                  Bulk CSV Upload
                </h3>
                <ul className="text-neutral-300 space-y-2 text-sm">
                  <li>• Download the CSV template first</li>
                  <li>• Required columns: name, sku, price, category_name</li>
                  <li>• Optional: description, stock_quantity, sizes, colors, images</li>
                  <li>• Use exact category names from your store</li>
                  <li>• Supports up to multiple images per product</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <h4 className="text-blue-400 font-semibold mb-2">Important Notes:</h4>
              <ul className="text-neutral-300 text-sm space-y-1">
                <li>• All uploads go directly to your live database</li>
                <li>• Products appear immediately on your storefront</li>
                <li>• Make sure categories exist before uploading products</li>
                <li>• SKU must be unique across all products</li>
                <li>• Images should be hosted URLs (not local files)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
