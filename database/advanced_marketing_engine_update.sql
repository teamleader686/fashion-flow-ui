-- ============================================
-- 🚀 ADVANCED MARKETING ENGINE - UPDATE SCRIPT
-- ============================================

-- 1. UPDATE COUPONS TABLE
ALTER TABLE coupons 
ADD COLUMN IF NOT EXISTS is_affiliate_coupon BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS affiliate_id UUID REFERENCES affiliates(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS coupon_type TEXT DEFAULT 'normal' CHECK (coupon_type IN ('normal', 'affiliate_tracking', 'affiliate_discount')),
ADD COLUMN IF NOT EXISTS commission_type TEXT CHECK (commission_type IN ('percentage', 'fixed')),
ADD COLUMN IF NOT EXISTS commission_value NUMERIC DEFAULT 0;

-- 2. UPDATE COUPON USAGES TABLE
ALTER TABLE coupon_usages 
ADD COLUMN IF NOT EXISTS affiliate_id UUID REFERENCES affiliates(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS commission_amount NUMERIC DEFAULT 0;

-- 3. CREATE AFFILIATE COMMISSION RULES TABLE
CREATE TABLE IF NOT EXISTS affiliate_commission_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  min_order_amount NUMERIC DEFAULT 0,
  commission_type TEXT CHECK (commission_type IN ('percentage', 'fixed')),
  commission_value NUMERIC NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CREATE AFFILIATE WALLET TABLE (As requested, though affiliates table has balance)
-- We will use this table as the primary source of truth for affiliate payouts
CREATE TABLE IF NOT EXISTS affiliate_wallet (
  affiliate_id UUID PRIMARY KEY REFERENCES affiliates(id) ON DELETE CASCADE,
  balance NUMERIC DEFAULT 0,
  total_earned NUMERIC DEFAULT 0,
  total_withdrawn NUMERIC DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initialize affiliate_wallet for existing affiliates
INSERT INTO affiliate_wallet (affiliate_id, balance)
SELECT id, wallet_balance FROM affiliates
ON CONFLICT (affiliate_id) DO NOTHING;

-- 5. ENHANCED VALIDATE COUPON FUNCTION (Multi-coupon support logic)
CREATE OR REPLACE FUNCTION validate_coupon_v2(
  p_code TEXT,
  p_user_id UUID,
  p_cart_total DECIMAL,
  p_product_ids UUID[],
  p_applied_coupon_codes TEXT[] DEFAULT '{}'
)
RETURNS JSON AS $$
DECLARE
  v_coupon RECORD;
  v_user_usage_count INTEGER;
  v_is_new_user BOOLEAN;
  v_discount DECIMAL;
  v_commission DECIMAL := 0;
  v_result JSON;
  v_has_affiliate_coupon BOOLEAN := FALSE;
BEGIN
  -- Check if already applied
  IF p_code = ANY(p_applied_coupon_codes) THEN
    RETURN json_build_object('valid', false, 'error', 'Coupon already applied');
  END IF;

  -- Check if there's already an affiliate coupon applied
  SELECT EXISTS (
    SELECT 1 FROM coupons 
    WHERE code = ANY(p_applied_coupon_codes) 
    AND is_affiliate_coupon = true
  ) INTO v_has_affiliate_coupon;

  -- Get coupon details
  SELECT * INTO v_coupon
  FROM coupons
  WHERE UPPER(code) = UPPER(p_code)
  AND status = 'active';

  -- Check if coupon exists
  IF v_coupon IS NULL THEN
    RETURN json_build_object('valid', false, 'error', 'Invalid coupon code');
  END IF;

  -- Multi-coupon rule: Only 1 affiliate coupon allowed
  IF v_has_affiliate_coupon AND v_coupon.is_affiliate_coupon THEN
    RETURN json_build_object('valid', false, 'error', 'Only one affiliate coupon allowed');
  END IF;

  -- Check expiry
  IF NOW() < v_coupon.start_date THEN
    RETURN json_build_object('valid', false, 'error', 'Coupon not yet active');
  END IF;

  IF NOW() > v_coupon.expiry_date THEN
    RETURN json_build_object('valid', false, 'error', 'Coupon has expired');
  END IF;

  -- Check total usage limit
  IF v_coupon.usage_limit IS NOT NULL AND v_coupon.total_usage_count >= v_coupon.usage_limit THEN
    RETURN json_build_object('valid', false, 'error', 'Coupon usage limit exceeded');
  END IF;

  -- Check user usage limit
  IF p_user_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_user_usage_count
    FROM coupon_usages
    WHERE coupon_id = v_coupon.id
    AND user_id = p_user_id;

    IF v_user_usage_count >= v_coupon.usage_per_user THEN
      RETURN json_build_object('valid', false, 'error', 'You have already used this coupon');
    END IF;
  END IF;

  -- Check minimum order amount
  IF p_cart_total < v_coupon.min_order_amount THEN
    RETURN json_build_object('valid', false, 'error', format('Minimum order amount is ₹%s', v_coupon.min_order_amount));
  END IF;

  -- Check user restriction
  IF v_coupon.user_restriction = 'new' AND p_user_id IS NOT NULL THEN
    SELECT NOT EXISTS(
      SELECT 1 FROM orders WHERE user_id = p_user_id AND status NOT IN ('cancelled', 'returned')
    ) INTO v_is_new_user;
    
    IF NOT v_is_new_user THEN
      RETURN json_build_object('valid', false, 'error', 'This coupon is only for new users');
    END IF;
  END IF;

  -- Check product/category applicability (simplified for now)
  IF v_coupon.applicable_type = 'products' THEN
    IF NOT (v_coupon.applicable_ids && p_product_ids::TEXT[]) THEN
      RETURN json_build_object('valid', false, 'error', 'Coupon not applicable to items in cart');
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
  END IF;

  -- Calculate commission if affiliate coupon
  IF v_coupon.is_affiliate_coupon AND v_coupon.affiliate_id IS NOT NULL THEN
    IF v_coupon.commission_type = 'percentage' THEN
      v_commission := (p_cart_total * v_coupon.commission_value / 100);
    ELSE
      v_commission := v_coupon.commission_value;
    END IF;
  END IF;

  RETURN json_build_object(
    'valid', true,
    'id', v_coupon.id,
    'code', v_coupon.code,
    'type', v_coupon.type,
    'value', v_coupon.value,
    'discount', v_discount,
    'is_affiliate_coupon', v_coupon.is_affiliate_coupon,
    'affiliate_user_id', v_coupon.affiliate_user_id,
    'commission_amount', v_commission
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. FUNCTION: Apply Coupon V2 (Record Usage with Commission)
CREATE OR REPLACE FUNCTION apply_coupon_v2(
  p_coupon_id UUID,
  p_user_id UUID,
  p_order_id UUID,
  p_discount_amount DECIMAL,
  p_commission_amount DECIMAL DEFAULT 0,
  p_affiliate_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Insert usage record
  INSERT INTO coupon_usages (
    coupon_id, 
    user_id, 
    order_id, 
    discount_amount, 
    commission_amount, 
    affiliate_user_id
  )
  VALUES (
    p_coupon_id, 
    p_user_id, 
    p_order_id, 
    p_discount_amount, 
    p_commission_amount, 
    p_affiliate_id
  );

  -- Update coupon stats
  UPDATE coupons
  SET 
    total_usage_count = total_usage_count + 1,
    total_discount_given = total_discount_given + p_discount_amount,
    updated_at = NOW()
  WHERE id = p_coupon_id;

  -- Record commission for affiliate if applicable
  IF p_affiliate_id IS NOT NULL AND p_commission_amount > 0 THEN
    -- Check if record already exists in affiliate_orders
    -- If using separate table for unified tracking, insert there
    INSERT INTO affiliate_orders (
      order_id,
      affiliate_id,
      user_id,
      order_total,
      commission_amount,
      commission_status
    )
    SELECT 
      p_order_id,
      p_affiliate_id,
      p_user_id,
      total_amount, -- from orders table
      p_commission_amount,
      'pending'
    FROM orders 
    WHERE id = p_order_id
    ON CONFLICT (order_id, affiliate_id) DO UPDATE
    SET commission_amount = affiliate_orders.commission_amount + EXCLUDED.commission_amount;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. TRIGGER TO SYNC AFFILIATE WALLET
CREATE OR REPLACE FUNCTION sync_affiliate_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO affiliate_wallet (affiliate_id, balance)
  VALUES (NEW.id, NEW.wallet_balance)
  ON CONFLICT (affiliate_id) DO UPDATE
  SET balance = EXCLUDED.balance,
      updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_affiliate_wallet ON affiliates;
CREATE TRIGGER trigger_sync_affiliate_wallet
AFTER INSERT OR UPDATE OF wallet_balance ON affiliates
FOR EACH ROW
EXECUTE FUNCTION sync_affiliate_wallet();
