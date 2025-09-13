// Script to upload products directly using the admin API
// Usage: node scripts/upload-products.js

const products = [
  {
    name: 'Premium Hoodie',
    description: 'Comfortable oversized hoodie crafted from heavyweight cotton',
    sku: 'HOODIE-001',
    price: 89.99,
    stock_quantity: 25,
    category_id: 'your-category-id-here', // You'll need to get this from your database
    images: [
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&h=600&fit=crop',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=600&fit=crop'
    ],
    is_active: true,
    is_featured: true,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Black', 'Charcoal', 'Stone']
  },
  {
    name: 'Urban Cargo Pants',
    description: 'Multi-pocket cargo pants with tactical-inspired design',
    sku: 'PANTS-001',
    price: 129.99,
    stock_quantity: 15,
    category_id: 'your-category-id-here', // You'll need to get this from your database
    images: [
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=500&h=600&fit=crop',
      'https://images.unsplash.com/photo-1506629905962-dd9c58ba4dfa?w=500&h=600&fit=crop'
    ],
    is_active: true,
    is_featured: true,
    sizes: ['28', '30', '32', '34', '36'],
    colors: ['Black', 'Olive', 'Navy']
  }
];

async function uploadProducts() {
  console.log('🚀 Starting product upload...\n');

  for (const product of products) {
    try {
      console.log(`📦 Uploading: ${product.name}`);

      const response = await fetch('http://localhost:3000/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // You'll need to include authentication headers here
          // This depends on your authentication setup
        },
        body: JSON.stringify(product),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Success: ${product.name} (ID: ${result.id})`);
      } else {
        const error = await response.json();
        console.error(`❌ Failed: ${product.name} - ${error.error}`);
      }
    } catch (error) {
      console.error(`❌ Error uploading ${product.name}:`, error.message);
    }
  }

  console.log('\n🎉 Upload complete!');
}

// Uncomment to run the upload
// uploadProducts();

module.exports = { uploadProducts, products };
