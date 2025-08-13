
import { checkAdminAccess } from '@/lib/adminAuth';
import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// GET all categories
export async function GET() {
  try {
    const { isAdmin, error } = await checkAdminAccess();
    
    if (!isAdmin) {
      return NextResponse.json({ error: error || 'Admin access required' }, { status: 403 });
    }

    const { data, error: dbError } = await supabase
      .from('categories')
      .select('*, products(id)');
    
    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error('Categories GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST a new category
export async function POST(request: Request) {
  try {
    const { isAdmin, error } = await checkAdminAccess();
    
    if (!isAdmin) {
      return NextResponse.json({ error: error || 'Admin access required' }, { status: 403 });
    }

    const categoryData = await request.json();
    
    const { data, error: dbError } = await supabase
      .from('categories')
      .insert([categoryData])
      .select();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }
    return NextResponse.json(data[0]);
  } catch (error) {
    console.error('Categories POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT (update) a category
export async function PUT(request: Request) {
  try {
    const { isAdmin, error } = await checkAdminAccess();
    
    if (!isAdmin) {
      return NextResponse.json({ error: error || 'Admin access required' }, { status: 403 });
    }

    const { id, ...categoryData } = await request.json();
    
    const { data, error: dbError } = await supabase
      .from('categories')
      .update(categoryData)
      .eq('id', id)
      .select();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }
    return NextResponse.json(data[0]);
  } catch (error) {
    console.error('Categories PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE a category
export async function DELETE(request: Request) {
  try {
    const { isAdmin, error } = await checkAdminAccess();
    
    if (!isAdmin) {
      return NextResponse.json({ error: error || 'Admin access required' }, { status: 403 });
    }

    const { id } = await request.json();

    const { error: dbError } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Categories DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 