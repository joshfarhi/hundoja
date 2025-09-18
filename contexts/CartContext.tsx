'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  size?: string;
  color?: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  total: number;
  shipping: number;
  subtotal: number;
  isOpen: boolean;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'quantity'> }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'UPDATE_SHIPPING'; payload: number }
  | { type: 'CLEAR_CART' }
  | { type: 'TOGGLE_CART' };

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item =>
        item.id === action.payload.id &&
        item.size === action.payload.size &&
        item.color === action.payload.color
      );

      let newItems;
      if (existingItem) {
        newItems = state.items.map(item =>
          item.id === existingItem.id &&
          item.size === existingItem.size &&
          item.color === existingItem.color
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        newItems = [...state.items, { ...action.payload, quantity: 1 }];
      }

      const newSubtotal = newItems.reduce((total, item) => total + (item.price * item.quantity), 0);
      const newTotal = newSubtotal + state.shipping;
      return { ...state, items: newItems, subtotal: newSubtotal, total: newTotal };
    }

    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.id !== action.payload);
      const newSubtotal = newItems.reduce((total, item) => total + (item.price * item.quantity), 0);
      const newTotal = newSubtotal + state.shipping;
      return { ...state, items: newItems, subtotal: newSubtotal, total: newTotal };
    }

    case 'UPDATE_QUANTITY': {
      const newItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, quantity: action.payload.quantity }
          : item
      ).filter(item => item.quantity > 0);

      const newSubtotal = newItems.reduce((total, item) => total + (item.price * item.quantity), 0);
      const newTotal = newSubtotal + state.shipping;
      return { ...state, items: newItems, subtotal: newSubtotal, total: newTotal };
    }

    case 'UPDATE_SHIPPING': {
      const newTotal = state.subtotal + action.payload;
      return { ...state, shipping: action.payload, total: newTotal };
    }

    case 'CLEAR_CART':
      return { ...state, items: [], subtotal: 0, shipping: 0, total: 0 };

    case 'TOGGLE_CART':
      return { ...state, isOpen: !state.isOpen };

    default:
      return state;
  }
};

const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
} | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    subtotal: 0,
    shipping: 0,
    total: 0,
    isOpen: false,
  });

  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}