-- ============================================
-- 🚀 PRODUCTION-READY OFFER SYSTEM UPGRADE
-- ============================================

-- STEP 1: Update OFFERS table with advanced tracking columns
ALTER TABLE offers 
ADD COLUMN IF NOT EXISTS max_usage INTEGER,
ADD COLUMN IF NOT EXISTS used_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS usage_per_user INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS clicks_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS conversions_count INTEGER DEFAULT 0;

-- STEP 2: Create OFFER_USAGES table to track per-user limits
CREATE TABLE IF NOT EXISTS offer_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID, -- Optional: link to order
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(offer_id, user_id, order_id)
);

-- INDEX for usage tracking
CREATE INDEX IF NOT EXISTS idx_offer_usages_lookup ON offer_usages(user_id, offer_id);

-- STEP 3: Optimized GET_PRODUCT_OFFER Function
-- This function calculates the best offer based on final price and scope priority
CREATE OR REPLACE FUNCTION get_product_offer(
  p_product_id UUID, 
  p_category_id UUID DEFAULT NULL,
  p_original_price DECIMAL DEFAULT 0,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE(
  offer_id UUID,
  title TEXT,
  type TEXT,
  discount_value DECIMAL,
  max_discount DECIMAL,
  badge_text TEXT,
  badge_color TEXT,
  end_datetime TIMESTAMPTZ,
  final_price DECIMAL,
  discount_amount DECIMAL,
  scope_priority INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH valid_offers AS (
    SELECT 
      o.id as v_offer_id,
      o.title as v_title,
      o.type as v_type,
      o.discount_value as v_discount_value,
      o.max_discount as v_max_discount,
      o.badge_text as v_badge_text,
      o.badge_color as v_badge_color,
      o.end_datetime as v_end_datetime,
      o.usage_per_user as v_usage_per_user,
      o.priority as v_priority,
      CASE 
        WHEN o.scope_type = 'products' THEN 1
        WHEN o.scope_type = 'categories' THEN 2
        ELSE 3
      END as scope_rank,
      CASE 
        WHEN o.type = 'flat' THEN LEAST(o.discount_value, p_original_price)
        WHEN o.type = 'percentage' THEN 
          CASE 
            WHEN o.max_discount IS NOT NULL THEN LEAST((p_original_price * o.discount_value / 100), o.max_discount)
            ELSE (p_original_price * o.discount_value / 100)
          END
        WHEN o.type = 'bogo' THEN 0 
        ELSE 0
      END as calculated_discount
    FROM offers o
    LEFT JOIN offer_products op ON o.id = op.offer_id
    LEFT JOIN offer_categories oc ON o.id = oc.offer_id
    WHERE o.status = 'active'
      AND NOW() BETWEEN o.start_datetime AND o.end_datetime
      AND (o.stock_remaining IS NULL OR o.stock_remaining > 0)
      AND (o.max_usage IS NULL OR o.used_count < o.max_usage)
      AND (
        o.scope_type = 'all'
        OR (o.scope_type = 'products' AND op.product_id = p_product_id)
        OR (o.scope_type = 'categories' AND oc.category_id = p_category_id)
      )
      -- Check usage per user with qualified names
      AND (
        p_user_id IS NULL 
        OR o.usage_per_user IS NULL 
        OR (SELECT COUNT(*) FROM offer_usages ou WHERE ou.offer_id = o.id AND ou.user_id = p_user_id) < o.usage_per_user
      )
  )
  SELECT 
    vo.v_offer_id,
    vo.v_title,
    vo.v_type,
    vo.v_discount_value,
    vo.v_max_discount,
    vo.v_badge_text,
    vo.v_badge_color,
    vo.v_end_datetime,
    GREATEST(p_original_price - vo.calculated_discount, 0) as final_price,
    vo.calculated_discount as discount_amount,
    vo.scope_rank
  FROM valid_offers vo
  ORDER BY 
    vo.scope_rank ASC,
    (p_original_price - vo.calculated_discount) ASC,
    vo.v_priority DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- STEP 4: Analytics Tracking Function
CREATE OR REPLACE FUNCTION track_offer_interaction(
  p_offer_id UUID,
  p_interaction_type TEXT -- 'view', 'click', 'conversion'
)
RETURNS void AS $$
BEGIN
  IF p_interaction_type = 'view' THEN
    UPDATE offers SET views_count = views_count + 1 WHERE id = p_offer_id;
  ELSIF p_interaction_type = 'click' THEN
    UPDATE offers SET clicks_count = clicks_count + 1 WHERE id = p_offer_id;
  ELSIF p_interaction_type = 'conversion' THEN
    UPDATE offers SET 
      conversions_count = conversions_count + 1,
      used_count = used_count + 1
    WHERE id = p_offer_id;
  END IF;
  
  -- Also update offer_analytics table for daily trends
  INSERT INTO offer_analytics (offer_id, date, views, clicks, conversions)
  VALUES (
    p_offer_id, 
    CURRENT_DATE, 
    CASE WHEN p_interaction_type = 'view' THEN 1 ELSE 0 END,
    CASE WHEN p_interaction_type = 'click' THEN 1 ELSE 0 END,
    CASE WHEN p_interaction_type = 'conversion' THEN 1 ELSE 0 END
  )
  ON CONFLICT (offer_id, date) DO UPDATE SET
    views = offer_analytics.views + (CASE WHEN p_interaction_type = 'view' THEN 1 ELSE 0 END),
    clicks = offer_analytics.clicks + (CASE WHEN p_interaction_type = 'click' THEN 1 ELSE 0 END),
    conversions = offer_analytics.conversions + (CASE WHEN p_interaction_type = 'conversion' THEN 1 ELSE 0 END);
END;
$$ LANGUAGE plpgsql;

-- STEP 5: Auto-status update (Expiring)
CREATE OR REPLACE FUNCTION update_offer_statuses()
RETURNS void AS $$
BEGIN
  UPDATE offers
  SET status = 'expired'
  WHERE status = 'active' AND end_datetime < NOW();
  
  UPDATE offers
  SET status = 'active'
  WHERE status = 'scheduled' AND start_datetime <= NOW() AND end_datetime > NOW();
END;
$$ LANGUAGE plpgsql;

-- STEP 6: Update RLS Policies to use user_profiles role
DROP POLICY IF EXISTS "Admin can manage offers" ON offers;
CREATE POLICY "Admin can manage offers"
ON offers FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admin can manage offer products" ON offer_products;
CREATE POLICY "Admin can manage offer products"
ON offer_products FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admin can manage offer categories" ON offer_categories;
CREATE POLICY "Admin can manage offer categories"
ON offer_categories FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Policy for offer_usages
ALTER TABLE offer_usages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own usages" ON offer_usages;
CREATE POLICY "Users view own usages" ON offer_usages FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System insert usages" ON offer_usages;
CREATE POLICY "System insert usages" ON offer_usages FOR INSERT WITH CHECK (true);

-- ✅ UPGRADE COMPLETE
