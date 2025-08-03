
import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// GET all products
export async function GET() {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      categories (
        id,
        name,
        slug
      )
    `);
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// POST a new product
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('POST request body:', body);
    
    // Remove joined fields that shouldn't be updated
    const { categories, created_at, updated_at, search_vector, ...cleanProductData } = body;
    
    console.log('Creating product with data:', cleanProductData);
    
    const { data, error } = await supabase
      .from('products')
      .insert([cleanProductData])
      .select(`
        *,
        categories (
          id,
          name,
          slug
        )
      `);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log('Product created successfully:', data[0]);
    return NextResponse.json(data[0]);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT (update) a product
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    console.log('PUT request body:', body);
    
    // Remove joined fields that shouldn't be updated
    const { id, categories, created_at, updated_at, search_vector, ...cleanProductData } = body;
    
    console.log('Updating product with ID:', id);
    console.log('Clean update data:', cleanProductData);
    
    const { data, error } = await supabase
      .from('products')
      .update(cleanProductData)
      .eq('id', id)
      .select(`
        *,
        categories (
          id,
          name,
          slug
        )
      `);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log('Update successful:', data[0]);
    return NextResponse.json(data[0]);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE a product
export async function DELETE(request: Request) {
  const { id } = await request.json();

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ message: 'Product deleted successfully' });
} 