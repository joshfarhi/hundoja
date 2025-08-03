import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

// Validation schema
const ProductSearchSchema = z.object({
  page: z.string().optional().transform(val => parseInt(val || '1')),
  limit: z.string().optional().transform(val => Math.min(parseInt(val || '20'), 100)), // Max 100 items
  search: z.string().optional(),
  category: z.string().optional(),
  featured: z.string().optional().transform(val => val === 'true'),
  minPrice: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  maxPrice: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  inStock: z.string().optional().transform(val => val === 'true'),
  sortBy: z.enum(['relevance', 'newest', 'price_asc', 'price_desc', 'name_asc', 'name_desc', 'stock']).optional().default('newest'),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Validate query parameters
    const validatedParams = ProductSearchSchema.parse({
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      search: searchParams.get('search') || undefined,
      category: searchParams.get('category') || undefined,
      featured: searchParams.get('featured') || undefined,
      minPrice: searchParams.get('minPrice') || undefined,
      maxPrice: searchParams.get('maxPrice') || undefined,
      inStock: searchParams.get('inStock') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
    });

    const {
      page,
      limit,
      search,
      category,
      featured,
      minPrice,
      maxPrice,
      inStock,
      sortBy
    } = validatedParams;

    // Build query with all filters including search
    let query = supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        sku,
        price,
        stock_quantity,
        images,
        is_active,
        is_featured,
        sizes,
        colors,
        created_at,
        categories (
          id,
          name,
          slug
        )
      `, { count: 'exact' })
      .eq('is_active', true);

    // Apply search filter if provided
    if (search && search.trim()) {
      query = query.or(`name.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%,sku.ilike.%${search.trim()}%`);
    }

    // Apply filters
    if (category) {
      query = query.eq('categories.slug', category);
    }

    if (featured) {
      query = query.eq('is_featured', true);
    }

    if (minPrice !== undefined) {
      query = query.gte('price', minPrice);
    }

    if (maxPrice !== undefined) {
      query = query.lte('price', maxPrice);
    }

    if (inStock) {
      query = query.gt('stock_quantity', 0);
    }

    // Apply sorting
    switch (sortBy) {
      case 'price_asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false });
        break;
      case 'name_asc':
        query = query.order('name', { ascending: true });
        break;
      case 'name_desc':
        query = query.order('name', { ascending: false });
        break;
      case 'stock':
        query = query.order('stock_quantity', { ascending: false });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    // Apply pagination
    query = query.range((page - 1) * limit, page * limit - 1);

    const { data: products, error, count } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    return NextResponse.json({
      products: products || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
        hasMore: (page * limit) < (count || 0)
      },
      searchQuery: search?.trim() || null,
      filters: {
        category,
        minPrice,
        maxPrice,
        inStock,
        sortBy
      }
    });

  } catch (error) {
    console.error('API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET product suggestions for search autocomplete
export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const { data: suggestions, error } = await supabase
      .rpc('get_search_suggestions', {
        partial_query: query.trim(),
        suggestion_limit: 8
      });

    if (error) {
      console.error('Suggestions error:', error);
      return NextResponse.json({ suggestions: [] });
    }

    return NextResponse.json({
      suggestions: suggestions || []
    });

  } catch (error) {
    console.error('Suggestions API error:', error);
    return NextResponse.json({ suggestions: [] });
  }
}