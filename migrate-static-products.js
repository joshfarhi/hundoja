// Script to migrate static products data to database
// Run this with: node migrate-static-products.js

const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Static products data from data/products.ts
const staticProducts = [
  {
    name: 'Shadow Oversized Hoodie',
    price: 89.99,
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
    name: 'Urban Cargo Pants',
    price: 129.99,
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
    name: 'Minimal Logo Tee',
    price: 45.99,
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
    name: 'Statement Bomber Jacket',
    price: 189.99,
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
    name: 'Tech Joggers',
    price: 79.99,
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
    name: 'Distressed Denim Jacket',
    price: 159.99,
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

async function migrateProducts() {
  console.log('🚀 Starting product migration...\n');

  try {
    // First, ensure categories exist
    console.log('1. Checking/creating categories...');
    const categories = ['Hoodies', 'Pants', 'T-Shirts', 'Jackets'];
    
    for (const categoryName of categories) {
      const slug = categoryName.toLowerCase().replace(/\s+/g, '-');
      
      // Check if category exists
      const { data: existingCategory } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', slug)
        .single();

      if (!existingCategory) {
        // Create category
        const { data: newCategory, error } = await supabase
          .from('categories')
          .insert({
            name: categoryName,
            slug: slug,
            description: `${categoryName} collection`,
            is_active: true
          })
          .select()
          .single();

        if (error) {
          console.error(`❌ Error creating category ${categoryName}:`, error);
        } else {
          console.log(`✅ Created category: ${categoryName}`);
        }
      } else {
        console.log(`✅ Category already exists: ${categoryName}`);
      }
    }

    // Get all categories for mapping
    const { data: allCategories } = await supabase
      .from('categories')
      .select('id, name, slug');

    console.log('\n2. Migrating products...');

    for (const product of staticProducts) {
      // Find category ID
      const categorySlug = product.category.toLowerCase().replace(/\s+/g, '-');
      const category = allCategories?.find(c => c.slug === categorySlug);
      
      if (!category) {
        console.error(`❌ Category not found for product ${product.name}`);
        continue;
      }

      // Generate SKU
      const sku = `${product.name.toUpperCase().replace(/\s+/g, '-')}-${Date.now()}`;

      // Check if product already exists (by name)
      const { data: existingProduct } = await supabase
        .from('products')
        .select('id')
        .eq('name', product.name)
        .single();

      if (existingProduct) {
        console.log(`⏭️  Product already exists: ${product.name}`);
        continue;
      }

      // Create product
      const { data: newProduct, error } = await supabase
        .from('products')
        .insert({
          name: product.name,
          description: product.description,
          sku: sku,
          price: product.price,
          stock_quantity: Math.floor(Math.random() * 50) + 10, // Random stock between 10-60
          category_id: category.id,
          images: product.images,
          is_active: true,
          is_featured: product.featured,
          sizes: product.sizes || [],
          colors: product.colors || []
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Error creating product ${product.name}:`, error);
      } else {
        console.log(`✅ Created product: ${product.name} (${newProduct.id})`);
      }
    }

    console.log('\n🎉 Migration completed!');
    
    // Show summary
    const { data: totalProducts } = await supabase
      .from('products')
      .select('id', { count: 'exact' });
    
    const { data: featuredProducts } = await supabase
      .from('products')
      .select('id')
      .eq('is_featured', true);

    console.log(`\n📊 Summary:`);
    console.log(`   Total products: ${totalProducts?.length || 0}`);
    console.log(`   Featured products: ${featuredProducts?.length || 0}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run the migration
migrateProducts(); 