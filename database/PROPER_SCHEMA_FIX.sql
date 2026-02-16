-- ========================================================
-- 🕵️‍♂️ DATABASE DIAGNOSTIC & REPAIR SCRIPT
-- ========================================================
-- This script fixes the "400 Bad Request" when inserting coupons.
-- It ensures all columns have the EXACT names and types expected 
-- by the frontend and the PostgREST API.
-- ========================================================

-- 1. FIX COLUMN NAMES AND TYPES
DO $$ 
BEGIN 
    -- Ensure columns exist with correct names and types
    
    -- affiliate_user_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'affiliate_id') THEN
        ALTER TABLE coupons RENAME COLUMN affiliate_id TO affiliate_user_id;
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'affiliate_user_id') THEN
        ALTER TABLE coupons ADD COLUMN affiliate_user_id UUID;
    END IF;

    -- is_affiliate_coupon
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'is_affiliate_coupon') THEN
        ALTER TABLE coupons ADD COLUMN is_affiliate_coupon BOOLEAN DEFAULT FALSE;
    END IF;

    -- coupon_type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'coupon_type') THEN
        ALTER TABLE coupons ADD COLUMN coupon_type TEXT DEFAULT 'normal';
    END IF;

    -- commission_type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'commission_type') THEN
        ALTER TABLE coupons ADD COLUMN commission_type TEXT;
    END IF;
    -- Ensure we allow 'fixed' and 'percentage'
    ALTER TABLE coupons DROP CONSTRAINT IF EXISTS coupons_commission_type_check;
    ALTER TABLE coupons ADD CONSTRAINT coupons_commission_type_check CHECK (commission_type IN ('percentage', 'fixed'));

    -- commission_value
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'commission_value') THEN
        ALTER TABLE coupons ADD COLUMN commission_value NUMERIC DEFAULT 0;
    END IF;

    -- Ensure applicable_ids is TEXT[] to match some frontend array formats
    ALTER TABLE coupons ALTER COLUMN applicable_ids TYPE TEXT[] USING applicable_ids::TEXT[];
    
    -- Ensure restricted_user_ids is UUID[] 
    ALTER TABLE coupons ALTER COLUMN restricted_user_ids TYPE UUID[] USING restricted_user_ids::UUID[];

END $$;

-- 2. REPAIR FOREIGN KEYS
DO $$
BEGIN
    ALTER TABLE coupons DROP CONSTRAINT IF EXISTS coupons_affiliate_id_fkey;
    ALTER TABLE coupons DROP CONSTRAINT IF EXISTS coupons_affiliate_user_id_fkey;
    
    -- Add reference back if affiliates table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'affiliates') THEN
        ALTER TABLE coupons ADD CONSTRAINT coupons_affiliate_user_id_fkey 
        FOREIGN KEY (affiliate_user_id) REFERENCES affiliates(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. FIX RPC FUNCTIONS (Updating signatures and logic)
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

-- 4. GRANT PERMISSIONS
GRANT ALL ON TABLE coupons TO authenticated, service_role;
GRANT ALL ON TABLE coupon_usages TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.validate_coupon_v2 TO anon, authenticated, service_role;

-- 🚀 IMPORTANT: AFTER RUNNING THIS, RELOAD SCHEMA CACHE IN SUPABASE SETTINGS!
