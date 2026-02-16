-- ========================================================
-- 🧹 CLEANUP & FORCE INSTALL ROBUST RPC
-- ========================================================
-- Use this script if you see "function name is not unique" error.
-- It drops all old versions before installing the clean, robust one.
-- ========================================================

-- 1. DROP ALL OLD VERSIONS (Signature cleanup)
DROP FUNCTION IF EXISTS public.validate_coupon_v2(TEXT, UUID, DECIMAL, UUID[], TEXT[]);
DROP FUNCTION IF EXISTS public.validate_coupon_v2(TEXT, TEXT, NUMERIC, TEXT[], TEXT[]);
DROP FUNCTION IF EXISTS public.apply_coupon_v2(UUID, UUID, UUID, DECIMAL, DECIMAL, UUID);

-- 2. CREATE THE FINAL ROBUST VERSION
CREATE OR REPLACE FUNCTION public.validate_coupon_v2(
  p_code TEXT,
  p_user_id TEXT, 
  p_cart_total NUMERIC,
  p_product_ids TEXT[], 
  p_applied_coupon_codes TEXT[] DEFAULT '{}'
)
RETURNS JSON AS $$
DECLARE
  v_coupon RECORD;
  v_user_id UUID;
  v_user_usage_count INTEGER;
  v_discount NUMERIC;
  v_commission NUMERIC := 0;
BEGIN
  -- Convert p_user_id to UUID safely
  IF p_user_id IS NOT NULL AND p_user_id <> '' THEN
    BEGIN
      v_user_id := p_user_id::UUID;
    EXCEPTION WHEN OTHERS THEN
      v_user_id := NULL;
    END;
  END IF;

  -- Get coupon details
  SELECT * INTO v_coupon
  FROM coupons
  WHERE UPPER(code) = UPPER(p_code)
  AND status = 'active';

  -- Check if coupon exists
  IF v_coupon IS NULL THEN
    RETURN json_build_object('valid', false, 'error', 'Invalid coupon code');
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
  IF v_user_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_user_usage_count
    FROM coupon_usages
    WHERE coupon_id = v_coupon.id
    AND user_id = v_user_id;

    IF v_user_usage_count >= v_coupon.usage_per_user THEN
      RETURN json_build_object('valid', false, 'error', 'You have already used this coupon');
    END IF;
  END IF;

  -- Check minimum order amount
  IF p_cart_total < v_coupon.min_order_amount THEN
    RETURN json_build_object('valid', false, 'error', format('Minimum order amount is ₹%s', v_coupon.min_order_amount));
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
    'affiliate_id', v_coupon.affiliate_id,
    'commission_amount', v_commission
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. ROBUST APPLY FUNCTION
CREATE OR REPLACE FUNCTION public.apply_coupon_v2(
  p_coupon_id UUID,
  p_user_id UUID,
  p_order_id UUID,
  p_discount_amount NUMERIC,
  p_commission_amount NUMERIC DEFAULT 0,
  p_affiliate_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Insert usage record
  INSERT INTO coupon_usages (
    coupon_id, user_id, order_id, discount_amount, commission_amount, affiliate_id
  )
  VALUES (
    p_coupon_id, p_user_id, p_order_id, p_discount_amount, p_commission_amount, p_affiliate_id
  );

  -- Update coupon stats
  UPDATE coupons
  SET 
    total_usage_count = total_usage_count + 1,
    total_discount_given = total_discount_given + p_discount_amount,
    updated_at = NOW()
  WHERE id = p_coupon_id;

  -- Record commission for affiliate
  IF p_affiliate_id IS NOT NULL AND p_commission_amount > 0 THEN
    BEGIN
      INSERT INTO affiliate_orders (
        order_id, affiliate_id, user_id, order_total, commission_amount, commission_status
      )
      SELECT p_order_id, p_affiliate_id, p_user_id, total_amount, p_commission_amount, 'pending'
      FROM orders WHERE id = p_order_id
      ON CONFLICT (order_id, affiliate_id) DO UPDATE
      SET commission_amount = affiliate_orders.commission_amount + EXCLUDED.commission_amount;
    EXCEPTION WHEN OTHERS THEN
      -- Silently fail if table missing
    END;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION public.validate_coupon_v2 TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.apply_coupon_v2 TO anon, authenticated, service_role;
