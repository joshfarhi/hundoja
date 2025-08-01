import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Test basic connection
    const { count, error: testError } = await supabase
      .from('contact_requests')
      .select('*', { count: 'exact', head: true });

    if (testError) {
      return NextResponse.json({
        status: 'error',
        message: 'Database connection failed',
        error: testError.message,
        details: testError
      }, { status: 500 });
    }

    // Test table structure
    let tableInfo = null;
    try {
      const { data } = await supabase
        .rpc('get_table_info', { table_name: 'contact_requests' });
      tableInfo = data;
    } catch {
      // RPC function not available
      tableInfo = null;
    }

    return NextResponse.json({
      status: 'success',
      message: 'Database connection working',
      contactRequestsCount: count || 0,
      tableInfo: tableInfo || 'Table structure check not available'
    });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Unexpected error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 