const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFeaturedProducts() {
  try {
    console.log('🔍 Checking featured products in database...');
    
    // Check all products
    const { data: allProducts, error: allError } = await supabase
      .from('products')
      .select('id, name, is_featured, is_active')
      .eq('is_active', true);
    
    if (allError) {
      console.error('❌ Error fetching all products:', allError);
      return;
    }
    
    console.log(`📊 Total active products: ${allProducts?.length || 0}`);
    
    // Check featured products
    const { data: featuredProducts, error: featuredError } = await supabase
      .from('products')
      .select('id, name, is_featured, is_active')
      .eq('is_active', true)
      .eq('is_featured', true);
    
    if (featuredError) {
      console.error('❌ Error fetching featured products:', featuredError);
      return;
    }
    
    console.log(`⭐ Featured products: ${featuredProducts?.length || 0}`);
    
    if (featuredProducts && featuredProducts.length > 0) {
      console.log('📋 Featured products list:');
      featuredProducts.forEach(product => {
        console.log(`   - ${product.name} (ID: ${product.id})`);
      });
    } else {
      console.log('⚠️  No featured products found!');
      console.log('');
      console.log('💡 To fix this, you can:');
      console.log('   1. Go to Admin → Products');
      console.log('   2. Edit a product');
      console.log('   3. Check the "Featured" checkbox');
      console.log('   4. Save the product');
    }
    
    // Test the API endpoint
    console.log('');
    console.log('🌐 Testing API endpoint...');
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL.replace('.supabase.co', '.supabase.co')}/rest/v1/products?is_active=eq.true&is_featured=eq.true&select=id,name,is_featured`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    if (response.ok) {
      const apiData = await response.json();
      console.log(`✅ API test successful: ${apiData.length} featured products found`);
    } else {
      console.log('❌ API test failed:', response.status, response.statusText);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkFeaturedProducts(); 