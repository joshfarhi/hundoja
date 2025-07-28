import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('contact_requests')
      .select('count(*)', { count: 'exact', head: true });

    if (testError) {
      return NextResponse.json({
        status: 'error',
        message: 'Database connection failed',
        error: testError.message,
        details: testError
      }, { status: 500 });
    }

    // Test table structure
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_info', { table_name: 'contact_requests' })
      .catch(() => ({ data: null, error: { message: 'RPC function not available' } }));

    return NextResponse.json({
      status: 'success',
      message: 'Database connection working',
      contactRequestsCount: testData?.[0]?.count || 0,
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