'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/contexts/CartContext';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ShoppingCart, Eye, Filter, ArrowUpDown, ChevronDown } from 'lucide-react';
import Navigation from '@/components/Navigation';
import CartSidebar from '@/components/CartSidebar';
import Footer from '@/components/Footer';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  is_featured: boolean;
  categories: { slug: string; name: string; };
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function ProductsPage() {
  const { dispatch } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  
  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: productsData } = await supabase.from('products').select('*, categories(slug, name)');
      const { data: categoriesData } = await supabase.from('categories').select('*');
      
      setProducts(productsData || []);
      setCategories(categoriesData || []);
    };
    fetchInitialData();

    const channel = supabase.channel('public:products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, 
        (payload) => setProducts(prev => [...prev.filter(p => p.id !== (payload.new as Product).id), (payload.new as Product)])
      )
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, []);

  const filteredAndSortedProducts = useMemo(() => {
    const filtered = selectedCategory === 'all' 
      ? products 
      : products.filter(p => p.categories?.slug === selectedCategory);
    
    // Simple sort example
    return filtered.sort((a, b) => {
      if (sortBy === 'price') return a.price - b.price;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return (a.is_featured ? -1 : 1) - (b.is_featured ? -1 : 1);
    });
  }, [products, selectedCategory, sortBy]);

  const addToCart = (product: Product) => {
    dispatch({
      type: 'ADD_ITEM',
      payload: { id: product.id, name: product.name, price: product.price, image: product.images[0] },
    });
  };

  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      <CartSidebar />
      <div className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-4">All Products</h1>
          
          <div className="flex justify-center flex-wrap gap-3 my-8">
            <button onClick={() => setSelectedCategory('all')} className={cn('px-6 py-2 rounded-lg', selectedCategory === 'all' ? 'bg-white text-black' : 'text-white')}>All</button>
            {categories.map((cat) => (
              <button key={cat.id} onClick={() => setSelectedCategory(cat.slug)} className={cn('px-6 py-2 rounded-lg', selectedCategory === cat.slug ? 'bg-white text-black' : 'text-white')}>
                {cat.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredAndSortedProducts.map((product, index) => (
              <motion.div key={product.id} layout className="group relative bg-neutral-900 rounded-2xl overflow-hidden"
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                <Link href={`/products/${product.id}`} className="block">
                  <Image src={product.images[0]} alt={product.name} width={500} height={500} className="object-cover" />
                </Link>
                <div className="p-4">
                  <h3 className="text-white font-semibold">{product.name}</h3>
                  <p className="text-neutral-400 text-sm">{product.categories?.name}</p>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-white font-bold text-xl">${product.price}</span>
                    <button onClick={() => addToCart(product)} className="bg-white text-black px-4 py-2 rounded-lg">Add to Cart</button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}