'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';
import { 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  Package, 
  Truck, 
  Shield, 
  ArrowLeft,
  ShoppingBag,
  Heart,
  Share2
} from 'lucide-react';
import Link from 'next/link';

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

interface ProductDetailsProps {
  product: Product;
}

export default function ProductDetails({ product }: ProductDetailsProps) {
  const { dispatch } = useCart();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const addToCart = () => {
    if (product.stock_quantity === 0) {
      alert('This product is out of stock');
      return;
    }

    // Add item to cart (quantity is handled by the reducer)
    for (let i = 0; i < quantity; i++) {
      dispatch({
        type: 'ADD_ITEM',
        payload: {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.images[0] || '/placeholder-product.jpg',
        },
      });
    }

    // Show success message or animation
    alert(`Added ${quantity} ${product.name}(s) to cart!`);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === product.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? product.images.length - 1 : prev - 1
    );
  };

  const shareProduct = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: window.location.href,
        });
      } catch {
        // User cancelled sharing or error occurred - handle silently
      }
    } else {
      // Fallback to copying URL to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Product URL copied to clipboard!');
    }
  };

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-neutral-400">
        <Link href="/products" className="hover:text-white transition-colors flex items-center gap-1">
          <ArrowLeft size={16} />
          Back to Products
        </Link>
        <span>/</span>
        <span className="text-neutral-600">{product.categories?.name || 'Uncategorized'}</span>
        <span>/</span>
        <span className="text-white">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Images */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="relative aspect-square rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800">
            {product.images && product.images.length > 0 ? (
              <Image
                src={product.images[currentImageIndex]}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="text-neutral-600" size={64} />
              </div>
            )}
            
            {/* Image Navigation */}
            {product.images && product.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition-colors backdrop-blur-sm"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition-colors backdrop-blur-sm"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            {/* Image Counter */}
            {product.images && product.images.length > 1 && (
              <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                {currentImageIndex + 1} / {product.images.length}
              </div>
            )}
          </div>
          
          {/* Thumbnail Gallery */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-4 mt-4 overflow-x-auto pb-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={cn(
                    'relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all',
                    currentImageIndex === index 
                      ? 'border-white shadow-lg' 
                      : 'border-neutral-700 hover:border-neutral-500'
                  )}
                >
                  <Image
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Product Info */}
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Header */}
          <div>
            <div className="flex items-start justify-between mb-2">
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                {product.name}
              </h1>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    isWishlisted 
                      ? 'bg-red-500 text-white' 
                      : 'bg-neutral-800 text-neutral-400 hover:text-white'
                  )}
                >
                  <Heart size={20} fill={isWishlisted ? 'currentColor' : 'none'} />
                </button>
                <button
                  onClick={shareProduct}
                  className="p-2 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                >
                  <Share2 size={20} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <span className="text-3xl font-bold text-white">
                ${product.price.toFixed(2)}
              </span>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="text-neutral-400 ml-2">(4.8)</span>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <span className="text-sm text-neutral-400">SKU: {product.sku}</span>
              <span className="text-sm text-neutral-400">
                Category: {product.categories?.name || 'Uncategorized'}
              </span>
            </div>

            {/* Stock Status */}
            <div className="mb-6">
              {product.stock_quantity > 0 ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-green-400 font-medium">
                    {product.stock_quantity > 10 
                      ? 'In Stock' 
                      : `Only ${product.stock_quantity} left!`
                    }
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <span className="text-red-400 font-medium">Out of Stock</span>
                </div>
              )}
            </div>

            <p className="text-neutral-300 text-lg leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Quantity and Add to Cart */}
          <div className="space-y-4">
            {product.stock_quantity > 0 && (
              <div>
                <label className="block text-white font-semibold mb-2">Quantity</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="w-16 text-center text-white font-semibold">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                    className="w-10 h-10 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700 transition-colors flex items-center justify-center"
                  >
                    +
                  </button>
                  <span className="text-neutral-400 text-sm ml-2">
                    Max: {product.stock_quantity}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={addToCart}
              disabled={product.stock_quantity === 0}
              className={cn(
                'w-full py-4 text-lg font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2',
                product.stock_quantity > 0
                  ? 'bg-white text-black hover:bg-gray-200 hover:scale-[1.02]'
                  : 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
              )}
            >
              <ShoppingBag size={20} />
              {product.stock_quantity > 0 ? 'ADD TO CART' : 'OUT OF STOCK'}
            </button>
          </div>

          {/* Product Features */}
          <div className="border-t border-neutral-800 pt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-neutral-900/50 rounded-lg">
                <Truck className="text-cyan-400" size={20} />
                <div>
                  <p className="text-white font-medium text-sm">Free Shipping</p>
                  <p className="text-neutral-400 text-xs">On orders over $100</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-neutral-900/50 rounded-lg">
                <Shield className="text-green-400" size={20} />
                <div>
                  <p className="text-white font-medium text-sm">Secure Payment</p>
                  <p className="text-neutral-400 text-xs">100% protected</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-white font-semibold mb-2">Product Features</h4>
                <ul className="text-neutral-300 space-y-1 text-sm">
                  <li>• Premium quality materials</li>
                  <li>• Comfortable and durable design</li>
                  <li>• Available in multiple styles</li>
                  <li>• Machine washable</li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-white font-semibold mb-2">Care Instructions</h4>
                <p className="text-neutral-300 text-sm">
                  Machine wash cold with like colors. Tumble dry low. Do not bleach. Iron on low heat if needed.
                </p>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-2">Size Guide</h4>
                <p className="text-neutral-300 text-sm">
                  Please refer to our size chart for the best fit. If you&apos;re between sizes, we recommend sizing up for comfort.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}