'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useUser } from '@clerk/nextjs';
import { supabase } from '@/lib/supabase';

// Types
export interface Product {
  id: string;
  name: string;
  price: number;
  cost: number;
  stock: number;
  category: string;
  status: 'active' | 'low_stock' | 'out_of_stock' | 'draft' | 'discontinued';
  featured: boolean;
  image: string;
  sku: string;
  sold: number;
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
}

export interface Order {
  id: string;
  customer: {
    name: string;
    email: string;
    avatar?: string;
  };
  products: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  shippingAddress: string;
  orderDate: string;
  deliveryDate?: string;
  isDemo?: boolean;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'new' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'normal' | 'urgent';
  category: 'general' | 'product_inquiry' | 'order_support' | 'returns' | 'business' | 'feedback' | 'technical';
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  respondedAt?: string;
  tags?: string[];
  isDemo?: boolean;
}

// Database contact type (matches the contact_requests table structure)
interface DatabaseContact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'new' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'normal' | 'urgent';
  category: 'general' | 'product_inquiry' | 'order_support' | 'returns' | 'business' | 'feedback' | 'technical';
  tags?: string[];
  assigned_to?: string;
  responded_at?: string;
  response?: string;
  created_at: string;
  updated_at: string;
}

interface AdminState {
  products: Product[];
  orders: Order[];
  contacts: Contact[];
  loading: boolean;
  error: string | null;
  demoItemsHidden: boolean;
}

type AdminAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PRODUCTS'; payload: Product[] }
  | { type: 'SET_ORDERS'; payload: Order[] }
  | { type: 'SET_CONTACTS'; payload: Contact[] }
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: Product }
  | { type: 'DELETE_PRODUCT'; payload: string }
  | { type: 'ADD_ORDER'; payload: Order }
  | { type: 'UPDATE_ORDER'; payload: Order }
  | { type: 'DELETE_ORDER'; payload: string }
  | { type: 'ADD_CONTACT'; payload: Contact }
  | { type: 'UPDATE_CONTACT'; payload: Contact }
  | { type: 'DELETE_CONTACT'; payload: string }
  | { type: 'REMOVE_DEMO_ITEMS' }
  | { type: 'SET_DEMO_ITEMS_HIDDEN'; payload: boolean };

// Demo data
const demoProducts: Product[] = [
  {
    id: 'demo-1',
    name: 'Shadow Oversized Hoodie',
    price: 89.99,
    cost: 45.00,
    stock: 15,
    category: 'Hoodies',
    status: 'active',
    featured: true,
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&h=600&fit=crop',
    sku: 'SOH-001',
    sold: 124,
    createdAt: '2024-01-10',
    updatedAt: '2024-01-15',
    isDemo: true,
  },
  {
    id: 'demo-2',
    name: 'Urban Cargo Pants',
    price: 129.99,
    cost: 65.00,
    stock: 8,
    category: 'Pants',
    status: 'active',
    featured: true,
    image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=500&h=600&fit=crop',
    sku: 'UCP-002',
    sold: 89,
    createdAt: '2024-01-08',
    updatedAt: '2024-01-14',
    isDemo: true,
  },
  {
    id: 'demo-3',
    name: 'Minimal Logo Tee',
    price: 45.99,
    cost: 18.00,
    stock: 32,
    category: 'T-Shirts',
    status: 'active',
    featured: true,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=600&fit=crop',
    sku: 'MLT-003',
    sold: 256,
    createdAt: '2024-01-05',
    updatedAt: '2024-01-12',
    isDemo: true,
  },
];

const demoOrders: Order[] = [
  {
    id: 'demo-ord-001',
    customer: {
      name: 'John Doe',
      email: 'john.doe@example.com',
    },
    products: [
      { name: 'Shadow Oversized Hoodie', quantity: 1, price: 89.99 }
    ],
    total: 89.99,
    status: 'completed',
    paymentStatus: 'paid',
    shippingAddress: '123 Main St, New York, NY 10001',
    orderDate: '2024-01-15T10:30:00Z',
    deliveryDate: '2024-01-18T14:00:00Z',
    isDemo: true,
  },
  {
    id: 'demo-ord-002',
    customer: {
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
    },
    products: [
      { name: 'Urban Cargo Pants', quantity: 1, price: 129.99 },
      { name: 'Minimal Logo Tee', quantity: 2, price: 45.99 }
    ],
    total: 221.97,
    status: 'processing',
    paymentStatus: 'paid',
    shippingAddress: '456 Oak Ave, Los Angeles, CA 90001',
    orderDate: '2024-01-15T15:45:00Z',
    isDemo: true,
  },
];

const demoContacts: Contact[] = [
  {
    id: 'demo-contact-001',
    name: 'Sarah Wilson',
    email: 'sarah.wilson@example.com',
    phone: '+1 (555) 123-4567',
    subject: 'Question about sizing',
    message: 'Hi, I was wondering about the sizing for the oversized hoodies. Do they run large or true to size?',
    status: 'new',
    priority: 'normal',
    category: 'product_inquiry',
    createdAt: '2024-01-16T14:30:00Z',
    updatedAt: '2024-01-16T14:30:00Z',
    submittedAt: '2024-01-16T14:30:00Z',
    tags: ['sizing', 'hoodie'],
    isDemo: true,
  },
  {
    id: 'demo-contact-002',
    name: 'Mike Johnson',
    email: 'mike.johnson@example.com',
    subject: 'Order issue',
    message: 'My order hasn\'t arrived yet and it\'s been 2 weeks. Can you help me track it?',
    status: 'in_progress',
    priority: 'high',
    category: 'order_support',
    createdAt: '2024-01-14T09:15:00Z',
    updatedAt: '2024-01-15T16:20:00Z',
    submittedAt: '2024-01-14T09:15:00Z',
    respondedAt: '2024-01-15T11:30:00Z',
    tags: ['delivery', 'tracking', 'urgent'],
    isDemo: true,
  },
];

// Initial state will be loaded from database in useEffect
const getInitialDemoItemsHidden = (): boolean => {
  // Start with false, will be updated from database
  return false;
};

const createInitialState = (): AdminState => {
  const demoItemsHidden = getInitialDemoItemsHidden();
  
  return {
    products: demoItemsHidden ? [] : demoProducts,
    orders: demoItemsHidden ? [] : demoOrders,
    contacts: demoItemsHidden ? [] : demoContacts,
    loading: false,
    error: null,
    demoItemsHidden,
  };
};

const initialState: AdminState = createInitialState();

function adminReducer(state: AdminState, action: AdminAction): AdminState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload };
    case 'SET_ORDERS':
      return { ...state, orders: action.payload };
    case 'SET_CONTACTS':
      return { ...state, contacts: action.payload };
    case 'ADD_PRODUCT':
      return { ...state, products: [...state.products, action.payload] };
    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map(p => p.id === action.payload.id ? action.payload : p)
      };
    case 'DELETE_PRODUCT':
      return {
        ...state,
        products: state.products.filter(p => p.id !== action.payload)
      };
    case 'ADD_ORDER':
      return { ...state, orders: [action.payload, ...state.orders] };
    case 'UPDATE_ORDER':
      return {
        ...state,
        orders: state.orders.map(o => o.id === action.payload.id ? action.payload : o)
      };
    case 'DELETE_ORDER':
      return {
        ...state,
        orders: state.orders.filter(o => o.id !== action.payload)
      };
    case 'ADD_CONTACT':
      return { ...state, contacts: [action.payload, ...state.contacts] };
    case 'UPDATE_CONTACT':
      return {
        ...state,
        contacts: state.contacts.map(c => c.id === action.payload.id ? action.payload : c)
      };
    case 'DELETE_CONTACT':
      return {
        ...state,
        contacts: state.contacts.filter(c => c.id !== action.payload)
      };
    case 'REMOVE_DEMO_ITEMS':
      return {
        ...state,
        products: state.products.filter(p => !p.isDemo),
        orders: state.orders.filter(o => !o.isDemo),
        contacts: state.contacts.filter(c => !c.isDemo),
        demoItemsHidden: true,
      };
    case 'SET_DEMO_ITEMS_HIDDEN':
      return {
        ...state,
        demoItemsHidden: action.payload,
      };
    default:
      return state;
  }
}

interface AdminContextType {
  state: AdminState;
  dispatch: React.Dispatch<AdminAction>;
  removeDemoItems: () => Promise<void>;
  refreshData: () => Promise<void>;
  resetDemoItemsPreference: () => Promise<void>;
  loadUserPreferences: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(adminReducer, initialState);
  const { user } = useUser();

  // Real-time subscriptions
  useEffect(() => {
    const setupRealtimeSubscriptions = () => {
      // Products subscription
      const productsSubscription = supabase
        .channel('products')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
          // Handle real-time updates
          switch (payload.eventType) {
            case 'INSERT':
              dispatch({ type: 'ADD_PRODUCT', payload: payload.new as Product });
              break;
            case 'UPDATE':
              dispatch({ type: 'UPDATE_PRODUCT', payload: payload.new as Product });
              break;
            case 'DELETE':
              dispatch({ type: 'DELETE_PRODUCT', payload: payload.old.id });
              break;
          }
        })
        .subscribe();

      // Orders subscription
      const ordersSubscription = supabase
        .channel('orders')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
          switch (payload.eventType) {
            case 'INSERT':
              dispatch({ type: 'ADD_ORDER', payload: payload.new as Order });
              break;
            case 'UPDATE':
              dispatch({ type: 'UPDATE_ORDER', payload: payload.new as Order });
              break;
            case 'DELETE':
              dispatch({ type: 'DELETE_ORDER', payload: payload.old.id });
              break;
          }
        })
        .subscribe();

      // Contacts subscription
      const contactsSubscription = supabase
        .channel('contacts')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'contact_requests' }, (payload) => {
          switch (payload.eventType) {
            case 'INSERT':
              dispatch({ type: 'ADD_CONTACT', payload: payload.new as Contact });
              break;
            case 'UPDATE':
              dispatch({ type: 'UPDATE_CONTACT', payload: payload.new as Contact });
              break;
            case 'DELETE':
              dispatch({ type: 'DELETE_CONTACT', payload: payload.old.id });
              break;
          }
        })
        .subscribe();

      return () => {
        productsSubscription.unsubscribe();
        ordersSubscription.unsubscribe();
        contactsSubscription.unsubscribe();
      };
    };

    const unsubscribe = setupRealtimeSubscriptions();
    return unsubscribe;
  }, []);

  const removeDemoItems = async () => {
    dispatch({ type: 'REMOVE_DEMO_ITEMS' });
    
    // Persist the preference in database
    try {
      const response = await fetch('/api/admin/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ demo_items_hidden: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to save preference');
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to save demo items preference:', error);
      }
      // Fallback to localStorage for offline support
      try {
        localStorage.setItem('hundoja_demo_items_hidden', 'true');
      } catch (localStorageError) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Failed to save to localStorage:', localStorageError);
        }
      }
    }
  };

  const resetDemoItemsPreference = async () => {
    try {
      // Reset preference in database
      const response = await fetch('/api/admin/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ demo_items_hidden: false }),
      });

      if (!response.ok) {
        throw new Error('Failed to reset preference');
      }

      dispatch({ type: 'SET_DEMO_ITEMS_HIDDEN', payload: false });
      // Re-add demo items
      dispatch({ type: 'SET_PRODUCTS', payload: [...state.products.filter(p => !p.isDemo), ...demoProducts] });
      dispatch({ type: 'SET_ORDERS', payload: [...state.orders.filter(o => !o.isDemo), ...demoOrders] });
      dispatch({ type: 'SET_CONTACTS', payload: [...state.contacts.filter(c => !c.isDemo), ...demoContacts] });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to reset demo items preference:', error);
      }
      // Fallback to localStorage
      try {
        localStorage.removeItem('hundoja_demo_items_hidden');
      } catch (localStorageError) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Failed to remove from localStorage:', localStorageError);
        }
      }
    }
  };

  const loadUserPreferences = async () => {
    try {
      const response = await fetch('/api/admin/preferences');
      
      if (!response.ok) {
        throw new Error('Failed to load preferences');
      }

      const { preferences } = await response.json();
      
      dispatch({ type: 'SET_DEMO_ITEMS_HIDDEN', payload: preferences.demo_items_hidden });
      
      // If demo items should be hidden, remove them from state
      if (preferences.demo_items_hidden) {
        dispatch({ type: 'REMOVE_DEMO_ITEMS' });
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to load user preferences:', error);
      }
      // Fallback to localStorage
      try {
        const stored = localStorage.getItem('hundoja_demo_items_hidden');
        if (stored === 'true') {
          dispatch({ type: 'SET_DEMO_ITEMS_HIDDEN', payload: true });
          dispatch({ type: 'REMOVE_DEMO_ITEMS' });
        }
      } catch (localStorageError) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Failed to load from localStorage:', localStorageError);
        }
      }
    }
  };

  const refreshData = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // Fetch real data from Supabase
      const [productsResponse, ordersResponse, contactsResponse] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('orders').select('*'),
        fetch('/api/admin/contacts').then(res => res.json()).catch(() => ({ contacts: [] }))
      ]);

      if (productsResponse.data) {
        dispatch({ type: 'SET_PRODUCTS', payload: [...state.products.filter(p => p.isDemo), ...productsResponse.data] });
      }
      
      if (ordersResponse.data) {
        dispatch({ type: 'SET_ORDERS', payload: [...state.orders.filter(o => o.isDemo), ...ordersResponse.data] });
      }
      
      if (contactsResponse.contacts) {
        // Transform database contact format to match our interface
        const transformedContacts = contactsResponse.contacts.map((contact: DatabaseContact) => ({
          id: contact.id,
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          subject: contact.subject,
          message: contact.message,
          status: contact.status,
          priority: contact.priority,
          category: contact.category,
          createdAt: contact.created_at,
          updatedAt: contact.updated_at,
          submittedAt: contact.created_at, // Use created_at as submitted_at
          respondedAt: contact.responded_at,
          tags: contact.tags || [],
          isDemo: false
        }));
        dispatch({ type: 'SET_CONTACTS', payload: [...state.contacts.filter(c => c.isDemo), ...transformedContacts] });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to refresh data' });
      if (process.env.NODE_ENV === 'development') {
        console.error('Error refreshing admin data:', error);
      }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Load user preferences and data when user is available
  useEffect(() => {
    if (user?.id) {
      loadUserPreferences().then(() => {
        refreshData();
      });
    }
  }, [user?.id]); // Run when user ID changes

  return (
    <AdminContext.Provider value={{ 
      state, 
      dispatch, 
      removeDemoItems, 
      refreshData, 
      resetDemoItemsPreference, 
      loadUserPreferences 
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}