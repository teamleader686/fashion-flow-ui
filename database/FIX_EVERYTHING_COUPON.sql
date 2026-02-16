-- ========================================================
-- 🏆 THE "FIX EVERYTHING" COUPON SCRIPT
-- ========================================================
-- Ye script 3 kaam karegi:
-- 1. Table mein missing columns add karegi.
-- 2. Purane bure Functions ko delete karegi.
-- 3. Naya working 'validate_coupon_v2' function banayegi.
-- ========================================================

-- STEP 1: Table sudharein (Add missing columns)
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS affiliate_user_id UUID;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS is_affiliate_coupon BOOLEAN DEFAULT FALSE;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS coupon_type TEXT DEFAULT 'normal';
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS commission_type TEXT;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS commission_value NUMERIC DEFAULT 0;

-- STEP 2: Purane functions ko saaf karein (Cleaning)
DROP FUNCTION IF EXISTS public.validate_coupon_v2(TEXT, UUID, DECIMAL, UUID[]);
DROP FUNCTION IF EXISTS public.validate_coupon_v2(TEXT, UUID, DECIMAL, UUID[], TEXT[]);
DROP FUNCTION IF EXISTS public.validate_coupon_v2(TEXT, TEXT, NUMERIC, TEXT[], TEXT[]);

-- STEP 3: Naya working function banayein
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
  IF v_coupon.is_affiliate_coupon AND v_coupon.affiliate_user_id IS NOT NULL THEN
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

-- STEP 4: Permissions dein
GRANT EXECUTE ON FUNCTION public.validate_coupon_v2 TO anon, authenticated, service_role;

-- STEP 5: Cache reload
NOTIFY pgrst, 'reload schema';

-- LAST STEP: Sab check karein
SELECT 'SUCCESS' as status, column_name 
FROM information_schema.columns 
WHERE table_name = 'coupons' AND column_name = 'affiliate_user_id';
