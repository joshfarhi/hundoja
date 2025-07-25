import React from 'react';
import { supabase } from '@/lib/supabase';
import Navigation from '@/components/Navigation';
import CartSidebar from '@/components/CartSidebar';
import Footer from '@/components/Footer';
import ProductGrid from '@/components/ProductGrid';

interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  price: number;
  stock_quantity: number;
  images: string[];
  is_active: boolean;
  categories: { 
    id: string;
    slug: string; 
    name: string; 
  };
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
}

// Server-side data fetching
async function getProductsData() {
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select(`
      id,
      name,
      description,
      sku,
      price,
      stock_quantity,
      images,
      is_active,
      created_at,
      categories (
        id,
        name,
        slug
      )
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('id, name, slug, is_active')
    .eq('is_active', true)
    .order('name');

  if (productsError || categoriesError) {
    console.error('Error fetching data:', productsError || categoriesError);
    return { products: [], categories: [] };
  }

  // Transform products to ensure categories is a single object
  const transformedProducts = products?.map(product => ({
    ...product,
    categories: Array.isArray(product.categories) 
      ? product.categories[0] 
      : product.categories || { id: '', name: 'Uncategorized', slug: 'uncategorized' }
  })) || [];

  return { 
    products: transformedProducts as Product[], 
    categories: categories as Category[] || [] 
  };
}

export default async function ProductsPage() {
  const { products, categories } = await getProductsData();

  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      <CartSidebar />
      <div className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">All Products</h1>
            <p className="text-neutral-400 text-lg">Discover our complete collection</p>
          </div>
          
          <ProductGrid initialProducts={products} categories={categories} />
        </div>
      </div>
      <Footer />
    </div>
  );
}