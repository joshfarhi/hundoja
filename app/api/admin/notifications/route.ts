import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAccess } from '@/lib/adminAuth';
import { supabase } from '@/lib/supabase';

// GET - Fetch all notifications
export async function GET() {
  try {
    const { isAdmin, error } = await checkAdminAccess();
    
    if (!isAdmin) {
      return NextResponse.json({ error: error || 'Admin access required' }, { status: 403 });
    }

    // Get notifications with relative time using the function we created
    const { data: notifications, error } = await supabase
      .rpc('get_notifications_with_relative_time');

    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Error in notifications GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new notification
export async function POST(request: NextRequest) {
  try {
    const { isAdmin, error } = await checkAdminAccess();
    
    if (!isAdmin) {
      return NextResponse.json({ error: error || 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { type, title, message, icon_name = 'Bell', icon_color = 'text-blue-400', metadata = {} } = body;

    if (!type || !title || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        type,
        title,
        message,
        icon_name,
        icon_color,
        metadata
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
    }

    return NextResponse.json({ notification });
  } catch (error) {
    console.error('Error in notifications POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Mark notification as read
export async function PUT(request: NextRequest) {
  try {
    const { isAdmin, error } = await checkAdminAccess();
    
    if (!isAdmin) {
      return NextResponse.json({ error: error || 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { id, is_read } = body;

    if (!id) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
    }

    const { data: notification, error } = await supabase
      .from('notifications')
      .update({ is_read })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating notification:', error);
      return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
    }

    return NextResponse.json({ notification });
  } catch (error) {
    console.error('Error in notifications PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a notification or clear all
export async function DELETE(request: NextRequest) {
  try {
    const { isAdmin, error } = await checkAdminAccess();
    
    if (!isAdmin) {
      return NextResponse.json({ error: error || 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const clearAll = searchParams.get('clearAll') === 'true';

    let error;

    if (clearAll) {
      // Mark all notifications as cleared instead of deleting them
      const { error: clearError } = await supabase
        .from('notifications')
        .update({ is_cleared: true })
        .eq('is_cleared', false);

      error = clearError;
    } else if (id) {
      // Mark specific notification as cleared
      const { error: deleteError } = await supabase
        .from('notifications')
        .update({ is_cleared: true })
        .eq('id', id);

      error = deleteError;
    } else {
      return NextResponse.json({ error: 'Either id or clearAll parameter required' }, { status: 400 });
    }

    if (error) {
      console.error('Error deleting notification:', error);
      return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in notifications DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 