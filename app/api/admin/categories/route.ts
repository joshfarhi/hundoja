
import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// GET all categories
export async function GET() {
  const { data, error } = await supabase
    .from('categories')
    .select('*, products(id)');
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// POST a new category
export async function POST(request: Request) {
  const categoryData = await request.json();
  
  const { data, error } = await supabase
    .from('categories')
    .insert([categoryData])
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data[0]);
}

// PUT (update) a category
export async function PUT(request: Request) {
  const { id, ...categoryData } = await request.json();
  
  const { data, error } = await supabase
    .from('categories')
    .update(categoryData)
    .eq('id', id)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data[0]);
}

// DELETE a category
export async function DELETE(request: Request) {
  const { id } = await request.json();

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ message: 'Category deleted successfully' });
} 