import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET unique product attributes (sizes and colors)
export async function GET() {
  try {
    // Get unique sizes
    const { data: sizesData, error: sizesError } = await supabase
      .from('products')
      .select('sizes')
      .not('sizes', 'is', null);

    // Get unique colors
    const { data: colorsData, error: colorsError } = await supabase
      .from('products')
      .select('colors')
      .not('colors', 'is', null);

    if (sizesError || colorsError) {
      console.error('Error fetching attributes:', sizesError || colorsError);
      return NextResponse.json({ error: 'Failed to fetch attributes' }, { status: 500 });
    }

    // Extract unique sizes
    const uniqueSizes = new Set<string>();
    sizesData?.forEach(product => {
      if (product.sizes && Array.isArray(product.sizes)) {
        product.sizes.forEach(size => uniqueSizes.add(size));
      }
    });

    // Extract unique colors
    const uniqueColors = new Set<string>();
    colorsData?.forEach(product => {
      if (product.colors && Array.isArray(product.colors)) {
        product.colors.forEach(color => uniqueColors.add(color));
      }
    });

    return NextResponse.json({
      sizes: Array.from(uniqueSizes).sort(),
      colors: Array.from(uniqueColors).sort()
    });

  } catch (error) {
    console.error('Error in product attributes API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 