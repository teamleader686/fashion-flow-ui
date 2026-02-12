-- ============================================
-- 🎉 COMPLETE OFFER MANAGEMENT SYSTEM SCHEMA
-- ============================================

-- STEP 1: Drop existing tables if any
DROP TABLE IF EXISTS offer_analytics CASCADE;
DROP TABLE IF EXISTS offer_categories CASCADE;
DROP TABLE IF EXISTS offer_products CASCADE;
DROP TABLE IF EXISTS offers CASCADE;
DROP FUNCTION IF EXISTS get_product_offer CASCADE;
DROP FUNCTION IF EXISTS calculate_offer_price CASCADE;
DROP FUNCTION IF EXISTS get_active_offers CASCADE;

-- STEP 2: Create OFFERS table
CREATE TABLE offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('flat', 'percentage', 'bogo', 'flash_sale', 'category')),
  discount_value DECIMAL(10, 2) NOT NULL CHECK (discount_value > 0),
  max_discount DECIMAL(10, 2), -- For percentage offers
  min_order_amount DECIMAL(10, 2) DEFAULT 0,
  scope_type TEXT NOT NULL CHECK (scope_type IN ('all', 'products', 'categories')),
  start_datetime TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_datetime TIMESTAMPTZ NOT NULL,
  badge_text TEXT DEFAULT 'Special Offer',
  badge_color TEXT DEFAULT '#FF6B6B',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'scheduled', 'expired')),
  priority INTEGER DEFAULT 1, -- Higher number = higher priority
  stock_limit INTEGER, -- For flash sales
  stock_remaining INTEGER, -- Current stock for flash sale
  total_usage_count INTEGER DEFAULT 0,
  total_discount_given DECIMAL(10, 2) DEFAULT 0,
  total_revenue DECIMAL(10, 2) DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 3: Create OFFER_PRODUCTS mapping table
CREATE TABLE offer_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(offer_id, product_id)
);

-- STEP 4: Create OFFER_CATEGORIES mapping table
CREATE TABLE offer_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  category_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(offer_id, category_id)
);

-- STEP 5: Create OFFER_ANALYTICS table
CREATE TABLE offer_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue DECIMAL(10, 2) DEFAULT 0,
  discount_given DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(offer_id, date)
);

-- STEP 6: Create indexes
CREATE INDEX idx_offers_status ON offers(status);
CREATE INDEX idx_offers_dates ON offers(start_datetime, end_datetime);
CREATE INDEX idx_offers_priority ON offers(priority DESC);
CREATE INDEX idx_offer_products_product ON offer_products(product_id);
CREATE INDEX idx_offer_products_offer ON offer_products(offer_id);
CREATE INDEX idx_offer_categories_category ON offer_categories(category_id);
CREATE INDEX idx_offer_categories_offer ON offer_categories(offer_id);
CREATE INDEX idx_offer_analytics_offer ON offer_analytics(offer_id);
CREATE INDEX idx_offer_analytics_date ON offer_analytics(date);

-- STEP 7: Function to get active offers for a product
CREATE OR REPLACE FUNCTION get_product_offer(p_product_id UUID, p_category_id UUID DEFAULT NULL)
RETURNS TABLE(
  offer_id UUID,
  title TEXT,
  type TEXT,
  discount_value DECIMAL,
  max_discount DECIMAL,
  badge_text TEXT,
  badge_color TEXT,
  end_datetime TIMESTAMPTZ,
  stock_remaining INTEGER,
  priority INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (o.priority, o.created_at)
    o.id,
    o.title,
    o.type,
    o.discount_value,
    o.max_discount,
    o.badge_text,
    o.badge_color,
    o.end_datetime,
    o.stock_remaining,
    o.priority
  FROM offers o
  LEFT JOIN offer_products op ON o.id = op.offer_id
  LEFT JOIN offer_categories oc ON o.id = oc.offer_id
  WHERE o.status = 'active'
    AND NOW() BETWEEN o.start_datetime AND o.end_datetime
    AND (
      o.scope_type = 'all'
      OR (o.scope_type = 'products' AND op.product_id = p_product_id)
      OR (o.scope_type = 'categories' AND oc.category_id = p_category_id)
    )
    AND (o.stock_remaining IS NULL OR o.stock_remaining > 0)
  ORDER BY o.priority DESC, o.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- STEP 8: Function to calculate offer price
CREATE OR REPLACE FUNCTION calculate_offer_price(
  p_original_price DECIMAL,
  p_offer_type TEXT,
  p_discount_value DECIMAL,
  p_max_discount DECIMAL DEFAULT NULL
)
RETURNS DECIMAL AS $$
DECLARE
  v_discount DECIMAL;
  v_final_price DECIMAL;
BEGIN
  IF p_offer_type = 'flat' THEN
    v_discount := LEAST(p_discount_value, p_original_price);
  ELSIF p_offer_type = 'percentage' THEN
    v_discount := (p_original_price * p_discount_value / 100);
    IF p_max_discount IS NOT NULL THEN
      v_discount := LEAST(v_discount, p_max_discount);
    END IF;
  ELSIF p_offer_type = 'bogo' THEN
    v_discount := p_original_price / 2; -- 50% off for BOGO
  ELSE
    v_discount := 0;
  END IF;

  v_final_price := p_original_price - v_discount;
  RETURN GREATEST(v_final_price, 0);
END;
$$ LANGUAGE plpgsql;

-- STEP 9: Function to get all active offers
CREATE OR REPLACE FUNCTION get_active_offers()
RETURNS TABLE(
  offer_id UUID,
  title TEXT,
  type TEXT,
  discount_value DECIMAL,
  badge_text TEXT,
  end_datetime TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.title,
    o.type,
    o.discount_value,
    o.badge_text,
    o.end_datetime
  FROM offers o
  WHERE o.status = 'active'
    AND NOW() BETWEEN o.start_datetime AND o.end_datetime
  ORDER BY o.priority DESC, o.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- STEP 10: Function to update offer status based on dates
CREATE OR REPLACE FUNCTION update_offer_status()
RETURNS void AS $$
BEGIN
  -- Mark as expired
  UPDATE offers
  SET status = 'expired'
  WHERE status = 'active'
    AND end_datetime < NOW();

  -- Activate scheduled offers
  UPDATE offers
  SET status = 'active'
  WHERE status = 'scheduled'
    AND start_datetime <= NOW()
    AND end_datetime > NOW();
END;
$$ LANGUAGE plpgsql;

-- STEP 11: Trigger to update timestamp
CREATE OR REPLACE FUNCTION update_offer_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_offer_timestamp
BEFORE UPDATE ON offers
FOR EACH ROW
EXECUTE FUNCTION update_offer_timestamp();

-- STEP 12: Trigger to update stock for flash sales
CREATE OR REPLACE FUNCTION update_flash_sale_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrease stock when order is placed
  IF NEW.offer_id IS NOT NULL THEN
    UPDATE offers
    SET stock_remaining = GREATEST(stock_remaining - 1, 0)
    WHERE id = NEW.offer_id
      AND type = 'flash_sale'
      AND stock_remaining > 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 13: Enable RLS
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_analytics ENABLE ROW LEVEL SECURITY;

-- STEP 14: RLS Policies for offers
CREATE POLICY "Admin can manage offers"
ON offers FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
    AND admin_users.is_active = true
  )
);

CREATE POLICY "Public can view active offers"
ON offers FOR SELECT
TO anon, authenticated
USING (
  status = 'active' 
  AND NOW() BETWEEN start_datetime AND end_datetime
);

-- STEP 15: RLS Policies for offer_products
CREATE POLICY "Admin can manage offer products"
ON offer_products FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
    AND admin_users.is_active = true
  )
);

CREATE POLICY "Public can view offer products"
ON offer_products FOR SELECT
TO anon, authenticated
USING (true);

-- STEP 16: RLS Policies for offer_categories
CREATE POLICY "Admin can manage offer categories"
ON offer_categories FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
    AND admin_users.is_active = true
  )
);

CREATE POLICY "Public can view offer categories"
ON offer_categories FOR SELECT
TO anon, authenticated
USING (true);

-- STEP 17: RLS Policies for offer_analytics
CREATE POLICY "Admin can view offer analytics"
ON offer_analytics FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
    AND admin_users.is_active = true
  )
);

CREATE POLICY "Admin can insert offer analytics"
ON offer_analytics FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
    AND admin_users.is_active = true
  )
);

-- ============================================
-- ✅ OFFER SYSTEM SCHEMA COMPLETE!
-- ============================================
-- Features included:
-- ✅ Multiple offer types (flat, percentage, BOGO, flash sale)
-- ✅ Product & category level offers
-- ✅ Priority-based offer selection
-- ✅ Flash sale with stock management
-- ✅ Analytics tracking
-- ✅ Auto status updates
-- ✅ RLS security
-- ============================================
