-- ============================================
-- STEP 4: Enable RLS and Create Policies
-- ============================================
-- Run this AFTER STEP_3_CREATE_FUNCTIONS_TRIGGERS.sql
-- This enables Row Level Security and creates all policies
-- ============================================

-- Enable RLS on all affiliate tables
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

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

-- Success message
DO $$ 
BEGIN
  RAISE NOTICE '✅ RLS enabled and all policies created successfully!';
  RAISE NOTICE '🎉 AFFILIATE MARKETING SYSTEM INSTALLATION COMPLETE!';
  RAISE NOTICE '📝 You can now create affiliates and start tracking referrals!';
END $$;
