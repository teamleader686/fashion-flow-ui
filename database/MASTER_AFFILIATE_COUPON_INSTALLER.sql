-- 0. PROJECT CORE TABLES (Ensuring base tables exist for references)
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    admin_level TEXT DEFAULT 'admin',
    permissions JSONB DEFAULT '{"products": true, "orders": true, "users": true, "settings": true}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1. BASE COUPON SYSTEM
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('flat', 'percentage')),
  value DECIMAL(10, 2) NOT NULL CHECK (value > 0),
  min_order_amount DECIMAL(10, 2) DEFAULT 0,
  max_discount DECIMAL(10, 2),
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expiry_date TIMESTAMPTZ NOT NULL,
  usage_limit INTEGER DEFAULT NULL,
  usage_per_user INTEGER DEFAULT 1,
  applicable_type TEXT NOT NULL DEFAULT 'all' CHECK (applicable_type IN ('all', 'products', 'categories')),
  applicable_ids TEXT[],
  user_restriction TEXT NOT NULL DEFAULT 'all' CHECK (user_restriction IN ('all', 'new', 'specific')),
  restricted_user_ids UUID[],
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  total_usage_count INTEGER DEFAULT 0,
  total_discount_given DECIMAL(10, 2) DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Affiliate Updates
  is_affiliate_coupon BOOLEAN DEFAULT FALSE,
  affiliate_user_id UUID,
  coupon_type TEXT DEFAULT 'normal' CHECK (coupon_type IN ('normal', 'affiliate_tracking', 'affiliate_discount')),
  commission_type TEXT CHECK (commission_type IN ('percentage', 'fixed')),
  commission_value NUMERIC DEFAULT 0
);

CREATE TABLE IF NOT EXISTS coupon_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  order_id UUID,
  discount_amount DECIMAL(10, 2) NOT NULL,
  commission_amount NUMERIC DEFAULT 0,
  affiliate_user_id UUID,
  used_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. AFFILIATE SYSTEM
CREATE TABLE IF NOT EXISTS affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  mobile TEXT UNIQUE NOT NULL,
  referral_code TEXT UNIQUE NOT NULL,
  commission_type TEXT NOT NULL CHECK (commission_type IN ('flat', 'percentage')),
  commission_value DECIMAL(10,2) NOT NULL CHECK (commission_value >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  wallet_balance DECIMAL(10,2) DEFAULT 0 CHECK (wallet_balance >= 0),
  total_clicks INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_sales DECIMAL(10,2) DEFAULT 0,
  total_commission DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing references to coupons
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'coupons_affiliate_user_id_fkey') THEN
        ALTER TABLE coupons ADD CONSTRAINT coupons_affiliate_user_id_fkey FOREIGN KEY (affiliate_user_id) REFERENCES affiliates(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'coupon_usages_affiliate_user_id_fkey') THEN
        ALTER TABLE coupon_usages ADD CONSTRAINT coupon_usages_affiliate_user_id_fkey FOREIGN KEY (affiliate_user_id) REFERENCES affiliates(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. AFFILIATE ORDERS & TRACKING
CREATE TABLE IF NOT EXISTS affiliate_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID,
  affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE,
  user_id UUID,
  order_total DECIMAL(10,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  commission_status TEXT DEFAULT 'pending' CHECK (commission_status IN ('pending', 'approved', 'paid', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_id, affiliate_id)
);

CREATE TABLE IF NOT EXISTS affiliate_commission_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  min_order_amount NUMERIC DEFAULT 0,
  commission_type TEXT CHECK (commission_type IN ('percentage', 'fixed')),
  commission_value NUMERIC NOT NULL,
  product_id UUID,
  category_id UUID,
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS affiliate_wallet (
  affiliate_id UUID PRIMARY KEY REFERENCES affiliates(id) ON DELETE CASCADE,
  balance NUMERIC DEFAULT 0,
  total_earned NUMERIC DEFAULT 0,
  total_withdrawn NUMERIC DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. POWERFUL VALIDATION FUNCTIONS
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
    coupon_id, user_id, order_id, discount_amount, commission_amount, affiliate_user_id
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
    INSERT INTO affiliate_orders (
      order_id, affiliate_id, user_id, order_total, commission_amount, commission_status
    )
    SELECT p_order_id, p_affiliate_id, p_user_id, total_amount, p_commission_amount, 'pending'
    FROM orders WHERE id = p_order_id
    ON CONFLICT (order_id, affiliate_id) DO UPDATE
    SET commission_amount = affiliate_orders.commission_amount + EXCLUDED.commission_amount;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. TRIGGER FOR WALLET SYNC
CREATE OR REPLACE FUNCTION sync_affiliate_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO affiliate_wallet (affiliate_id, balance)
  VALUES (NEW.id, NEW.wallet_balance)
  ON CONFLICT (affiliate_id) DO UPDATE
  SET balance = EXCLUDED.balance, updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_affiliate_wallet ON affiliates;
CREATE TRIGGER trigger_sync_affiliate_wallet
AFTER INSERT OR UPDATE OF wallet_balance ON affiliates
FOR EACH ROW EXECUTE FUNCTION sync_affiliate_wallet();

-- 6. RLS POLICIES (Admin & User Access)
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_wallet ENABLE ROW LEVEL SECURITY;

-- ADMIN POLICIES (Full Access)
DO $$ 
BEGIN 
    -- Generic admin policy for all tables
    EXECUTE 'CREATE POLICY "Admin full access" ON coupons FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.is_active = true))';
    EXECUTE 'CREATE POLICY "Admin full access" ON coupon_usages FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.is_active = true))';
    EXECUTE 'CREATE POLICY "Admin full access" ON affiliates FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.is_active = true))';
    EXECUTE 'CREATE POLICY "Admin full access" ON affiliate_orders FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.is_active = true))';
    EXECUTE 'CREATE POLICY "Admin full access" ON affiliate_commission_rules FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.is_active = true))';
    EXECUTE 'CREATE POLICY "Admin full access" ON affiliate_wallet FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid() AND admin_users.is_active = true))';
EXCEPTION WHEN duplicate_object THEN 
END $$;

-- USER POLICIES (Restricted)
DO $$ 
BEGIN 
    EXECUTE 'CREATE POLICY "Users can view active coupons" ON coupons FOR SELECT TO authenticated USING (status = ''active'' AND NOW() BETWEEN start_date AND expiry_date)';
    EXECUTE 'CREATE POLICY "Users can view their own usages" ON coupon_usages FOR SELECT TO authenticated USING (user_id = auth.uid())';
    EXECUTE 'CREATE POLICY "Affiliates can view own profile" ON affiliates FOR SELECT TO authenticated USING (user_id = auth.uid())';
EXCEPTION WHEN duplicate_object THEN 
END $$;
