-- ============================================
-- FIX AFFILIATE API ACCESS - 404 Error Fix
-- ============================================
-- Yeh file API access enable karegi
-- 404 error fix ho jayega
-- ============================================

-- Drop existing policies and recreate with proper access
DROP POLICY IF EXISTS "Admin full access" ON affiliates;
DROP POLICY IF EXISTS "Affiliates view own" ON affiliates;
DROP POLICY IF EXISTS "Admin full access to affiliates" ON affiliates;
DROP POLICY IF EXISTS "Affiliates can view own data" ON affiliates;

-- Admin can do everything
CREATE POLICY "admin_all_affiliates"
ON affiliates
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Affiliates can view their own data
CREATE POLICY "affiliates_view_own"
ON affiliates
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Fix other tables too
DROP POLICY IF EXISTS "Anyone insert clicks" ON affiliate_clicks;
DROP POLICY IF EXISTS "Anyone can insert clicks" ON affiliate_clicks;

CREATE POLICY "public_insert_clicks"
ON affiliate_clicks
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Admin can view clicks
CREATE POLICY "admin_view_clicks"
ON affiliate_clicks
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Fix affiliate_orders policies
DROP POLICY IF EXISTS "Admin all orders" ON affiliate_orders;
DROP POLICY IF EXISTS "Admin can view all affiliate orders" ON affiliate_orders;

CREATE POLICY "admin_all_affiliate_orders"
ON affiliate_orders
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "affiliates_view_own_orders"
ON affiliate_orders
FOR SELECT
TO authenticated
USING (
  affiliate_id IN (
    SELECT id FROM affiliates WHERE user_id = auth.uid()
  )
);

-- Fix affiliate_commissions policies
DROP POLICY IF EXISTS "Admin all commissions" ON affiliate_commissions;
DROP POLICY IF EXISTS "Affiliates view commissions" ON affiliate_commissions;
DROP POLICY IF EXISTS "Admin can manage all commissions" ON affiliate_commissions;
DROP POLICY IF EXISTS "Affiliates can view own commissions" ON affiliate_commissions;

CREATE POLICY "admin_all_commissions"
ON affiliate_commissions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "affiliates_view_own_commissions"
ON affiliate_commissions
FOR SELECT
TO authenticated
USING (
  affiliate_id IN (
    SELECT id FROM affiliates WHERE user_id = auth.uid()
  )
);

-- Fix wallet_transactions policies
DROP POLICY IF EXISTS "Admin all transactions" ON wallet_transactions;
DROP POLICY IF EXISTS "Affiliates view transactions" ON wallet_transactions;
DROP POLICY IF EXISTS "Admin can view all wallet transactions" ON wallet_transactions;
DROP POLICY IF EXISTS "Affiliates can view own transactions" ON wallet_transactions;

CREATE POLICY "admin_all_wallet_transactions"
ON wallet_transactions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "affiliates_view_own_wallet"
ON wallet_transactions
FOR SELECT
TO authenticated
USING (
  affiliate_id IN (
    SELECT id FROM affiliates WHERE user_id = auth.uid()
  )
);

-- Fix affiliate_withdrawals policies
DROP POLICY IF EXISTS "admin_all_withdrawals" ON affiliate_withdrawals;
DROP POLICY IF EXISTS "affiliates_view_withdrawals" ON affiliate_withdrawals;
DROP POLICY IF EXISTS "affiliates_create_withdrawals" ON affiliate_withdrawals;

CREATE POLICY "admin_all_withdrawals"
ON affiliate_withdrawals
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "affiliates_view_own_withdrawals"
ON affiliate_withdrawals
FOR SELECT
TO authenticated
USING (
  affiliate_id IN (
    SELECT id FROM affiliates WHERE user_id = auth.uid()
  )
);

CREATE POLICY "affiliates_create_withdrawals"
ON affiliate_withdrawals
FOR INSERT
TO authenticated
WITH CHECK (
  affiliate_id IN (
    SELECT id FROM affiliates WHERE user_id = auth.uid()
  )
);

-- Verify RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename LIKE 'affiliate%'
ORDER BY tablename;

-- Verify policies exist
SELECT 
  tablename,
  policyname,
  cmd as operation
FROM pg_policies 
WHERE tablename LIKE 'affiliate%'
ORDER BY tablename, policyname;

-- Success message
SELECT '✅ API ACCESS FIXED!' as status;
SELECT 'Refresh your admin panel page' as action;
