import React from 'react';
import { notFound } from 'next/navigation';
import Navigation from '@/components/Navigation';
import CartSidebar from '@/components/CartSidebar';
import Footer from '@/components/Footer';
import ProductDetails from '@/components/ProductDetails';
import { supabase } from '@/lib/supabase';

interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  price: number;
  stock_quantity: number;
  images: string[];
  is_active: boolean;
  is_featured: boolean;
  sizes: string[];
  colors: string[];
  categories: { 
    id: string;
    slug: string; 
    name: string; 
  };
  created_at: string;
}

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

async function getProduct(id: string): Promise<Product | null> {
  const { data: product, error } = await supabase
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
      is_featured,
      sizes,
      colors,
      created_at,
      categories!inner (
        id,
        name,
        slug
      )
    `)
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error || !product) {
    return null;
  }

  // Transform the categories array to single object since products have one category
  const transformedProduct = {
    ...product,
    categories: Array.isArray(product.categories) 
      ? product.categories[0] 
      : product.categories || { id: '', name: 'Uncategorized', slug: 'uncategorized' }
  };

  return transformedProduct as Product;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      <CartSidebar />
      
      <div className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4">
          <ProductDetails product={product} />
        </div>
      </div>
      
      <Footer />
    </div>
  );
}