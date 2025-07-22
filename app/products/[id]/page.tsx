'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import Navigation from '@/components/Navigation';
import CartSidebar from '@/components/CartSidebar';
import Footer from '@/components/Footer';
import { products } from '@/data/products';
import { useCart } from '@/contexts/CartContext';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default function ProductPage({ params }: ProductPageProps) {
  const [id, setId] = useState<string>('');
  const [product, setProduct] = useState<any>(null);
  const { dispatch } = useCart();
  
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    async function getParams() {
      const resolvedParams = await params;
      setId(resolvedParams.id);
      const foundProduct = products.find(p => p.id === resolvedParams.id);
      setProduct(foundProduct);
    }
    getParams();
  }, [params]);

  if (!id) {
    return <div>Loading...</div>;
  }

  if (id && !product) {
    notFound();
  }

  if (!product) {
    return <div>Loading...</div>;
  }

  const addToCart = () => {
    if (product.sizes.length > 0 && !selectedSize) {
      alert('Please select a size');
      return;
    }
    if (product.colors.length > 0 && !selectedColor) {
      alert('Please select a color');
      return;
    }

    dispatch({
      type: 'ADD_ITEM',
      payload: {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        size: selectedSize,
        color: selectedColor,
      },
    });
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

  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      <CartSidebar />
      
      <div className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="relative aspect-square rounded-lg overflow-hidden bg-zinc-900">
                <Image
                  src={product.images[currentImageIndex]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                />
                
                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </>
                )}
              </div>
              
              {product.images.length > 1 && (
                <div className="flex gap-4 mt-4">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`relative w-20 h-20 rounded-md overflow-hidden ${
                        currentImageIndex === index ? 'ring-2 ring-white' : ''
                      }`}
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

            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {product.name}
                </h1>
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-3xl font-bold text-white">
                    ${product.price}
                  </span>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span className="text-gray-400 ml-2">(4.8)</span>
                  </div>
                </div>
                <p className="text-gray-300 text-lg leading-relaxed">
                  {product.description}
                </p>
              </div>

              {product.colors.length > 0 && (
                <div>
                  <h3 className="text-white font-semibold mb-3">Color</h3>
                  <div className="flex gap-3">
                    {product.colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-4 py-2 border transition-colors ${
                          selectedColor === color
                            ? 'bg-white text-black border-white'
                            : 'text-white border-white/30 hover:border-white'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {product.sizes.length > 0 && (
                <div>
                  <h3 className="text-white font-semibold mb-3">Size</h3>
                  <div className="flex gap-3 flex-wrap">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-2 border transition-colors ${
                          selectedSize === size
                            ? 'bg-white text-black border-white'
                            : 'text-white border-white/30 hover:border-white'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={addToCart}
                className="w-full bg-white text-black py-4 text-lg font-semibold hover:bg-gray-200 transition-colors duration-300"
              >
                ADD TO CART
              </button>

              <div className="border-t border-white/10 pt-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-white font-semibold mb-2">Features</h4>
                    <ul className="text-gray-300 space-y-1">
                      <li>• Premium quality materials</li>
                      <li>• Comfortable fit</li>
                      <li>• Durable construction</li>
                      <li>• Machine washable</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-2">Care Instructions</h4>
                    <p className="text-gray-300">
                      Machine wash cold, tumble dry low, do not bleach.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}