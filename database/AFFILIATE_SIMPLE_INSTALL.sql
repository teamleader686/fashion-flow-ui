-- ============================================
-- AFFILIATE MARKETING - SIMPLE ONE-FILE INSTALL
-- ============================================
-- This is a simplified version that should work
-- Run this entire file at once
-- ============================================

-- PART 1: Add columns to existing tables
-- ============================================

-- Add to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS affiliate_id UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS referral_code TEXT;

-- Add to products table  
ALTER TABLE products ADD COLUMN IF NOT EXISTS affiliate_enabled BOOLEAN DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS affiliate_commission_type TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS affiliate_commission_value DECIMAL(10,2);

-- PART 2: Create affiliate tables
-- ============================================

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

CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  landing_page TEXT,
  clicked_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE,
  order_id UUID,
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
  processed_by UUID
);

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

-- PART 3: Create indexes
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

-- PART 4: Create functions
-- ============================================

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

CREATE OR REPLACE FUNCTION set_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL OR NEW.referral_code = '' THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION process_commission_payment(p_affiliate_order_id UUID)
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
    affiliate_id, transaction_type, amount,
    reference_type, reference_id, description
  ) VALUES (
    v_affiliate_id, 'credit', v_commission_amount,
    'commission', p_affiliate_order_id,
    'Commission for order #' || v_order_id
  );

  UPDATE affiliate_orders SET commission_status = 'paid' WHERE id = p_affiliate_order_id;
  UPDATE affiliate_commissions SET status = 'paid', paid_at = NOW() WHERE affiliate_order_id = p_affiliate_order_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- PART 5: Create triggers
-- ============================================

DROP TRIGGER IF EXISTS trigger_update_affiliate_stats ON affiliate_orders;
CREATE TRIGGER trigger_update_affiliate_stats
AFTER INSERT ON affiliate_orders
FOR EACH ROW EXECUTE FUNCTION update_affiliate_stats();

DROP TRIGGER IF EXISTS trigger_update_wallet_balance ON wallet_transactions;
CREATE TRIGGER trigger_update_wallet_balance
BEFORE INSERT ON wallet_transactions
FOR EACH ROW EXECUTE FUNCTION update_wallet_balance();

DROP TRIGGER IF EXISTS trigger_set_referral_code ON affiliates;
CREATE TRIGGER trigger_set_referral_code
BEFORE INSERT ON affiliates
FOR EACH ROW EXECUTE FUNCTION set_referral_code();

DROP TRIGGER IF EXISTS trigger_affiliates_updated_at ON affiliates;
CREATE TRIGGER trigger_affiliates_updated_at
BEFORE UPDATE ON affiliates
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- PART 6: Enable RLS
-- ============================================

ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- PART 7: Create policies
-- ============================================

DROP POLICY IF EXISTS "Admin full access to affiliates" ON affiliates;
CREATE POLICY "Admin full access to affiliates" ON affiliates FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "Affiliates can view own data" ON affiliates;
CREATE POLICY "Affiliates can view own data" ON affiliates FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can insert clicks" ON affiliate_clicks;
CREATE POLICY "Anyone can insert clicks" ON affiliate_clicks FOR INSERT TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can view all affiliate orders" ON affiliate_orders;
CREATE POLICY "Admin can view all affiliate orders" ON affiliate_orders FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "Admin can manage all commissions" ON affiliate_commissions;
CREATE POLICY "Admin can manage all commissions" ON affiliate_commissions FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "Affiliates can view own commissions" ON affiliate_commissions;
CREATE POLICY "Affiliates can view own commissions" ON affiliate_commissions FOR SELECT TO authenticated
USING (affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Admin can view all wallet transactions" ON wallet_transactions;
CREATE POLICY "Admin can view all wallet transactions" ON wallet_transactions FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "Affiliates can view own transactions" ON wallet_transactions;
CREATE POLICY "Affiliates can view own transactions" ON wallet_transactions FOR SELECT TO authenticated
USING (affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid()));

-- Success message
SELECT '✅ AFFILIATE MARKETING SYSTEM INSTALLED SUCCESSFULLY!' as status;
