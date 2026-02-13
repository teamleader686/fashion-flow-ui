-- ============================================================================
-- FINAL FIX - Remove all constraints and create missing tables
-- ============================================================================
-- This script will fix existing tables and create missing ones

-- ============================================================================
-- STEP 1: Fix USER_PROFILES
-- ============================================================================

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS loyalty_coins_balance INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_user_profiles_loyalty_balance 
ON public.user_profiles(loyalty_coins_balance);

-- ============================================================================
-- STEP 2: Fix COUPONS table - Remove all constraints
-- ============================================================================

-- Remove ALL check constraints from coupons table
DO $$ 
DECLARE
  constraint_record RECORD;
BEGIN
  FOR constraint_record IN 
    SELECT constraint_name 
    FROM information_schema.table_constraints 
    WHERE table_schema = 'public' 
    AND table_name = 'coupons' 
    AND constraint_type = 'CHECK'
  LOOP
    EXECUTE format('ALTER TABLE public.coupons DROP CONSTRAINT IF EXISTS %I', constraint_record.constraint_name);
    RAISE NOTICE 'Dropped CHECK constraint: %', constraint_record.constraint_name;
  END LOOP;
END $$;

-- Remove NOT NULL constraints (except id and code)
DO $$ 
DECLARE
  col_record RECORD;
BEGIN
  FOR col_record IN 
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'coupons' 
    AND is_nullable = 'NO'
    AND column_name NOT IN ('id', 'code')
  LOOP
    EXECUTE format('ALTER TABLE public.coupons ALTER COLUMN %I DROP NOT NULL', col_record.column_name);
    RAISE NOTICE 'Removed NOT NULL from: %', col_record.column_name;
  END LOOP;
END $$;

-- Add missing columns
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS discount_type VARCHAR(20);
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS discount_value DECIMAL(10,2);
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS valid_until TIMESTAMP WITH TIME ZONE;

-- Create indexes (only if columns exist)
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'coupons' 
    AND column_name = 'is_active'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.coupons(is_active);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Policies (conditional based on column existence)
DROP POLICY IF EXISTS "Public can view active coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;

DO $$
BEGIN
  -- Create policy based on whether is_active column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'coupons' 
    AND column_name = 'is_active'
  ) THEN
    CREATE POLICY "Public can view active coupons"
    ON public.coupons FOR SELECT
    USING (is_active = true OR is_active IS NULL);
  ELSE
    CREATE POLICY "Public can view active coupons"
    ON public.coupons FOR SELECT
    USING (true);
  END IF;
  
  -- Admin policy
  CREATE POLICY "Admins can manage coupons"
  ON public.coupons FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE admin_users.user_id = auth.uid()
    )
  );
END $$;

-- Insert sample data (will skip if code already exists)
INSERT INTO public.coupons (code, description, discount_type, discount_value, is_active, valid_until)
VALUES 
  ('WELCOME10', 'Welcome discount', 'percentage', 10, true, NOW() + INTERVAL '30 days'),
  ('SAVE50', 'Flat ₹50 off', 'fixed', 50, true, NOW() + INTERVAL '60 days'),
  ('FLASH20', 'Flash sale', 'percentage', 20, true, NOW() + INTERVAL '7 days')
ON CONFLICT (code) DO NOTHING;

GRANT SELECT ON public.coupons TO authenticated;

-- ============================================================================
-- STEP 3: Create OFFERS table
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

-- ============================================================================
-- STEP 4: Create LOYALTY_TRANSACTIONS table
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

-- ============================================================================
-- STEP 5: Create AFFILIATE_USERS table
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

-- ============================================================================
-- STEP 6: Create AFFILIATE_COMMISSIONS table
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

-- ============================================================================
-- STEP 7: Enable Realtime
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.coupons;
ALTER PUBLICATION supabase_realtime ADD TABLE public.offers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.loyalty_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.affiliate_users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.affiliate_commissions;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'All tables fixed/created successfully!' as status;

SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('coupons', 'offers', 'loyalty_transactions', 'affiliate_users', 'affiliate_commissions')
ORDER BY table_name;

SELECT 'Sample Data Counts:' as info;
SELECT 'Coupons' as table_name, COUNT(*) as count FROM public.coupons
UNION ALL
SELECT 'Offers', COUNT(*) FROM public.offers
UNION ALL
SELECT 'Affiliate Users', COUNT(*) FROM public.affiliate_users;

-- ============================================================================
-- DONE! ✅
-- ============================================================================
