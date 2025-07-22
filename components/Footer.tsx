import React from 'react';
import Link from 'next/link';
import { Instagram, Twitter, Facebook, Mail } from 'lucide-react';
import NewsletterForm from './NewsletterForm';

export default function Footer() {
  return (
    <footer className="bg-black border-t border-white/10 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <h3 className="text-2xl font-bold text-white mb-4">HUNDOJA</h3>
            <p className="text-gray-400 mb-6 max-w-md">
              Premium streetwear brand dedicated to quality, style, and authentic urban culture. 
              Every piece tells a story of craftsmanship and design excellence.
            </p>
            
            {/* Newsletter Form */}
            <div className="mb-6 max-w-md">
              <h4 className="text-white font-semibold mb-3">Stay in the Loop</h4>
              <NewsletterForm variant="footer" />
            </div>

            <div className="flex space-x-4">
              <a href="#" className="text-white hover:text-gray-300 transition-colors">
                <Instagram size={24} />
              </a>
              <a href="#" className="text-white hover:text-gray-300 transition-colors">
                <Twitter size={24} />
              </a>
              <a href="#" className="text-white hover:text-gray-300 transition-colors">
                <Facebook size={24} />
              </a>
              <a href="#" className="text-white hover:text-gray-300 transition-colors">
                <Mail size={24} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">SHOP</h4>
            <ul className="space-y-2">
              <li><Link href="/products" className="text-gray-400 hover:text-white transition-colors">All Products</Link></li>
              <li><Link href="/products?category=hoodies" className="text-gray-400 hover:text-white transition-colors">Hoodies</Link></li>
              <li><Link href="/products?category=t-shirts" className="text-gray-400 hover:text-white transition-colors">T-Shirts</Link></li>
              <li><Link href="/products?category=jackets" className="text-gray-400 hover:text-white transition-colors">Jackets</Link></li>
              <li><Link href="/products?category=pants" className="text-gray-400 hover:text-white transition-colors">Pants</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">SUPPORT</h4>
            <ul className="space-y-2">
              <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link href="/size-guide" className="text-gray-400 hover:text-white transition-colors">Size Guide</Link></li>
              <li><Link href="/shipping" className="text-gray-400 hover:text-white transition-colors">Shipping Info</Link></li>
              <li><Link href="/returns" className="text-gray-400 hover:text-white transition-colors">Returns</Link></li>
              <li><Link href="/faq" className="text-gray-400 hover:text-white transition-colors">FAQ</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              © {new Date().getFullYear()} Hundoja. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors text-sm">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white transition-colors text-sm">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}