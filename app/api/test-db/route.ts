import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Test basic connection
    const { count: contactCount, error: contactError } = await supabase
      .from('contact_requests')
      .select('*', { count: 'exact', head: true });

    // Test newsletter_subscribers table
    const { count: newsletterCount, error: newsletterError } = await supabase
      .from('newsletter_subscribers')
      .select('*', { count: 'exact', head: true });

    // Test newsletter_analytics view
    const { data: analyticsData, error: analyticsError } = await supabase
      .from('newsletter_analytics')
      .select('*')
      .single();

    // Get actual newsletter data
    const { data: newsletterData } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .limit(5);

    return NextResponse.json({
      status: 'success',
      message: 'Database connection working',
      tables: {
        contact_requests: {
          count: contactCount || 0,
          error: contactError?.message || null
        },
        newsletter_subscribers: {
          count: newsletterCount || 0,
          error: newsletterError?.message || null,
          sampleData: newsletterData || []
        },
        newsletter_analytics: {
          data: analyticsData || null,
          error: analyticsError?.message || null
        }
      }
    });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Unexpected error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 