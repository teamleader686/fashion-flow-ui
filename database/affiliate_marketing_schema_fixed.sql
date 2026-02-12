-- ============================================
-- AFFILIATE MARKETING SYSTEM - FIXED SCHEMA
-- ============================================
-- This version safely handles existing tables
-- Run this instead of the original schema
-- ============================================

-- STEP 1: Add columns to existing orders table (if needed)
-- ============================================

DO $$ 
BEGIN
    -- Add affiliate_id column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'affiliate_id'
    ) THEN
        ALTER TABLE orders ADD COLUMN affiliate_id UUID;
    END IF;

    -- Add referral_code column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'referral_code'
    ) THEN
        ALTER TABLE orders ADD COLUMN referral_code TEXT;
    END IF;
END $$;

-- STEP 2: Add columns to existing products table (if needed)
-- ============================================

DO $$ 
BEGIN
    -- Add affiliate_enabled column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'affiliate_enabled'
    ) THEN
        ALTER TABLE products ADD COLUMN affiliate_enabled BOOLEAN DEFAULT true;
    END IF;

    -- Add affiliate_commission_type column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'affiliate_commission_type'
    ) THEN
        ALTER TABLE products ADD COLUMN affiliate_commission_type TEXT CHECK (affiliate_commission_type IN ('flat', 'percentage', 'default'));
    END IF;

    -- Add affiliate_commission_value column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'affiliate_commission_value'
    ) THEN
        ALTER TABLE products ADD COLUMN affiliate_commission_value DECIMAL(10,2) CHECK (affiliate_commission_value >= 0);
    END IF;
END $$;

-- STEP 3: Create affiliate tables
-- ============================================

-- 1. AFFILIATES TABLE
CREATE TABLE IF NOT EXISTS affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- 2. AFFILIATE CLICKS TABLE
CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  landing_page TEXT,
  clicked_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. AFFILIATE ORDERS TABLE
CREATE TABLE IF NOT EXISTS affiliate_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  order_total DECIMAL(10,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  commission_status TEXT DEFAULT 'pending' CHECK (commission_status IN ('pending', 'approved', 'paid', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_id, affiliate_id)
);

-- 4. AFFILIATE COMMISSIONS TABLE
CREATE TABLE IF NOT EXISTS affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  affiliate_order_id UUID REFERENCES affiliate_orders(id) ON DELETE CASCADE,
  commission_type TEXT NOT NULL CHECK (commission_type IN ('flat', 'percentage')),
  commission_value DECIMAL(10,2) NOT NULL,
  order_amount DECIMAL(10,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. AFFILIATE WITHDRAWALS TABLE
CREATE TABLE IF NOT EXISTS affiliate_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL,
  payment_details JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
  admin_notes TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES auth.users(id)
);

-- 6. WALLET TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('credit', 'debit')),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  balance_before DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  reference_type TEXT CHECK (reference_type IN ('commission', 'withdrawal', 'adjustment', 'refund')),
  reference_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 4: Create indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_affiliates_referral_code ON affiliates(referral_code);
CREATE INDEX IF NOT EXISTS idx_affiliates_email ON affiliates(email);
CREATE INDEX IF NOT EXISTS idx_affiliates_status ON affiliates(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_affiliate_id ON affiliate_clicks(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_orders_affiliate_id ON affiliate_orders(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_orders_order_id ON affiliate_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate_id ON affiliate_commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_status ON affiliate_commissions(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_withdrawals_affiliate_id ON affiliate_withdrawals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_withdrawals_status ON affiliate_withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_affiliate_id ON wallet_transactions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_orders_affiliate_id ON orders(affiliate_id);

-- STEP 5: Create functions
-- ============================================

-- Function: Generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    code := 'REF' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
    SELECT EXISTS(SELECT 1 FROM affiliates WHERE referral_code = code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function: Update affiliate statistics
CREATE OR REPLACE FUNCTION update_affiliate_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE affiliates
    SET 
      total_orders = total_orders + 1,
      total_sales = total_sales + NEW.order_total,
      total_commission = total_commission + NEW.commission_amount,
      updated_at = NOW()
    WHERE id = NEW.affiliate_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Update wallet balance
CREATE OR REPLACE FUNCTION update_wallet_balance()
RETURNS TRIGGER AS $$
DECLARE
  current_balance DECIMAL(10,2);
BEGIN
  SELECT wallet_balance INTO current_balance
  FROM affiliates
  WHERE id = NEW.affiliate_id;

  NEW.balance_before := current_balance;

  IF NEW.transaction_type = 'credit' THEN
    NEW.balance_after := current_balance + NEW.amount;
  ELSE
    NEW.balance_after := current_balance - NEW.amount;
  END IF;

  UPDATE affiliates
  SET wallet_balance = NEW.balance_after,
      updated_at = NOW()
  WHERE id = NEW.affiliate_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Auto-generate referral code
CREATE OR REPLACE FUNCTION set_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL OR NEW.referral_code = '' THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Update timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate commission
CREATE OR REPLACE FUNCTION calculate_affiliate_commission(
  p_affiliate_id UUID,
  p_order_total DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
  v_commission_type TEXT;
  v_commission_value DECIMAL;
  v_commission_amount DECIMAL;
BEGIN
  SELECT commission_type, commission_value
  INTO v_commission_type, v_commission_value
  FROM affiliates
  WHERE id = p_affiliate_id AND status = 'active';

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  IF v_commission_type = 'percentage' THEN
    v_commission_amount := (p_order_total * v_commission_value) / 100;
  ELSE
    v_commission_amount := v_commission_value;
  END IF;

  RETURN v_commission_amount;
END;
$$ LANGUAGE plpgsql;

-- Function: Process commission payment
CREATE OR REPLACE FUNCTION process_commission_payment(
  p_affiliate_order_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_affiliate_id UUID;
  v_commission_amount DECIMAL;
  v_order_id UUID;
BEGIN
  SELECT affiliate_id, commission_amount, order_id
  INTO v_affiliate_id, v_commission_amount, v_order_id
  FROM affiliate_orders
  WHERE id = p_affiliate_order_id
  AND commission_status = 'approved';

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  INSERT INTO wallet_transactions (
    affiliate_id,
    transaction_type,
    amount,
    reference_type,
    reference_id,
    description
  ) VALUES (
    v_affiliate_id,
    'credit',
    v_commission_amount,
    'commission',
    p_affiliate_order_id,
    'Commission for order #' || v_order_id
  );

  UPDATE affiliate_orders
  SET commission_status = 'paid'
  WHERE id = p_affiliate_order_id;

  UPDATE affiliate_commissions
  SET status = 'paid', paid_at = NOW()
  WHERE affiliate_order_id = p_affiliate_order_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- STEP 6: Create triggers
-- ============================================

DROP TRIGGER IF EXISTS trigger_update_affiliate_stats ON affiliate_orders;
CREATE TRIGGER trigger_update_affiliate_stats
AFTER INSERT ON affiliate_orders
FOR EACH ROW
EXECUTE FUNCTION update_affiliate_stats();

DROP TRIGGER IF EXISTS trigger_update_wallet_balance ON wallet_transactions;
CREATE TRIGGER trigger_update_wallet_balance
BEFORE INSERT ON wallet_transactions
FOR EACH ROW
EXECUTE FUNCTION update_wallet_balance();

DROP TRIGGER IF EXISTS trigger_set_referral_code ON affiliates;
CREATE TRIGGER trigger_set_referral_code
BEFORE INSERT ON affiliates
FOR EACH ROW
EXECUTE FUNCTION set_referral_code();

DROP TRIGGER IF EXISTS trigger_affiliates_updated_at ON affiliates;
CREATE TRIGGER trigger_affiliates_updated_at
BEFORE UPDATE ON affiliates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- STEP 7: Enable RLS
-- ============================================

ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- STEP 8: Create RLS policies
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin full access to affiliates" ON affiliates;
DROP POLICY IF EXISTS "Affiliates can view own data" ON affiliates;
DROP POLICY IF EXISTS "Affiliates can update own data" ON affiliates;
DROP POLICY IF EXISTS "Admin can view all clicks" ON affiliate_clicks;
DROP POLICY IF EXISTS "Affiliates can view own clicks" ON affiliate_clicks;
DROP POLICY IF EXISTS "Anyone can insert clicks" ON affiliate_clicks;
DROP POLICY IF EXISTS "Admin can view all affiliate orders" ON affiliate_orders;
DROP POLICY IF EXISTS "Affiliates can view own orders" ON affiliate_orders;
DROP POLICY IF EXISTS "Admin can manage all commissions" ON affiliate_commissions;
DROP POLICY IF EXISTS "Affiliates can view own commissions" ON affiliate_commissions;
DROP POLICY IF EXISTS "Admin can manage all withdrawals" ON affiliate_withdrawals;
DROP POLICY IF EXISTS "Affiliates can view own withdrawals" ON affiliate_withdrawals;
DROP POLICY IF EXISTS "Affiliates can create withdrawal requests" ON affiliate_withdrawals;
DROP POLICY IF EXISTS "Admin can view all wallet transactions" ON wallet_transactions;
DROP POLICY IF EXISTS "Affiliates can view own transactions" ON wallet_transactions;

-- AFFILIATES POLICIES
CREATE POLICY "Admin full access to affiliates"
ON affiliates FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Affiliates can view own data"
ON affiliates FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Affiliates can update own data"
ON affiliates FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- AFFILIATE CLICKS POLICIES
CREATE POLICY "Admin can view all clicks"
ON affiliate_clicks FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Affiliates can view own clicks"
ON affiliate_clicks FOR SELECT
TO authenticated
USING (
  affiliate_id IN (
    SELECT id FROM affiliates WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Anyone can insert clicks"
ON affiliate_clicks FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- AFFILIATE ORDERS POLICIES
CREATE POLICY "Admin can view all affiliate orders"
ON affiliate_orders FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Affiliates can view own orders"
ON affiliate_orders FOR SELECT
TO authenticated
USING (
  affiliate_id IN (
    SELECT id FROM affiliates WHERE user_id = auth.uid()
  )
);

-- AFFILIATE COMMISSIONS POLICIES
CREATE POLICY "Admin can manage all commissions"
ON affiliate_commissions FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Affiliates can view own commissions"
ON affiliate_commissions FOR SELECT
TO authenticated
USING (
  affiliate_id IN (
    SELECT id FROM affiliates WHERE user_id = auth.uid()
  )
);

-- AFFILIATE WITHDRAWALS POLICIES
CREATE POLICY "Admin can manage all withdrawals"
ON affiliate_withdrawals FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Affiliates can view own withdrawals"
ON affiliate_withdrawals FOR SELECT
TO authenticated
USING (
  affiliate_id IN (
    SELECT id FROM affiliates WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Affiliates can create withdrawal requests"
ON affiliate_withdrawals FOR INSERT
TO authenticated
WITH CHECK (
  affiliate_id IN (
    SELECT id FROM affiliates WHERE user_id = auth.uid()
  )
);

-- WALLET TRANSACTIONS POLICIES
CREATE POLICY "Admin can view all wallet transactions"
ON wallet_transactions FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Affiliates can view own transactions"
ON wallet_transactions FOR SELECT
TO authenticated
USING (
  affiliate_id IN (
    SELECT id FROM affiliates WHERE user_id = auth.uid()
  )
);

-- STEP 9: Verify installation
-- ============================================

DO $$ 
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables 
  WHERE table_name IN (
    'affiliates',
    'affiliate_clicks',
    'affiliate_orders',
    'affiliate_commissions',
    'affiliate_withdrawals',
    'wallet_transactions'
  );
  
  IF table_count = 6 THEN
    RAISE NOTICE '✅ All 6 affiliate tables created successfully!';
  ELSE
    RAISE NOTICE '⚠️  Only % tables created. Expected 6.', table_count;
  END IF;
END $$;

-- ============================================
-- INSTALLATION COMPLETE
-- ============================================
