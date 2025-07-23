
import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// GET all products
export async function GET() {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(name)');
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// POST a new product
export async function POST(request: Request) {
  const productData = await request.json();
  
  const { data, error } = await supabase
    .from('products')
    .insert([productData])
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data[0]);
}

// PUT (update) a product
export async function PUT(request: Request) {
  const { id, ...productData } = await request.json();
  
  const { data, error } = await supabase
    .from('products')
    .update(productData)
    .eq('id', id)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data[0]);
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