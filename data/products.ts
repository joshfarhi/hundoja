export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  images: string[];
  description: string;
  category: string;
  sizes: string[];
  colors: string[];
  featured: boolean;
}

export const products: Product[] = [
  {
    id: '1',
    name: 'Shadow Oversized Hoodie',
    price: 89.99,
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&h=600&fit=crop',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=600&fit=crop'
    ],
    description: 'Premium oversized hoodie crafted from heavyweight cotton. Features dropped shoulders and an urban-inspired silhouette.',
    category: 'Hoodies',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Black', 'Charcoal', 'Stone'],
    featured: true
  },
  {
    id: '2',
    name: 'Urban Cargo Pants',
    price: 129.99,
    image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=500&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=500&h=600&fit=crop',
      'https://images.unsplash.com/photo-1506629905962-dd9c58ba4dfa?w=500&h=600&fit=crop'
    ],
    description: 'Multi-pocket cargo pants with tactical-inspired design. Built for both style and functionality.',
    category: 'Pants',
    sizes: ['28', '30', '32', '34', '36', '38'],
    colors: ['Black', 'Olive', 'Navy'],
    featured: true
  },
  {
    id: '3',
    name: 'Minimal Logo Tee',
    price: 45.99,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&h=600&fit=crop',
      'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=500&h=600&fit=crop'
    ],
    description: 'Clean, minimal t-shirt with subtle branding. Made from premium organic cotton.',
    category: 'T-Shirts',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Black', 'White', 'Gray'],
    featured: true
  },
  {
    id: '4',
    name: 'Statement Bomber Jacket',
    price: 189.99,
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&h=600&fit=crop',
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&h=600&fit=crop'
    ],
    description: 'Bold bomber jacket with unique design elements. Perfect for making a statement.',
    category: 'Jackets',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Black', 'Forest Green'],
    featured: true
  },
  {
    id: '5',
    name: 'Tech Joggers',
    price: 79.99,
    image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500&h=600&fit=crop'
    ],
    description: 'Performance joggers with moisture-wicking technology. Comfort meets style.',
    category: 'Pants',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Black', 'Navy', 'Charcoal'],
    featured: false
  },
  {
    id: '6',
    name: 'Distressed Denim Jacket',
    price: 159.99,
    image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=500&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=500&h=600&fit=crop'
    ],
    description: 'Vintage-inspired denim jacket with authentic distressing details.',
    category: 'Jackets',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Light Wash', 'Dark Wash'],
    featured: false
  }
];