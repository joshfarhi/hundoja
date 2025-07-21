import React from 'react';
import Navigation from '@/components/Navigation';
import CartSidebar from '@/components/CartSidebar';
import Footer from '@/components/Footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      <CartSidebar />
      
      <div className="pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              ABOUT HUNDOJA
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Where streetwear meets premium quality and authentic urban culture
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Our Story</h2>
              <p className="text-gray-300 mb-4">
                Founded with a passion for authentic streetwear, Hundoja represents the intersection 
                of urban culture and premium craftsmanship. We believe that clothing should be more 
                than just fabric – it should tell a story, express identity, and embody the spirit 
                of the streets.
              </p>
              <p className="text-gray-300">
                Every piece in our collection is carefully designed and crafted to meet the highest 
                standards of quality while maintaining the authentic aesthetic that defines 
                contemporary streetwear culture.
              </p>
            </div>
            <div className="aspect-square bg-zinc-900 rounded-lg"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-4">Quality First</h3>
              <p className="text-gray-400">
                Premium materials and meticulous attention to detail in every piece
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-4">Authentic Design</h3>
              <p className="text-gray-400">
                Designs rooted in street culture and contemporary urban aesthetics
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-4">Limited Drops</h3>
              <p className="text-gray-400">
                Exclusive collections that ensure uniqueness and exclusivity
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}