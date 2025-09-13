// Script to clear products from the database (with safety checks)
// Usage examples:
//   node scripts/clear-products.js --yes                 # delete ALL products (no prompt)
//   node scripts/clear-products.js --not-featured --yes  # delete only non-featured products
//   node scripts/clear-products.js --skus LOGO-TEE,WORLD-IS-YOURS-TEE --yes  # delete specific SKUs

const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please set in .env.local:');
  console.log('  NEXT_PUBLIC_SUPABASE_URL=...');
  console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY=...');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function parseArgs() {
  const args = process.argv.slice(2);
  const flags = {
    yes: args.includes('--yes'),
    featuredOnly: args.includes('--featured-only'),
    notFeatured: args.includes('--not-featured'),
    skus: null,
  };

  const skusIndex = args.findIndex((a) => a === '--skus');
  if (skusIndex >= 0 && args[skusIndex + 1]) {
    flags.skus = args[skusIndex + 1]
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  if (flags.featuredOnly && flags.notFeatured) {
    console.error('❌ Choose only one of --featured-only or --not-featured');
    process.exit(1);
  }

  return flags;
}

function getTargetQuery(flags) {
  let query = supabase.from('products').select('id, name, sku, is_featured', { count: 'exact' });
  if (flags.featuredOnly) query = query.eq('is_featured', true);
  if (flags.notFeatured) query = query.eq('is_featured', false);
  if (flags.skus && flags.skus.length) query = query.in('sku', flags.skus);
  return query;
}

async function confirm(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(/^y(es)?$/i.test(answer.trim()));
    });
  });
}

async function clearProducts() {
  const flags = parseArgs();

  console.log('🔎 Fetching target products...');
  const previewQuery = getTargetQuery(flags);
  const { data: preview, error: previewError, count } = await previewQuery.range(0, 9);
  if (previewError) {
    console.error('❌ Failed to fetch products:', previewError);
    process.exit(1);
  }

  console.log(`\n📊 Matching products: ${count || 0}`);
  if (preview && preview.length) {
    console.log('— Sample (up to 10):');
    preview.forEach((p) => console.log(`   • ${p.name} [${p.sku}]${p.is_featured ? ' ⭐' : ''}`));
  }

  if (!flags.yes) {
    const proceed = await confirm('\n⚠️  This will permanently delete the products above. Continue? (yes/no) ');
    if (!proceed) {
      console.log('✋ Aborted.');
      process.exit(0);
    }
  }

  console.log('\n🗑️  Deleting products...');
  let del = supabase.from('products').delete();
  // Supabase requires a filter for deletes; use a broad filter that matches all selected rows
  if (flags.featuredOnly) del = del.eq('is_featured', true);
  if (flags.notFeatured) del = del.eq('is_featured', false);
  if (flags.skus && flags.skus.length) del = del.in('sku', flags.skus);
  if (!flags.featuredOnly && !flags.notFeatured && (!flags.skus || flags.skus.length === 0)) {
    // delete ALL rows: apply a harmless universal filter
    del = del.neq('id', '00000000-0000-0000-0000-000000000000');
  }

  const { error: delError } = await del;
  if (delError) {
    console.error('❌ Delete failed:', delError);
    process.exit(1);
  }

  console.log('✅ Delete completed.');
}

clearProducts().catch((e) => {
  console.error('❌ Unexpected error:', e);
  process.exit(1);
});


