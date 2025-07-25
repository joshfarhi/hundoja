-- Inventory Management Migration
-- Run this in your Supabase SQL editor to add comprehensive inventory tracking

-- Create stock_movements table for tracking all inventory changes
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  product_variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('sale', 'restock', 'adjustment', 'return', 'damaged', 'transfer')),
  quantity INTEGER NOT NULL, -- Positive for stock increase, negative for decrease
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  reference_id UUID, -- order_id, purchase_order_id, transfer_id, etc.
  reference_type TEXT, -- 'order', 'purchase_order', 'manual_adjustment', etc.
  notes TEXT,
  created_by UUID, -- admin user who made the change
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_variant_id ON stock_movements(product_variant_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created ON stock_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_reference ON stock_movements(reference_id, reference_type);

-- Create low_stock_alerts table
CREATE TABLE IF NOT EXISTS low_stock_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  product_variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  alert_threshold INTEGER NOT NULL,
  current_stock INTEGER NOT NULL,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP,
  resolved_by UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_product ON low_stock_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_variant ON low_stock_alerts(product_variant_id);
CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_resolved ON low_stock_alerts(is_resolved);

-- Function to update product stock with tracking
CREATE OR REPLACE FUNCTION update_product_stock(
  product_uuid UUID,
  quantity_change INTEGER,
  movement_type TEXT,
  reference_uuid UUID DEFAULT NULL,
  reference_type TEXT DEFAULT NULL,
  notes_text TEXT DEFAULT NULL,
  admin_user_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  current_stock INTEGER;
  new_stock INTEGER;
  movement_id UUID;
  result JSON;
BEGIN
  -- Get current stock
  SELECT stock_quantity INTO current_stock
  FROM products
  WHERE id = product_uuid AND is_active = true;

  IF current_stock IS NULL THEN
    RAISE EXCEPTION 'Product not found or inactive';
  END IF;

  -- Calculate new stock
  new_stock := current_stock + quantity_change;
  
  -- Prevent negative stock (optional - remove this check if you allow backorders)
  IF new_stock < 0 THEN
    RAISE EXCEPTION 'Insufficient stock. Current: %, Requested change: %', current_stock, quantity_change;
  END IF;

  -- Update product stock
  UPDATE products 
  SET stock_quantity = new_stock,
      updated_at = NOW()
  WHERE id = product_uuid;

  -- Record stock movement
  INSERT INTO stock_movements (
    product_id,
    movement_type,
    quantity,
    previous_stock,
    new_stock,
    reference_id,
    reference_type,
    notes,
    created_by
  ) VALUES (
    product_uuid,
    movement_type,
    quantity_change,
    current_stock,
    new_stock,
    reference_uuid,
    reference_type,
    notes_text,
    admin_user_id
  ) RETURNING id INTO movement_id;

  -- Check for low stock and create alert if needed
  PERFORM check_low_stock_alert(product_uuid, new_stock);

  -- Return result
  result := json_build_object(
    'success', true,
    'movement_id', movement_id,
    'previous_stock', current_stock,
    'new_stock', new_stock,
    'quantity_change', quantity_change
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to update variant stock with tracking
CREATE OR REPLACE FUNCTION update_variant_stock(
  variant_uuid UUID,
  quantity_change INTEGER,
  movement_type TEXT,
  reference_uuid UUID DEFAULT NULL,
  reference_type TEXT DEFAULT NULL,
  notes_text TEXT DEFAULT NULL,
  admin_user_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  current_stock INTEGER;
  new_stock INTEGER;
  product_uuid UUID;
  movement_id UUID;
  result JSON;
BEGIN
  -- Get current stock and product_id
  SELECT stock_quantity, product_id INTO current_stock, product_uuid
  FROM product_variants
  WHERE id = variant_uuid AND is_active = true;

  IF current_stock IS NULL THEN
    RAISE EXCEPTION 'Product variant not found or inactive';
  END IF;

  -- Calculate new stock
  new_stock := current_stock + quantity_change;
  
  -- Prevent negative stock
  IF new_stock < 0 THEN
    RAISE EXCEPTION 'Insufficient variant stock. Current: %, Requested change: %', current_stock, quantity_change;
  END IF;

  -- Update variant stock
  UPDATE product_variants 
  SET stock_quantity = new_stock,
      updated_at = NOW()
  WHERE id = variant_uuid;

  -- Record stock movement
  INSERT INTO stock_movements (
    product_id,
    product_variant_id,
    movement_type,
    quantity,
    previous_stock,
    new_stock,
    reference_id,
    reference_type,
    notes,
    created_by
  ) VALUES (
    product_uuid,
    variant_uuid,
    movement_type,
    quantity_change,
    current_stock,
    new_stock,
    reference_uuid,
    reference_type,
    notes_text,
    admin_user_id
  ) RETURNING id INTO movement_id;

  -- Check for low stock alert
  PERFORM check_low_stock_alert_variant(variant_uuid, new_stock);

  result := json_build_object(
    'success', true,
    'movement_id', movement_id,
    'previous_stock', current_stock,
    'new_stock', new_stock,
    'quantity_change', quantity_change
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to check and create low stock alerts
CREATE OR REPLACE FUNCTION check_low_stock_alert(
  product_uuid UUID,
  current_stock INTEGER,
  threshold INTEGER DEFAULT 5
)
RETURNS VOID AS $$
BEGIN
  -- Only create alert if stock is at or below threshold and no unresolved alert exists
  IF current_stock <= threshold THEN
    INSERT INTO low_stock_alerts (product_id, alert_threshold, current_stock)
    SELECT product_uuid, threshold, current_stock
    WHERE NOT EXISTS (
      SELECT 1 FROM low_stock_alerts 
      WHERE product_id = product_uuid 
        AND is_resolved = false
    );
  ELSE
    -- Resolve existing alerts if stock is now above threshold
    UPDATE low_stock_alerts 
    SET is_resolved = true, 
        resolved_at = NOW()
    WHERE product_id = product_uuid 
      AND is_resolved = false;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function for variant low stock alerts
CREATE OR REPLACE FUNCTION check_low_stock_alert_variant(
  variant_uuid UUID,
  current_stock INTEGER,
  threshold INTEGER DEFAULT 5
)
RETURNS VOID AS $$
BEGIN
  IF current_stock <= threshold THEN
    INSERT INTO low_stock_alerts (product_variant_id, alert_threshold, current_stock)
    SELECT variant_uuid, threshold, current_stock
    WHERE NOT EXISTS (
      SELECT 1 FROM low_stock_alerts 
      WHERE product_variant_id = variant_uuid 
        AND is_resolved = false
    );
  ELSE
    UPDATE low_stock_alerts 
    SET is_resolved = true, 
        resolved_at = NOW()
    WHERE product_variant_id = variant_uuid 
      AND is_resolved = false;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get inventory report
CREATE OR REPLACE FUNCTION get_inventory_report(
  days_back INTEGER DEFAULT 30
)
RETURNS TABLE(
  product_id UUID,
  product_name TEXT,
  product_sku TEXT,
  current_stock INTEGER,
  total_sales INTEGER,
  total_restocks INTEGER,
  total_adjustments INTEGER,
  stock_value DECIMAL,
  days_of_inventory DECIMAL,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.sku,
    p.stock_quantity,
    COALESCE(ABS(SUM(CASE WHEN sm.movement_type = 'sale' THEN sm.quantity ELSE 0 END)), 0)::INTEGER as total_sales,
    COALESCE(SUM(CASE WHEN sm.movement_type = 'restock' THEN sm.quantity ELSE 0 END), 0)::INTEGER as total_restocks,
    COALESCE(SUM(CASE WHEN sm.movement_type = 'adjustment' THEN sm.quantity ELSE 0 END), 0)::INTEGER as total_adjustments,
    (p.stock_quantity * p.price)::DECIMAL as stock_value,
    CASE 
      WHEN COALESCE(ABS(SUM(CASE WHEN sm.movement_type = 'sale' THEN sm.quantity ELSE 0 END)), 0) = 0 THEN NULL
      ELSE (p.stock_quantity::DECIMAL / (ABS(SUM(CASE WHEN sm.movement_type = 'sale' THEN sm.quantity ELSE 0 END))::DECIMAL / days_back))
    END as days_of_inventory,
    CASE 
      WHEN p.stock_quantity = 0 THEN 'OUT_OF_STOCK'
      WHEN p.stock_quantity <= 5 THEN 'LOW_STOCK'
      WHEN p.stock_quantity <= 10 THEN 'MODERATE_STOCK'
      ELSE 'GOOD_STOCK'
    END as status
  FROM products p
  LEFT JOIN stock_movements sm ON p.id = sm.product_id 
    AND sm.created_at >= NOW() - (days_back || ' days')::INTERVAL
  WHERE p.is_active = true
  GROUP BY p.id, p.name, p.sku, p.stock_quantity, p.price
  ORDER BY p.name;
END;
$$ LANGUAGE plpgsql;

-- View for active low stock alerts
CREATE OR REPLACE VIEW active_low_stock_alerts AS
SELECT 
  lsa.id,
  lsa.alert_threshold,
  lsa.current_stock,
  lsa.created_at,
  p.id as product_id,
  p.name as product_name,
  p.sku as product_sku,
  p.price as product_price,
  pv.id as variant_id,
  pv.name as variant_name,
  pv.sku as variant_sku,
  c.name as category_name
FROM low_stock_alerts lsa
LEFT JOIN products p ON lsa.product_id = p.id
LEFT JOIN product_variants pv ON lsa.product_variant_id = pv.id
LEFT JOIN categories c ON p.category_id = c.id
WHERE lsa.is_resolved = false
ORDER BY lsa.created_at DESC;

-- Trigger to automatically create low stock alerts
CREATE OR REPLACE FUNCTION auto_check_low_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- Check for product stock
  IF TG_TABLE_NAME = 'products' AND NEW.stock_quantity != OLD.stock_quantity THEN
    PERFORM check_low_stock_alert(NEW.id, NEW.stock_quantity);
  END IF;
  
  -- Check for variant stock
  IF TG_TABLE_NAME = 'product_variants' AND NEW.stock_quantity != OLD.stock_quantity THEN
    PERFORM check_low_stock_alert_variant(NEW.id, NEW.stock_quantity);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS auto_low_stock_products ON products;
CREATE TRIGGER auto_low_stock_products
  AFTER UPDATE ON products
  FOR EACH ROW
  WHEN (NEW.stock_quantity IS DISTINCT FROM OLD.stock_quantity)
  EXECUTE FUNCTION auto_check_low_stock();

DROP TRIGGER IF EXISTS auto_low_stock_variants ON product_variants;
CREATE TRIGGER auto_low_stock_variants
  AFTER UPDATE ON product_variants
  FOR EACH ROW
  WHEN (NEW.stock_quantity IS DISTINCT FROM OLD.stock_quantity)
  EXECUTE FUNCTION auto_check_low_stock();

-- Enable RLS on new tables
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE low_stock_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stock_movements
CREATE POLICY "Admin full access" ON stock_movements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE clerk_user_id = auth.jwt() ->> 'sub'
      AND is_active = true
    )
  );

-- RLS Policies for low_stock_alerts  
CREATE POLICY "Admin full access" ON low_stock_alerts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE clerk_user_id = auth.jwt() ->> 'sub'
      AND is_active = true
    )
  );