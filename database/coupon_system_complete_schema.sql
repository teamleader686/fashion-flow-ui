-- ============================================
-- 🎟 COMPLETE COUPON MANAGEMENT SYSTEM SCHEMA
-- ============================================

-- 1️⃣ COUPONS TABLE
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('flat', 'percentage')),
  value DECIMAL(10, 2) NOT NULL CHECK (value > 0),
  min_order_amount DECIMAL(10, 2) DEFAULT 0,
  max_discount DECIMAL(10, 2), -- For percentage coupons
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expiry_date TIMESTAMPTZ NOT NULL,
  usage_limit INTEGER DEFAULT NULL, -- NULL = unlimited
  usage_per_user INTEGER DEFAULT 1,
  applicable_type TEXT NOT NULL CHECK (applicable_type IN ('all', 'products', 'categories')),
  applicable_ids TEXT[], -- Product IDs or Category IDs
  user_restriction TEXT NOT NULL DEFAULT 'all' CHECK (user_restriction IN ('all', 'new', 'specific')),
  restricted_user_ids UUID[], -- Specific user IDs if user_restriction = 'specific'
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  total_usage_count INTEGER DEFAULT 0,
  total_discount_given DECIMAL(10, 2) DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2️⃣ COUPON USAGES TABLE
CREATE TABLE IF NOT EXISTS coupon_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  order_id UUID REFERENCES orders(id),
  discount_amount DECIMAL(10, 2) NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3️⃣ INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_status ON coupons(status);
CREATE INDEX IF NOT EXISTS idx_coupons_expiry ON coupons(expiry_date);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_coupon ON coupon_usages(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_user ON coupon_usages(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_order ON coupon_usages(order_id);

-- 4️⃣ FUNCTION: Validate Coupon
CREATE OR REPLACE FUNCTION validate_coupon(
  p_code TEXT,
  p_user_id UUID,
  p_cart_total DECIMAL,
  p_product_ids UUID[]
)
RETURNS JSON AS $$
DECLARE
  v_coupon RECORD;
  v_user_usage_count INTEGER;
  v_is_new_user BOOLEAN;
  v_discount DECIMAL;
  v_result JSON;
BEGIN
  -- Get coupon details
  SELECT * INTO v_coupon
  FROM coupons
  WHERE UPPER(code) = UPPER(p_code)
  AND status = 'active';

  -- Check if coupon exists
  IF v_coupon IS NULL THEN
    RETURN json_build_object(
      'valid', false,
      'error', 'Invalid coupon code'
    );
  END IF;

  -- Check expiry
  IF NOW() < v_coupon.start_date THEN
    RETURN json_build_object(
      'valid', false,
      'error', 'Coupon not yet active'
    );
  END IF;

  IF NOW() > v_coupon.expiry_date THEN
    RETURN json_build_object(
      'valid', false,
      'error', 'Coupon has expired'
    );
  END IF;

  -- Check total usage limit
  IF v_coupon.usage_limit IS NOT NULL AND v_coupon.total_usage_count >= v_coupon.usage_limit THEN
    RETURN json_build_object(
      'valid', false,
      'error', 'Coupon usage limit exceeded'
    );
  END IF;

  -- Check user usage limit
  SELECT COUNT(*) INTO v_user_usage_count
  FROM coupon_usages
  WHERE coupon_id = v_coupon.id
  AND user_id = p_user_id;

  IF v_user_usage_count >= v_coupon.usage_per_user THEN
    RETURN json_build_object(
      'valid', false,
      'error', 'You have already used this coupon'
    );
  END IF;

  -- Check minimum order amount
  IF p_cart_total < v_coupon.min_order_amount THEN
    RETURN json_build_object(
      'valid', false,
      'error', format('Minimum order amount is ₹%s', v_coupon.min_order_amount)
    );
  END IF;

  -- Check user restriction
  IF v_coupon.user_restriction = 'new' THEN
    SELECT NOT EXISTS(
      SELECT 1 FROM orders WHERE user_id = p_user_id AND status != 'cancelled'
    ) INTO v_is_new_user;
    
    IF NOT v_is_new_user THEN
      RETURN json_build_object(
        'valid', false,
        'error', 'This coupon is only for new users'
      );
    END IF;
  END IF;

  IF v_coupon.user_restriction = 'specific' THEN
    IF NOT (p_user_id = ANY(v_coupon.restricted_user_ids)) THEN
      RETURN json_build_object(
        'valid', false,
        'error', 'This coupon is not available for you'
      );
    END IF;
  END IF;

  -- Check product/category applicability
  IF v_coupon.applicable_type = 'products' THEN
    IF NOT (v_coupon.applicable_ids && p_product_ids::TEXT[]) THEN
      RETURN json_build_object(
        'valid', false,
        'error', 'This coupon is not applicable to your cart items'
      );
    END IF;
  END IF;

  -- Calculate discount
  IF v_coupon.type = 'flat' THEN
    v_discount := LEAST(v_coupon.value, p_cart_total);
  ELSE -- percentage
    v_discount := (p_cart_total * v_coupon.value / 100);
    IF v_coupon.max_discount IS NOT NULL THEN
      v_discount := LEAST(v_discount, v_coupon.max_discount);
    END IF;
    v_discount := LEAST(v_discount, p_cart_total);
  END IF;

  -- Return success
  RETURN json_build_object(
    'valid', true,
    'coupon_id', v_coupon.id,
    'code', v_coupon.code,
    'type', v_coupon.type,
    'discount', v_discount,
    'final_amount', p_cart_total - v_discount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5️⃣ FUNCTION: Apply Coupon (Record Usage)
CREATE OR REPLACE FUNCTION apply_coupon(
  p_coupon_id UUID,
  p_user_id UUID,
  p_order_id UUID,
  p_discount_amount DECIMAL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Insert usage record
  INSERT INTO coupon_usages (coupon_id, user_id, order_id, discount_amount)
  VALUES (p_coupon_id, p_user_id, p_order_id, p_discount_amount);

  -- Update coupon stats
  UPDATE coupons
  SET 
    total_usage_count = total_usage_count + 1,
    total_discount_given = total_discount_given + p_discount_amount,
    updated_at = NOW()
  WHERE id = p_coupon_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6️⃣ RLS POLICIES

-- Enable RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usages ENABLE ROW LEVEL SECURITY;

-- Coupons: Admin full access
CREATE POLICY "Admin can manage coupons"
ON coupons FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Coupons: Users can view active coupons
CREATE POLICY "Users can view active coupons"
ON coupons FOR SELECT
TO authenticated
USING (status = 'active' AND NOW() BETWEEN start_date AND expiry_date);

-- Coupon Usages: Admin can view all
CREATE POLICY "Admin can view all coupon usages"
ON coupon_usages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Coupon Usages: Users can view their own
CREATE POLICY "Users can view their coupon usages"
ON coupon_usages FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 7️⃣ TRIGGER: Update timestamp
CREATE OR REPLACE FUNCTION update_coupon_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_coupon_timestamp
BEFORE UPDATE ON coupons
FOR EACH ROW
EXECUTE FUNCTION update_coupon_timestamp();

-- ============================================
-- ✅ SCHEMA COMPLETE
-- ============================================
