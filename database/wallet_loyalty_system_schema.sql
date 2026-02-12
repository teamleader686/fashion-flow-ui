-- ============================================
-- 💰 WALLET + LOYALTY COINS SYSTEM SCHEMA
-- ============================================

-- STEP 1: Drop existing tables if any
DROP TABLE IF EXISTS loyalty_transactions CASCADE;
DROP TABLE IF EXISTS wallet_transactions CASCADE;
DROP TABLE IF EXISTS wallets CASCADE;
DROP FUNCTION IF EXISTS credit_wallet CASCADE;
DROP FUNCTION IF EXISTS debit_wallet CASCADE;
DROP FUNCTION IF EXISTS credit_loyalty_coins CASCADE;
DROP FUNCTION IF EXISTS redeem_loyalty_coins CASCADE;
DROP FUNCTION IF EXISTS get_wallet_balance CASCADE;

-- STEP 2: Create WALLETS table
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_balance DECIMAL(10, 2) DEFAULT 0 CHECK (total_balance >= 0),
  loyalty_balance INTEGER DEFAULT 0 CHECK (loyalty_balance >= 0),
  affiliate_balance DECIMAL(10, 2) DEFAULT 0 CHECK (affiliate_balance >= 0),
  refund_balance DECIMAL(10, 2) DEFAULT 0 CHECK (refund_balance >= 0),
  promotional_balance DECIMAL(10, 2) DEFAULT 0 CHECK (promotional_balance >= 0),
  frozen BOOLEAN DEFAULT false,
  frozen_reason TEXT,
  frozen_at TIMESTAMPTZ,
  frozen_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 3: Create WALLET_TRANSACTIONS table
CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  source TEXT NOT NULL CHECK (source IN ('order', 'refund', 'affiliate', 'instagram', 'manual', 'promotional', 'expiry', 'reversal')),
  wallet_type TEXT NOT NULL CHECK (wallet_type IN ('loyalty', 'affiliate', 'refund', 'promotional')),
  reference_id UUID,
  amount DECIMAL(10, 2) NOT NULL,
  balance_before DECIMAL(10, 2) NOT NULL,
  balance_after DECIMAL(10, 2) NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 4: Create LOYALTY_TRANSACTIONS table
CREATE TABLE loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id),
  coins INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earn', 'redeem', 'expire', 'manual', 'reversal')),
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  description TEXT,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 5: Add wallet columns to ORDERS table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS wallet_used DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coins_used INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coins_earned INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coins_credited BOOLEAN DEFAULT false;

-- STEP 6: Add loyalty columns to PRODUCTS table
ALTER TABLE products ADD COLUMN IF NOT EXISTS earn_loyalty_coins INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS redeem_loyalty_coins_required INTEGER DEFAULT 0;

-- STEP 7: Create indexes
CREATE INDEX idx_wallets_user ON wallets(user_id);
CREATE INDEX idx_wallet_transactions_user ON wallet_transactions(user_id);
CREATE INDEX idx_wallet_transactions_wallet ON wallet_transactions(wallet_id);
CREATE INDEX idx_wallet_transactions_reference ON wallet_transactions(reference_id);
CREATE INDEX idx_wallet_transactions_created ON wallet_transactions(created_at DESC);
CREATE INDEX idx_loyalty_transactions_user ON loyalty_transactions(user_id);
CREATE INDEX idx_loyalty_transactions_order ON loyalty_transactions(order_id);
CREATE INDEX idx_loyalty_transactions_created ON loyalty_transactions(created_at DESC);

-- STEP 8: Function to create wallet for new user
CREATE OR REPLACE FUNCTION create_wallet_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wallets (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_create_wallet_for_user
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_wallet_for_user();

-- STEP 9: Function to credit wallet
CREATE OR REPLACE FUNCTION credit_wallet(
  p_user_id UUID,
  p_wallet_type TEXT,
  p_amount DECIMAL,
  p_source TEXT,
  p_reference_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_wallet_id UUID;
  v_balance_before DECIMAL;
  v_balance_after DECIMAL;
  v_transaction_id UUID;
  v_frozen BOOLEAN;
BEGIN
  -- Get wallet and check if frozen
  SELECT id, frozen INTO v_wallet_id, v_frozen
  FROM wallets
  WHERE user_id = p_user_id;

  IF v_frozen THEN
    RAISE EXCEPTION 'Wallet is frozen';
  END IF;

  -- Get current balance
  CASE p_wallet_type
    WHEN 'loyalty' THEN
      SELECT loyalty_balance INTO v_balance_before FROM wallets WHERE id = v_wallet_id;
    WHEN 'affiliate' THEN
      SELECT affiliate_balance INTO v_balance_before FROM wallets WHERE id = v_wallet_id;
    WHEN 'refund' THEN
      SELECT refund_balance INTO v_balance_before FROM wallets WHERE id = v_wallet_id;
    WHEN 'promotional' THEN
      SELECT promotional_balance INTO v_balance_before FROM wallets WHERE id = v_wallet_id;
  END CASE;

  v_balance_after := v_balance_before + p_amount;

  -- Update wallet balance
  CASE p_wallet_type
    WHEN 'loyalty' THEN
      UPDATE wallets SET loyalty_balance = v_balance_after, updated_at = NOW() WHERE id = v_wallet_id;
    WHEN 'affiliate' THEN
      UPDATE wallets SET affiliate_balance = v_balance_after, updated_at = NOW() WHERE id = v_wallet_id;
    WHEN 'refund' THEN
      UPDATE wallets SET refund_balance = v_balance_after, updated_at = NOW() WHERE id = v_wallet_id;
    WHEN 'promotional' THEN
      UPDATE wallets SET promotional_balance = v_balance_after, updated_at = NOW() WHERE id = v_wallet_id;
  END CASE;

  -- Update total balance
  UPDATE wallets
  SET total_balance = loyalty_balance + affiliate_balance + refund_balance + promotional_balance
  WHERE id = v_wallet_id;

  -- Create transaction record
  INSERT INTO wallet_transactions (
    user_id, wallet_id, type, source, wallet_type, reference_id, amount,
    balance_before, balance_after, description, created_by
  ) VALUES (
    p_user_id, v_wallet_id, 'credit', p_source, p_wallet_type, p_reference_id, p_amount,
    v_balance_before, v_balance_after, p_description, p_created_by
  ) RETURNING id INTO v_transaction_id;

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 10: Function to debit wallet
CREATE OR REPLACE FUNCTION debit_wallet(
  p_user_id UUID,
  p_wallet_type TEXT,
  p_amount DECIMAL,
  p_source TEXT,
  p_reference_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_wallet_id UUID;
  v_balance_before DECIMAL;
  v_balance_after DECIMAL;
  v_transaction_id UUID;
  v_frozen BOOLEAN;
BEGIN
  -- Get wallet and check if frozen
  SELECT id, frozen INTO v_wallet_id, v_frozen
  FROM wallets
  WHERE user_id = p_user_id;

  IF v_frozen THEN
    RAISE EXCEPTION 'Wallet is frozen';
  END IF;

  -- Get current balance
  CASE p_wallet_type
    WHEN 'loyalty' THEN
      SELECT loyalty_balance INTO v_balance_before FROM wallets WHERE id = v_wallet_id;
    WHEN 'affiliate' THEN
      SELECT affiliate_balance INTO v_balance_before FROM wallets WHERE id = v_wallet_id;
    WHEN 'refund' THEN
      SELECT refund_balance INTO v_balance_before FROM wallets WHERE id = v_wallet_id;
    WHEN 'promotional' THEN
      SELECT promotional_balance INTO v_balance_before FROM wallets WHERE id = v_wallet_id;
  END CASE;

  -- Check sufficient balance
  IF v_balance_before < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  v_balance_after := v_balance_before - p_amount;

  -- Update wallet balance
  CASE p_wallet_type
    WHEN 'loyalty' THEN
      UPDATE wallets SET loyalty_balance = v_balance_after, updated_at = NOW() WHERE id = v_wallet_id;
    WHEN 'affiliate' THEN
      UPDATE wallets SET affiliate_balance = v_balance_after, updated_at = NOW() WHERE id = v_wallet_id;
    WHEN 'refund' THEN
      UPDATE wallets SET refund_balance = v_balance_after, updated_at = NOW() WHERE id = v_wallet_id;
    WHEN 'promotional' THEN
      UPDATE wallets SET promotional_balance = v_balance_after, updated_at = NOW() WHERE id = v_wallet_id;
  END CASE;

  -- Update total balance
  UPDATE wallets
  SET total_balance = loyalty_balance + affiliate_balance + refund_balance + promotional_balance
  WHERE id = v_wallet_id;

  -- Create transaction record
  INSERT INTO wallet_transactions (
    user_id, wallet_id, type, source, wallet_type, reference_id, amount,
    balance_before, balance_after, description, created_by
  ) VALUES (
    p_user_id, v_wallet_id, 'debit', p_source, p_wallet_type, p_reference_id, p_amount,
    v_balance_before, v_balance_after, p_description, p_created_by
  ) RETURNING id INTO v_transaction_id;

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 11: Function to credit loyalty coins
CREATE OR REPLACE FUNCTION credit_loyalty_coins(
  p_user_id UUID,
  p_order_id UUID,
  p_coins INTEGER,
  p_type TEXT DEFAULT 'earn',
  p_description TEXT DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_balance_before INTEGER;
  v_balance_after INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Get current balance
  SELECT loyalty_balance INTO v_balance_before
  FROM wallets
  WHERE user_id = p_user_id;

  v_balance_after := v_balance_before + p_coins;

  -- Update wallet
  UPDATE wallets
  SET loyalty_balance = v_balance_after, updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Create loyalty transaction
  INSERT INTO loyalty_transactions (
    user_id, order_id, coins, type, balance_before, balance_after, description, expires_at
  ) VALUES (
    p_user_id, p_order_id, p_coins, p_type, v_balance_before, v_balance_after, p_description, p_expires_at
  ) RETURNING id INTO v_transaction_id;

  -- Also create wallet transaction
  PERFORM credit_wallet(
    p_user_id, 'loyalty', p_coins::DECIMAL, 'order', p_order_id, p_description, NULL
  );

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 12: Function to redeem loyalty coins
CREATE OR REPLACE FUNCTION redeem_loyalty_coins(
  p_user_id UUID,
  p_order_id UUID,
  p_coins INTEGER,
  p_description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_balance_before INTEGER;
  v_balance_after INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Get current balance
  SELECT loyalty_balance INTO v_balance_before
  FROM wallets
  WHERE user_id = p_user_id;

  -- Check sufficient coins
  IF v_balance_before < p_coins THEN
    RAISE EXCEPTION 'Insufficient loyalty coins';
  END IF;

  v_balance_after := v_balance_before - p_coins;

  -- Update wallet
  UPDATE wallets
  SET loyalty_balance = v_balance_after, updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Create loyalty transaction
  INSERT INTO loyalty_transactions (
    user_id, order_id, coins, type, balance_before, balance_after, description
  ) VALUES (
    p_user_id, p_order_id, p_coins, 'redeem', v_balance_before, v_balance_after, p_description
  ) RETURNING id INTO v_transaction_id;

  -- Also create wallet transaction
  PERFORM debit_wallet(
    p_user_id, 'loyalty', p_coins::DECIMAL, 'order', p_order_id, p_description, NULL
  );

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 13: Function to get wallet balance
CREATE OR REPLACE FUNCTION get_wallet_balance(p_user_id UUID)
RETURNS TABLE(
  total_balance DECIMAL,
  loyalty_balance INTEGER,
  affiliate_balance DECIMAL,
  refund_balance DECIMAL,
  promotional_balance DECIMAL,
  frozen BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.total_balance,
    w.loyalty_balance,
    w.affiliate_balance,
    w.refund_balance,
    w.promotional_balance,
    w.frozen
  FROM wallets w
  WHERE w.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 14: Trigger to credit coins on order delivery
CREATE OR REPLACE FUNCTION credit_coins_on_delivery()
RETURNS TRIGGER AS $$
DECLARE
  v_total_coins INTEGER := 0;
  v_item RECORD;
BEGIN
  -- Only credit if status changed to delivered and not already credited
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' AND NOT NEW.coins_credited THEN
    -- Calculate total coins from order items
    FOR v_item IN
      SELECT oi.product_id, oi.quantity, p.earn_loyalty_coins
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = NEW.id
    LOOP
      v_total_coins := v_total_coins + (v_item.quantity * v_item.earn_loyalty_coins);
    END LOOP;

    -- Credit coins if any
    IF v_total_coins > 0 THEN
      PERFORM credit_loyalty_coins(
        NEW.user_id,
        NEW.id,
        v_total_coins,
        'earn',
        'Coins earned from order ' || NEW.id::TEXT,
        NOW() + INTERVAL '365 days'
      );

      -- Mark as credited
      NEW.coins_earned := v_total_coins;
      NEW.coins_credited := true;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_credit_coins_on_delivery
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION credit_coins_on_delivery();

-- STEP 15: Enable RLS
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- STEP 16: RLS Policies for wallets
CREATE POLICY "Users can view own wallet"
ON wallets FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admin can view all wallets"
ON wallets FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
    AND admin_users.is_active = true
  )
);

CREATE POLICY "Admin can update wallets"
ON wallets FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
    AND admin_users.is_active = true
  )
);

-- STEP 17: RLS Policies for wallet_transactions
CREATE POLICY "Users can view own transactions"
ON wallet_transactions FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admin can view all transactions"
ON wallet_transactions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
    AND admin_users.is_active = true
  )
);

-- STEP 18: RLS Policies for loyalty_transactions
CREATE POLICY "Users can view own loyalty transactions"
ON loyalty_transactions FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admin can view all loyalty transactions"
ON loyalty_transactions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
    AND admin_users.is_active = true
  )
);

-- ============================================
-- ✅ WALLET + LOYALTY SYSTEM COMPLETE!
-- ============================================
