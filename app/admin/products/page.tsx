'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import {
  Plus,
  Edit,
  Package,
  X,
  Tag,
  Save
} from 'lucide-react';

// Expanded Product Type
interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  price: number;
  stock_quantity: number;
  category_id: string;
  images: string[];
  is_active: boolean;
  categories: { name: string };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
  products: { id: string }[];
}

// Confirmation Modal
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, title: string, message: string }) => {
  if (!isOpen) return null;

  return (
    <motion.div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="bg-neutral-800 rounded-lg p-6 w-full max-w-sm" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <p className="text-neutral-300 mt-2 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 rounded bg-neutral-600 text-white hover:bg-neutral-500 transition-colors">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-500 transition-colors">Yes, Delete</button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Enhanced Product Modal
const ProductModal = ({ product, categories, onClose, onSave }: { product: Product | null, categories: Category[], onClose: () => void, onSave: (data: Partial<Product>) => void }) => {
  const [isEditing, setIsEditing] = useState(!product); // Edit mode by default if it's a new product
  const [formData, setFormData] = useState(product || { name: '', sku: '', description: '', price: 0, stock_quantity: 0, category_id: '', images: [], is_active: true });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = () => {
    onSave(formData);
    // If it was an existing product, switch back to view mode
    if (product) {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    if (product) {
      // If editing an existing product, revert changes and go to view mode
      setFormData(product);
      setIsEditing(false);
    } else {
      // If creating a new product, just close the modal
      onClose();
    }
  };

  return (
    <motion.div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="bg-neutral-800 rounded-lg p-6 w-full max-w-2xl" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">{product ? 'Product Details' : 'Add New Product'}</h2>
          <button onClick={onClose}><X className="text-neutral-400 hover:text-white transition-colors" /></button>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6">
          {/* Image */}
          <div className="w-full md:w-1/3">
            <div className="aspect-square bg-neutral-700 rounded-lg flex items-center justify-center overflow-hidden">
              {formData.images && formData.images.length > 0 ? (
                <Image src={formData.images[0]} alt={formData.name} width={300} height={300} className="object-cover w-full h-full" />
              ) : (
                <Package size={48} className="text-neutral-500" />
              )}
            </div>
          </div>

          {/* Form fields or Details view */}
          <div className="w-full md:w-2/3 space-y-4">
            {isEditing ? (
              <>
                <input name="name" value={formData.name} onChange={handleInputChange} placeholder="Product Name" className="w-full bg-neutral-700 rounded p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Description" className="w-full bg-neutral-700 rounded p-3 text-white h-24 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input name="sku" value={formData.sku} onChange={handleInputChange} placeholder="SKU" className="w-full bg-neutral-700 rounded p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <div className="flex gap-4">
                  <input name="price" type="number" value={formData.price} onChange={handleInputChange} placeholder="Price" className="w-1/2 bg-neutral-700 rounded p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input name="stock_quantity" type="number" value={formData.stock_quantity} onChange={handleInputChange} placeholder="Stock" className="w-1/2 bg-neutral-700 rounded p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <select name="category_id" value={formData.category_id} onChange={handleInputChange} className="w-full bg-neutral-700 rounded p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </>
            ) : (
              <div className="space-y-3 text-white">
                <div>
                  <label className="text-sm text-neutral-400">Name</label>
                  <p className="text-lg font-semibold">{formData.name}</p>
                </div>
                <div>
                  <label className="text-sm text-neutral-400">Description</label>
                  <p>{formData.description || 'No description provided.'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-neutral-400">SKU</label>
                    <p className="font-mono">{formData.sku}</p>
                  </div>
                  <div>
                    <label className="text-sm text-neutral-400">Category</label>
                    <p>{categories.find(c => c.id === formData.category_id)?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-neutral-400">Price</label>
                    <p className="font-semibold">${formData.price}</p>
                  </div>
                  <div>
                    <label className="text-sm text-neutral-400">Stock</label>
                    <p className={cn(formData.stock_quantity > 10 ? 'text-green-400' : 'text-yellow-400', 'font-semibold')}>{formData.stock_quantity} units</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-neutral-700">
          {isEditing ? (
            <>
              <button onClick={handleCancel} className="px-5 py-2.5 rounded-lg bg-neutral-600 text-white font-semibold hover:bg-neutral-500 transition-colors">Cancel</button>
              <button onClick={handleSave} className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-colors flex items-center space-x-2">
                <Save size={16} />
                <span>Save Changes</span>
              </button>
            </>
          ) : (
            <>
              <button onClick={onClose} className="px-5 py-2.5 rounded-lg bg-neutral-600 text-white font-semibold hover:bg-neutral-500 transition-colors">Close</button>
              <button onClick={() => setIsEditing(true)} className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-colors flex items-center space-x-2">
                <Edit size={16} />
                <span>Edit Product</span>
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// Category Modal
const CategoryModal = ({ category, onClose, onSave }: { category: Category | null, onClose: () => void, onSave: (data: Partial<Category>) => void }) => {
  const [isEditing, setIsEditing] = useState(!category);
  const [formData, setFormData] = useState(category || { name: '', slug: '', description: '', is_active: true });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    const finalValue: string | boolean = type === 'checkbox' ? checked : value;
    if (name === 'name' && isEditing) {
      // Auto-generate slug from name
      const slug = (finalValue as string).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      setFormData(prev => ({ ...prev, name: finalValue as string, slug: slug }));
    } else {
      setFormData(prev => ({ ...prev, [name]: finalValue }));
    }
  };

  const handleSave = () => {
    onSave(formData);
    if (category) setIsEditing(false);
  };

  const handleCancel = () => {
    if (category) {
      setFormData(category);
      setIsEditing(false);
    } else {
      onClose();
    }
  };

  return (
    <motion.div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="bg-neutral-800 rounded-lg p-6 w-full max-w-lg" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">{category ? 'Category Details' : 'Add New Category'}</h2>
          <button onClick={onClose}><X className="text-neutral-400 hover:text-white transition-colors" /></button>
        </div>
        
        <div className="space-y-4">
          {isEditing ? (
            <>
              <input name="name" value={formData.name} onChange={handleInputChange} placeholder="Category Name" className="w-full bg-neutral-700 rounded p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input name="slug" value={formData.slug} onChange={handleInputChange} placeholder="URL Slug" className="w-full bg-neutral-700 rounded p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <textarea name="description" value={formData.description || ''} onChange={handleInputChange} placeholder="Description" className="w-full bg-neutral-700 rounded p-3 text-white h-24 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <label className="flex items-center space-x-3 text-white">
                <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleInputChange} className="h-4 w-4 rounded bg-neutral-700 text-blue-600 focus:ring-blue-500 border-neutral-600" />
                <span>Active</span>
              </label>
            </>
          ) : (
            <>
              <div>
                <label className="text-sm text-neutral-400">Name</label>
                <p className="text-lg font-semibold">{formData.name}</p>
              </div>
              <div>
                <label className="text-sm text-neutral-400">Slug</label>
                <p className="font-mono text-sm bg-neutral-700 px-2 py-1 rounded-md inline-block">{formData.slug}</p>
              </div>
              <div>
                <label className="text-sm text-neutral-400">Description</label>
                <p>{formData.description || 'No description provided.'}</p>
              </div>
              <div>
                <label className="text-sm text-neutral-400">Status</label>
                <p className={cn('font-semibold', formData.is_active ? 'text-green-400' : 'text-yellow-400')}>
                  {formData.is_active ? 'Active' : 'Inactive'}
                </p>
              </div>
            </>
          )}
        </div>
        
        <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-neutral-700">
          {isEditing ? (
            <>
              <button onClick={handleCancel} className="px-5 py-2.5 rounded-lg bg-neutral-600 text-white font-semibold hover:bg-neutral-500">Cancel</button>
              <button onClick={handleSave} className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-500 flex items-center space-x-2"><Save size={16}/><span>Save Category</span></button>
            </>
          ) : (
            <>
              <button onClick={onClose} className="px-5 py-2.5 rounded-lg bg-neutral-600 text-white font-semibold hover:bg-neutral-500">Close</button>
              <button onClick={() => setIsEditing(true)} className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-500 flex items-center space-x-2"><Edit size={16}/><span>Edit Category</span></button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// Main Component
export default function ProductsPage() {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);


  const fetchData = useCallback(async () => {
    // Not setting loading to true here to allow for smooth background updates
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('*, categories(name)');
    
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .select('*, products(id)');

    if (productsError || categoriesError) {
      console.error('Error fetching data:', productsError || categoriesError);
    } else {
      setProducts(productsData as Product[]);
      setCategories(categoriesData as Category[]);
    }
    setLoading(false); // Set loading to false only on initial fetch
  }, []);

  useEffect(() => {
    fetchData();
    const productChannel = supabase.channel('public:products').on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchData).subscribe();
    const categoryChannel = supabase.channel('public:categories').on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, fetchData).subscribe();
    return () => {
      supabase.removeChannel(productChannel);
      supabase.removeChannel(categoryChannel);
    };
  }, [fetchData]);

  const handleOpenProductModal = (product: Product | null) => {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };
  
  const handleSaveProduct = async (productData: Partial<Product>) => {
    const { id, ...updateData } = productData;
    const request = id 
      ? supabase.from('products').update(updateData).eq('id', id)
      : supabase.from('products').insert([updateData]);

    await request;
    setIsProductModalOpen(false);
    setSelectedProduct(null);
    // Real-time subscription will handle the UI update
  };
  
  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setIsConfirmModalOpen(true);
  };
  
  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    await supabase.from('products').delete().eq('id', productToDelete.id);
    setIsConfirmModalOpen(false);
    setProductToDelete(null);
    // Real-time subscription will handle the UI update
  };

  const handleOpenCategoryModal = (category: Category | null) => {
    setSelectedCategory(category);
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (categoryData: Partial<Category>) => {
    const { id, ...updateData } = categoryData;
    // Remove products field as it's not needed for update
    delete updateData.products;

    const request = id 
      ? supabase.from('categories').update(updateData).eq('id', id)
      : supabase.from('categories').insert([updateData]);

    await request;
    setIsCategoryModalOpen(false);
    setSelectedCategory(null);
  };

  const handleDeleteCategoryClick = (category: Category) => {
    setCategoryToDelete(category);
    setIsConfirmModalOpen(true);
  };
  
  const handleConfirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    // Here you might want to handle what happens to products in this category
    await supabase.from('categories').delete().eq('id', categoryToDelete.id);
    setIsConfirmModalOpen(false);
    setCategoryToDelete(null);
  };


  return (
    <div className="space-y-6">
      {/* Header, Tabs etc. ... */}
       <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Product Management</h1>
        <button onClick={() => activeTab === 'products' ? handleOpenProductModal(null) : handleOpenCategoryModal(null)} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-500 transition-colors">
          <Plus size={16} />
          <span>{activeTab === 'products' ? 'Add Product' : 'Add Category'}</span>
        </button>
      </div>

      <div className="flex border-b border-neutral-700">
        <button onClick={() => setActiveTab('products')} className={`px-4 py-2 text-lg ${activeTab === 'products' ? 'text-white border-b-2 border-blue-500' : 'text-neutral-400'}`}>Products</button>
        <button onClick={() => setActiveTab('categories')} className={`px-4 py-2 text-lg ${activeTab === 'categories' ? 'text-white border-b-2 border-blue-500' : 'text-neutral-400'}`}>Categories</button>
      </div>

      <AnimatePresence>
        {isProductModalOpen && (
          <ProductModal product={selectedProduct} categories={categories} onClose={() => setIsProductModalOpen(false)} onSave={handleSaveProduct} />
        )}
        {isCategoryModalOpen && (
          <CategoryModal category={selectedCategory} onClose={() => setIsCategoryModalOpen(false)} onSave={handleSaveCategory} />
        )}
      </AnimatePresence>
      
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={productToDelete ? handleConfirmDelete : handleConfirmDeleteCategory}
        title={`Delete ${productToDelete ? 'Product' : 'Category'}`}
        message={`Are you sure you want to delete "${productToDelete?.name || categoryToDelete?.name}"? This action cannot be undone.`}
      />

      {loading ? <div className="text-center py-10 text-white">Loading data...</div> : (
        activeTab === 'products' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map(p => (
              <div key={p.id} className="relative group bg-neutral-800 rounded-lg p-4 cursor-pointer" onClick={() => handleOpenProductModal(p)}>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeleteClick(p); }} 
                  className="absolute top-2 right-2 z-10 p-1.5 rounded-full text-neutral-400 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:bg-white/20 group-hover:text-white hover:!bg-red-500/50"
                >
                  <X size={16} />
                </button>
                <div className="aspect-square relative mb-4 bg-neutral-700 rounded-md">
                  {p.images && p.images.length > 0 ? (
                    <Image src={p.images[0]} alt={p.name} layout="fill" className="object-cover rounded-md" />
                  ) : (
                    <div className="flex items-center justify-center h-full"><Package size={48} className="text-neutral-500"/></div>
                  )}
                </div>
                <h3 className="font-bold text-white truncate">{p.name}</h3>
                <p className="text-neutral-400 text-sm">{p.categories?.name || 'Uncategorized'}</p>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-white font-semibold">${p.price}</p>
                  <p className={`text-sm font-medium ${p.stock_quantity > 0 ? 'text-green-400' : 'text-red-400'}`}>{p.stock_quantity} in stock</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {categories.map(c => (
                <div key={c.id} className="relative group bg-neutral-800 rounded-lg p-4 cursor-pointer" onClick={() => handleOpenCategoryModal(c)}>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteCategoryClick(c); }} 
                    className="absolute top-2 right-2 z-10 p-1.5 rounded-full text-neutral-400 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:bg-white/20 group-hover:text-white hover:!bg-red-500/50"
                  >
                    <X size={16} />
                  </button>
                  <div className="flex items-center space-x-3 mb-2">
                    <Tag className="text-neutral-400" />
                    <h3 className="font-bold text-white truncate">{c.name}</h3>
                  </div>
                  <p className="text-neutral-400 text-sm">{c.products.length} {c.products.length === 1 ? 'product' : 'products'}</p>
                   <p className={cn('mt-2 text-xs font-semibold', c.is_active ? 'text-green-400' : 'text-yellow-400')}>
                    {c.is_active ? 'Active' : 'Inactive'}
                  </p>
                </div>
              ))}
            </div>
        )
      )}
    </div>
  );
}