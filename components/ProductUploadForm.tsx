'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/contexts/ToastContext';
import { cn } from '@/lib/utils';
import {
  Upload,
  Image as ImageIcon,
  DollarSign,
  Hash,
  Tag,
  Save,
  X,
  Plus,
  Minus
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductFormData {
  name: string;
  description: string;
  sku: string;
  price: number;
  stock_quantity: number;
  category_id: string;
  images: string[];
  is_active: boolean;
  is_featured: boolean;
  sizes: string[];
  colors: string[];
}

interface ProductUploadFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export default function ProductUploadForm({ onSuccess, onCancel, className }: ProductUploadFormProps) {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    sku: '',
    price: 0,
    stock_quantity: 10,
    category_id: '',
    images: [],
    is_active: true,
    is_featured: false,
    sizes: [],
    colors: []
  });

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    let finalValue: string | number | boolean;

    if (type === 'checkbox') {
      finalValue = checked;
    } else if (type === 'number') {
      finalValue = value === '' ? 0 : parseFloat(value);
    } else {
      finalValue = value;
    }

    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleArrayInputChange = (field: 'sizes' | 'colors', value: string) => {
    const items = value.split(',').map(item => item.trim()).filter(item => item.length > 0);
    setFormData(prev => ({ ...prev, [field]: items }));
  };

  const addImageUrl = () => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, '']
    }));
  };

  const updateImageUrl = (index: number, url: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => i === index ? url : img)
    }));
  };

  const removeImageUrl = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.name.trim()) {
      showToast('Product name is required', 'error');
      return;
    }
    if (!formData.sku.trim()) {
      showToast('SKU is required', 'error');
      return;
    }
    if (formData.price <= 0) {
      showToast('Price must be greater than 0', 'error');
      return;
    }
    if (!formData.category_id) {
      showToast('Please select a category', 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create product');
      }

      await response.json();

      showToast('Product created successfully!', 'success');

      // Reset form
      setFormData({
        name: '',
        description: '',
        sku: '',
        price: 0,
        stock_quantity: 10,
        category_id: '',
        images: [],
        is_active: true,
        is_featured: false,
        sizes: [],
        colors: []
      });

      onSuccess?.();

    } catch (error) {
      console.error('Error creating product:', error);
      showToast(error instanceof Error ? error.message : 'Error creating product', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('bg-neutral-900 rounded-xl p-6 max-w-2xl mx-auto', className)}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Upload size={24} />
          Add New Product
        </h2>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white border-b border-neutral-700 pb-2">
            Basic Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Urban Cargo Pants"
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                SKU *
              </label>
              <div className="relative">
                <Hash size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleInputChange}
                  placeholder="e.g., URBAN-CARGO-001"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg pl-10 pr-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe your product..."
              rows={3}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Pricing & Inventory */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white border-b border-neutral-700 pb-2">
            Pricing & Inventory
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Price *
              </label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg pl-10 pr-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Stock Quantity
              </label>
              <input
                type="number"
                name="stock_quantity"
                value={formData.stock_quantity}
                onChange={handleInputChange}
                placeholder="10"
                min="0"
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Category *
            </label>
            <div className="relative">
              <Tag size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleInputChange}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg pl-10 pr-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white border-b border-neutral-700 pb-2 flex items-center gap-2">
            <ImageIcon size={20} />
            Product Images
          </h3>

          <div className="space-y-3">
            {formData.images.map((image, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="url"
                  value={image}
                  onChange={(e) => updateImageUrl(index, e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => removeImageUrl(index)}
                  className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
                >
                  <Minus size={16} />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addImageUrl}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors"
            >
              <Plus size={16} />
              Add Image URL
            </button>
          </div>
        </div>

        {/* Variants */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white border-b border-neutral-700 pb-2">
            Product Variants
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Sizes (comma-separated)
              </label>
              <input
                type="text"
                placeholder="S, M, L, XL"
                value={formData.sizes.join(', ')}
                onChange={(e) => handleArrayInputChange('sizes', e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Colors (comma-separated)
              </label>
              <input
                type="text"
                placeholder="Black, White, Navy"
                value={formData.colors.join(', ')}
                onChange={(e) => handleArrayInputChange('colors', e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white border-b border-neutral-700 pb-2">
            Settings
          </h3>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-white">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
                className="h-4 w-4 rounded bg-neutral-700 text-blue-600 focus:ring-blue-500 border-neutral-600"
              />
              <span>Active (visible on storefront)</span>
            </label>

            <label className="flex items-center gap-2 text-white">
              <input
                type="checkbox"
                name="is_featured"
                checked={formData.is_featured}
                onChange={handleInputChange}
                className="h-4 w-4 rounded bg-neutral-700 text-blue-600 focus:ring-blue-500 border-neutral-600"
              />
              <span>Featured product</span>
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3 pt-6 border-t border-neutral-700">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <Save size={16} />
            {loading ? 'Creating Product...' : 'Create Product'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
