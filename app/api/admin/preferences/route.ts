import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { checkAdminAccess } from '@/lib/adminAuth';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { isAdmin, error } = await checkAdminAccess();
    
    if (!isAdmin) {
      return NextResponse.json({ error: error || 'Admin access required' }, { status: 403 });
    }

    // Note: We still need the userId for the RPC function
    const { userId } = await auth();

    // Get user preferences from database
    const { data: preferences, error } = await supabase
      .rpc('get_or_create_admin_preferences', { user_clerk_id: userId });

    if (error) {
      console.error('Error fetching admin preferences:', error);
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
    }

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Error in GET /api/admin/preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { isAdmin, error } = await checkAdminAccess();
    
    if (!isAdmin) {
      return NextResponse.json({ error: error || 'Admin access required' }, { status: 403 });
    }

    // Note: We still need the userId for the RPC function
    const { userId } = await auth();

    const body = await request.json();
    const { demo_items_hidden } = body;

    if (typeof demo_items_hidden !== 'boolean') {
      return NextResponse.json({ error: 'Invalid demo_items_hidden value' }, { status: 400 });
    }

    // Update preference in database
    const { data: success, error } = await supabase
      .rpc('update_demo_items_preference', {
        user_clerk_id: userId,
        hide_demo_items: demo_items_hidden
      });

    if (error || !success) {
      console.error('Error updating demo items preference:', error);
      return NextResponse.json({ error: 'Failed to update preference' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/admin/preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { isAdmin, error } = await checkAdminAccess();
    
    if (!isAdmin) {
      return NextResponse.json({ error: error || 'Admin access required' }, { status: 403 });
    }

    // Note: We still need the userId for the database operation
    const { userId } = await auth();
    const body = await request.json();
    const updates = body;

    // Update preferences in database
    const { error } = await supabase
      .from('admin_user_preferences')
      .upsert({
        clerk_user_id: userId,
        ...updates,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'clerk_user_id'
      });

    if (error) {
      console.error('Error updating admin preferences:', error);
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PUT /api/admin/preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}