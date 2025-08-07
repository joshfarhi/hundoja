import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('id, role')
      .eq('clerk_user_id', userId)
      .eq('is_active', true)
      .single();

    if (adminError || !adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Handle analytics request
    if (action === 'analytics') {
      const { data: analytics, error: analyticsError } = await supabase
        .from('newsletter_analytics')
        .select('*')
        .single();

      if (analyticsError) {
        console.error('Analytics error:', analyticsError);
        // Return default analytics if view doesn't exist
        const { count: activeCount, error: activeError } = await supabase
          .from('newsletter_subscribers')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        const { count: totalCount, error: totalError } = await supabase
          .from('newsletter_subscribers')
          .select('*', { count: 'exact', head: true });

        const { count: phoneCount, error: phoneError } = await supabase
          .from('newsletter_subscribers')
          .select('*', { count: 'exact', head: true })
          .not('phone', 'is', null);

        const { count: newCount30d, error: new30Error } = await supabase
          .from('newsletter_subscribers')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

        const { count: newCount7d, error: new7Error } = await supabase
          .from('newsletter_subscribers')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

        const { data: countryData, error: countryError } = await supabase
          .from('newsletter_subscribers')
          .select('country_code')
          .not('country_code', 'is', null);

        const uniqueCountries = new Set(countryData?.map(item => item.country_code) || []);

        return NextResponse.json({
          active_subscribers: activeCount || 0,
          unsubscribed_count: (totalCount || 0) - (activeCount || 0),
          new_subscribers_30d: newCount30d || 0,
          new_subscribers_7d: newCount7d || 0,
          subscribers_with_phone: phoneCount || 0,
          countries_count: uniqueCountries.size,
          avg_subscription_age_days: 0
        });
      }

      return NextResponse.json(analytics);
    }

    // Handle subscribers list request
    const status = searchParams.get('status');
    const country = searchParams.get('country');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build query
    let query = supabase
      .from('newsletter_subscribers')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (country && country !== 'all') {
      query = query.eq('country_code', country);
    }

    if (search) {
      query = query.or(`email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: subscribers, error, count } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 });
    }

    return NextResponse.json({
      subscribers: subscribers || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
        hasMore: (page * limit) < (count || 0)
      }
    });

  } catch (error) {
    console.error('Newsletter API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('id, role')
      .eq('clerk_user_id', userId)
      .eq('is_active', true)
      .single();

    if (adminError || !adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id, ...updates } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Subscriber ID is required' }, { status: 400 });
    }

    // Handle status change
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    if (updates.status === 'unsubscribed') {
      updateData.unsubscribed_at = new Date().toISOString();
    }

    const { data: subscriber, error } = await supabase
      .from('newsletter_subscribers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to update subscriber' }, { status: 500 });
    }

    return NextResponse.json({ subscriber });

  } catch (error) {
    console.error('Update subscriber error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('id, role')
      .eq('clerk_user_id', userId)
      .eq('is_active', true)
      .single();

    if (adminError || !adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Subscriber ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('newsletter_subscribers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to delete subscriber' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete subscriber error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}