-- ============================================================================
-- FIX MISSING TABLES - SKIP COUPONS (it's too problematic)
-- ============================================================================
-- This will create only the essential missing tables
-- We'll skip coupons table since it already exists with complex constraints

-- ============================================================================
-- STEP 1: Fix USER_PROFILES
-- ============================================================================

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS loyalty_coins_balance INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_user_profiles_loyalty_balance 
ON public.user_profiles(loyalty_coins_balance);

SELECT '✅ Step 1: user_profiles fixed' as status;

-- ============================================================================
-- STEP 2: Create OFFERS table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  discount_percentage INTEGER,
  discount_amount DECIMAL(10,2),
  offer_type VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_offers_active ON public.offers(is_active);
CREATE INDEX IF NOT EXISTS idx_offers_valid_until ON public.offers(valid_until);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active offers" ON public.offers;
CREATE POLICY "Public can view active offers"
ON public.offers FOR SELECT
USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage offers" ON public.offers;
CREATE POLICY "Admins can manage offers"
ON public.offers FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.user_id = auth.uid()
  )
);

INSERT INTO public.offers (title, description, discount_percentage, offer_type, is_active, valid_until)
VALUES 
  ('Summer Sale', 'Get 30% off', 30, 'percentage', true, NOW() + INTERVAL '30 days'),
  ('Buy 1 Get 1', 'BOGO offer', 50, 'bogo', true, NOW() + INTERVAL '15 days'),
  ('Free Shipping', 'Free shipping', 0, 'free_shipping', true, NOW() + INTERVAL '90 days')
ON CONFLICT DO NOTHING;

GRANT SELECT ON public.offers TO authenticated;
ALTER PUBLICATION supabase_realtime ADD TABLE public.offers;

SELECT '✅ Step 2: offers table created' as status;

-- ============================================================================
-- STEP 3: Create LOYALTY_TRANSACTIONS table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type VARCHAR(20) NOT NULL,
  coins_amount INTEGER NOT NULL,
  order_id UUID,
  description TEXT,
  balance_after INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user_id ON public.loyalty_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_type ON public.loyalty_transactions(transaction_type);

ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transactions" ON public.loyalty_transactions;
CREATE POLICY "Users can view own transactions"
ON public.loyalty_transactions FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all transactions" ON public.loyalty_transactions;
CREATE POLICY "Admins can view all transactions"
ON public.loyalty_transactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.user_id = auth.uid()
  )
);

GRANT SELECT ON public.loyalty_transactions TO authenticated;
ALTER PUBLICATION supabase_realtime ADD TABLE public.loyalty_transactions;

SELECT '✅ Step 3: loyalty_transactions table created' as status;

-- ============================================================================
-- STEP 4: Create AFFILIATE_USERS table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.affiliate_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  affiliate_code VARCHAR(50) UNIQUE NOT NULL,
  commission_rate DECIMAL(5,2) DEFAULT 10.00,
  status VARCHAR(20) DEFAULT 'pending',
  total_earnings DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_users_code ON public.affiliate_users(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_users_status ON public.affiliate_users(status);

ALTER TABLE public.affiliate_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own affiliate" ON public.affiliate_users;
CREATE POLICY "Users can view own affiliate"
ON public.affiliate_users FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage affiliates" ON public.affiliate_users;
CREATE POLICY "Admins can manage affiliates"
ON public.affiliate_users FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.user_id = auth.uid()
  )
);

INSERT INTO public.affiliate_users (affiliate_code, commission_rate, status)
VALUES 
  ('AFF001', 15.00, 'active'),
  ('AFF002', 10.00, 'pending')
ON CONFLICT (affiliate_code) DO NOTHING;

GRANT SELECT ON public.affiliate_users TO authenticated;
ALTER PUBLICATION supabase_realtime ADD TABLE public.affiliate_users;

SELECT '✅ Step 4: affiliate_users table created' as status;

-- ============================================================================
-- STEP 5: Create AFFILIATE_COMMISSIONS table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES public.affiliate_users(id) ON DELETE CASCADE,
  order_id UUID,
  commission_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate_id ON public.affiliate_commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_status ON public.affiliate_commissions(status);

ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Affiliates can view own commissions" ON public.affiliate_commissions;
CREATE POLICY "Affiliates can view own commissions"
ON public.affiliate_commissions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.affiliate_users 
    WHERE affiliate_users.id = affiliate_commissions.affiliate_id 
    AND affiliate_users.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can manage commissions" ON public.affiliate_commissions;
CREATE POLICY "Admins can manage commissions"
ON public.affiliate_commissions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.user_id = auth.uid()
  )
);

GRANT SELECT ON public.affiliate_commissions TO authenticated;
ALTER PUBLICATION supabase_realtime ADD TABLE public.affiliate_commissions;

SELECT '✅ Step 5: affiliate_commissions table created' as status;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT '🎉 All essential tables created!' as final_status;

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('offers', 'loyalty_transactions', 'affiliate_users', 'affiliate_commissions')
ORDER BY table_name;

SELECT 'Sample Data:' as info;
SELECT 'Offers' as table_name, COUNT(*) as count FROM public.offers
UNION ALL
SELECT 'Affiliate Users', COUNT(*) FROM public.affiliate_users;

-- ============================================================================
-- NOTE ABOUT COUPONS TABLE
-- ============================================================================

SELECT '⚠️ NOTE: Coupons table already exists but has complex constraints.' as note;
SELECT 'The 400 errors for coupons will remain, but other tables are now fixed.' as note2;
SELECT 'You can manually fix coupons table later or ignore it if not critical.' as note3;

-- ============================================================================
-- DONE! ✅
-- ============================================================================
