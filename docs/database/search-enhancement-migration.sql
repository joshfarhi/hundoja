-- Search Enhancement Migration
-- Run this in your Supabase SQL editor to add full-text search capabilities

-- Add search vector column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create search index
CREATE INDEX IF NOT EXISTS products_search_idx ON products USING GIN(search_vector);

-- Update trigger for search vector
CREATE OR REPLACE FUNCTION update_product_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', 
    COALESCE(NEW.name, '') || ' ' || 
    COALESCE(NEW.description, '') || ' ' ||
    COALESCE(NEW.sku, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_products_search_vector ON products;
CREATE TRIGGER update_products_search_vector
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_product_search_vector();

-- Update existing products with search vectors
UPDATE products SET search_vector = to_tsvector('english', 
  COALESCE(name, '') || ' ' || 
  COALESCE(description, '') || ' ' ||
  COALESCE(sku, '')
);

-- Advanced search function
CREATE OR REPLACE FUNCTION search_products_advanced(
  search_query TEXT DEFAULT '',
  category_filter TEXT DEFAULT NULL,
  min_price DECIMAL DEFAULT NULL,
  max_price DECIMAL DEFAULT NULL,
  in_stock_only BOOLEAN DEFAULT FALSE,
  sort_by TEXT DEFAULT 'relevance',
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  description TEXT,
  sku TEXT,
  price DECIMAL,
  stock_quantity INTEGER,
  images TEXT[],
  category_name TEXT,
  category_slug TEXT,
  relevance_score REAL
) AS $$
DECLARE
  sort_clause TEXT;
BEGIN
  -- Build sort clause
  CASE sort_by
    WHEN 'price_asc' THEN sort_clause := 'p.price ASC';
    WHEN 'price_desc' THEN sort_clause := 'p.price DESC';
    WHEN 'name_asc' THEN sort_clause := 'p.name ASC';
    WHEN 'name_desc' THEN sort_clause := 'p.name DESC';
    WHEN 'newest' THEN sort_clause := 'p.created_at DESC';
    WHEN 'stock' THEN sort_clause := 'p.stock_quantity DESC';
    ELSE sort_clause := 'ts_rank(p.search_vector, query) DESC';
  END CASE;

  RETURN QUERY EXECUTE format('
    SELECT 
      p.id,
      p.name,
      p.description,
      p.sku,
      p.price,
      p.stock_quantity,
      p.images,
      c.name as category_name,
      c.slug as category_slug,
      CASE 
        WHEN $1 = '''' THEN 1.0
        ELSE ts_rank(p.search_vector, query)
      END as relevance_score
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    CROSS JOIN LATERAL (
      SELECT to_tsquery(''english'', 
        CASE 
          WHEN $1 = '''' THEN ''''
          ELSE regexp_replace(trim($1), ''\s+'', '' & '', ''g'')
        END
      ) as query
    ) q
    WHERE p.is_active = true
      AND ($1 = '''' OR p.search_vector @@ q.query)
      AND ($2 IS NULL OR c.slug = $2)
      AND ($3 IS NULL OR p.price >= $3)
      AND ($4 IS NULL OR p.price <= $4)
      AND ($5 = false OR p.stock_quantity > 0)
    ORDER BY %s
    LIMIT $6 OFFSET $7
  ', sort_clause)
  USING search_query, category_filter, min_price, max_price, in_stock_only, limit_count, offset_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get search suggestions
CREATE OR REPLACE FUNCTION get_search_suggestions(partial_query TEXT, suggestion_limit INTEGER DEFAULT 5)
RETURNS TABLE(suggestion TEXT, type TEXT) AS $$
BEGIN
  RETURN QUERY
  (
    -- Product names
    SELECT DISTINCT p.name as suggestion, 'product'::TEXT as type
    FROM products p
    WHERE p.is_active = true 
      AND p.name ILIKE '%' || partial_query || '%'
    LIMIT suggestion_limit
  )
  UNION ALL
  (
    -- Category names
    SELECT DISTINCT c.name as suggestion, 'category'::TEXT as type
    FROM categories c
    WHERE c.is_active = true 
      AND c.name ILIKE '%' || partial_query || '%'
    LIMIT suggestion_limit
  )
  ORDER BY type, suggestion;
END;
$$ LANGUAGE plpgsql;

-- Create search analytics table
CREATE TABLE IF NOT EXISTS search_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_analytics_query ON search_analytics(query);
CREATE INDEX IF NOT EXISTS idx_search_analytics_created ON search_analytics(created_at);

-- Function to log search queries
CREATE OR REPLACE FUNCTION log_search_query(
  search_query TEXT,
  result_count INTEGER DEFAULT 0,
  user_agent TEXT DEFAULT NULL,
  ip_addr TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO search_analytics (query, results_count, user_agent, ip_address)
  VALUES (search_query, result_count, user_agent, ip_addr::inet);
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore errors in logging
    NULL;
END;
$$ LANGUAGE plpgsql;

-- Create popular searches view
CREATE OR REPLACE VIEW popular_searches AS
SELECT 
  query,
  COUNT(*) as search_count,
  AVG(results_count) as avg_results,
  MAX(created_at) as last_searched
FROM search_analytics
WHERE query != '' 
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY query
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC, MAX(created_at) DESC
LIMIT 20;