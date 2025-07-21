'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Plus, Minus } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

export default function CartSidebar() {
  const { state, dispatch } = useCart();

  const updateQuantity = (id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };

  const removeItem = (id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  };

  if (!state.isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-50" 
        onClick={() => dispatch({ type: 'TOGGLE_CART' })}
      />
      
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-black border-l border-white/10 z-50 overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Shopping Cart</h2>
            <button
              onClick={() => dispatch({ type: 'TOGGLE_CART' })}
              className="text-white hover:text-gray-300"
            >
              <X size={24} />
            </button>
          </div>

          {state.items.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <p>Your cart is empty</p>
              <Link
                href="/products"
                className="text-white underline hover:text-gray-300 mt-4 block"
                onClick={() => dispatch({ type: 'TOGGLE_CART' })}
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {state.items.map((item) => (
                  <div key={`${item.id}-${item.size}-${item.color}`} className="flex gap-4 border-b border-white/10 pb-4">
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={80}
                      height={80}
                      className="rounded-md object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="text-white font-medium">{item.name}</h3>
                      {item.size && (
                        <p className="text-gray-400 text-sm">Size: {item.size}</p>
                      )}
                      {item.color && (
                        <p className="text-gray-400 text-sm">Color: {item.color}</p>
                      )}
                      <p className="text-white font-bold">${item.price}</p>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="text-white hover:text-gray-300"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="text-white px-3 py-1 bg-white/10 rounded">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="text-white hover:text-gray-300"
                        >
                          <Plus size={16} />
                        </button>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-400 hover:text-red-300 ml-4"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-white/10">
                <div className="flex justify-between text-lg font-bold text-white mb-4">
                  <span>Total: ${state.total.toFixed(2)}</span>
                </div>
                <Link
                  href="/checkout"
                  className="w-full bg-white text-black py-3 px-6 rounded-md font-medium hover:bg-gray-200 transition-colors block text-center"
                  onClick={() => dispatch({ type: 'TOGGLE_CART' })}
                >
                  Checkout
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}