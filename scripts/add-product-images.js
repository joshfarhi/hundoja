// Script to add product images to the database
// Run with: node scripts/add-product-images.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// You'll need to set these environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please set:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Simple slug generator
function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

// Product data with images from the directories (exactly what was requested)
const productImages = [
  {
    name: 'Hundoja World Is Yours Tee',
    sku: 'WORLD-IS-YOURS-TEE',
    price: 60.0,
    stock_quantity: 40,
    category_name: 'T-Shirts',
    images: [
      '/Product Images/World-Is-Yours/20250910-808A1066_(2).jpg',
      '/Product Images/World-Is-Yours/20250910-808A1064_(2).jpg',
      '/Product Images/World-Is-Yours/20250910-808A1069_(2).jpg',
      '/Product Images/World-Is-Yours/20250910-808A1070_(2).jpg',
      '/Product Images/World-Is-Yours/20250910-808A1072_(2).jpg',
      '/Product Images/World-Is-Yours/20250910-808A1073_(2).jpg'
    ],
    description:
      '*100% Organic Cotton\n*Black/Crimson Red\n*Screen print (side seam/back)\n*Oversized fit\n*10 oz\n\n$60 + $9.00 shipping',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Black', 'Crimson Red'],
    is_featured: true,
    is_active: true
  },
  {
    name: 'Hundoja Logo Tee',
    sku: 'LOGO-TEE',
    price: 50.0,
    stock_quantity: 60,
    category_name: 'T-Shirts',
    images: [
      '/Product Images/Logo-Tee/20250910-808A1060_(3).jpg',
      '/Product Images/Logo-Tee/20250910-808A1061_(3).jpg'
    ],
    description:
      '*100% Organic Cotton\n*White/Red\n*Screen Printed Logo (chest)\n*True To Size/Slighly Oversized\n*7.5 oz\n\n$50 + $9.00 shipping',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['White', 'Red'],
    is_featured: true,
    is_active: true
  }
  
];

// Categories to ensure exist
const categoriesToCreate = [
  { name: 'T-Shirts', slug: 't-shirts', description: 'Comfortable cotton t-shirts' },
  { name: 'Hoodies', slug: 'hoodies', description: 'Premium hoodies and sweatshirts' }
];

async function createCategories() {
  console.log('🏷️  Creating categories...\n');

  for (const category of categoriesToCreate) {
    try {
      // Check if category exists
      const { data: existing } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', category.slug)
        .single();

      if (existing) {
        console.log(`✅ Category already exists: ${category.name}`);
        continue;
      }

      // Create category
      const { data, error } = await supabase
        .from('categories')
        .insert([{
          name: category.name,
          slug: category.slug,
          description: category.description,
          is_active: true
        }])
        .select()
        .single();

      if (error) {
        console.error(`❌ Error creating category ${category.name}:`, error);
      } else {
        console.log(`✅ Created category: ${category.name}`);
      }
    } catch (error) {
      console.error(`❌ Error with category ${category.name}:`, error);
    }
  }
}

async function addProducts() {
  console.log('\n📦 Adding products...\n');

  // Get all categories for mapping
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug');

  const categoryMap = {};
  categories?.forEach(cat => {
    categoryMap[cat.name.toLowerCase()] = cat.id;
  });

  for (const product of productImages) {
    try {
      // Check if product already exists
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('sku', product.sku)
        .single();

      if (existing) {
        console.log(`⏭️  Product already exists: ${product.name} (${product.sku})`);
        continue;
      }

      // Get category ID
      const categoryId = categoryMap[product.category_name.toLowerCase()];
      if (!categoryId) {
        console.error(`❌ Category not found for ${product.name}: ${product.category_name}`);
        continue;
      }

      // Build a unique, stable slug using name + a variant key
      const baseSlug = slugify(product.name);
      const variantKey = product.colors && product.colors.length
        ? slugify(product.colors.join(' '))
        : slugify(product.sku || '');
      const productSlug = variantKey ? `${baseSlug}-${variantKey}` : baseSlug;

      // Create product
      const { data, error } = await supabase
        .from('products')
        .insert([{
          name: product.name,
          slug: productSlug,
          description: product.description,
          sku: product.sku,
          price: product.price,
          stock_quantity: product.stock_quantity,
          category_id: categoryId,
          images: product.images,
          is_active: product.is_active,
          is_featured: product.is_featured,
          sizes: product.sizes,
          colors: product.colors
        }])
        .select()
        .single();

      if (error) {
        console.error(`❌ Error creating product ${product.name}:`, error);
      } else {
        console.log(`✅ Created product: ${product.name} (${product.sku})`);
      }
    } catch (error) {
      console.error(`❌ Error with product ${product.name}:`, error);
    }
  }
}

async function main() {
  console.log('🚀 Starting product image import...\n');

  try {
    await createCategories();
    await addProducts();

    console.log('\n🎉 Import complete!');
    console.log('\n📊 Summary:');
    console.log(`   • Categories: ${categoriesToCreate.length}`);
    console.log(`   • Products: ${productImages.length}`);
    console.log(`   • Logo-Tee products: 2`);
    console.log(`   • World-Is-Yours products: 6`);

  } catch (error) {
    console.error('❌ Import failed:', error);
  }
}

// Run the import
main();
