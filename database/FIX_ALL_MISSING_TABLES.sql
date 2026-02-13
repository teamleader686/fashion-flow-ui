-- ============================================================================
-- FIX ALL MISSING TABLES - COMPLETE SOLUTION
-- ============================================================================
-- Run this script in Supabase SQL Editor to fix all 400 errors
-- This creates ALL missing tables needed for Store Management

-- ============================================================================
-- 1. FIX USER_PROFILES TABLE - Add loyalty_coins_balance column
-- ============================================================================

-- Add loyalty_coins_balance column if it doesn't exist
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS loyalty_coins_balance INTEGER DEFAULT 0;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_loyalty_balance 
ON public.user_profiles(loyalty_coins_balance);

-- ============================================================================
-- 2. CREATE AFFILIATE_USERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.affiliate_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  affiliate_code VARCHAR(50) UNIQUE NOT NULL,
  commission_rate DECIMAL(5,2) DEFAULT 10.00,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'inactive')),
  total_earnings DECIMAL(10,2) DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  payment_method VARCHAR(50),
  payment_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_affiliate_users_code ON public.affiliate_users(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_users_status ON public.affiliate_users(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_users_user_id ON public.affiliate_users(user_id);

-- Enable RLS
ALTER TABLE public.affiliate_users ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view own affiliate profile" ON public.affiliate_users;
CREATE POLICY "Users can view own affiliate profile"
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

-- ============================================================================
-- 3. CREATE COUPONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  min_purchase_amount DECIMAL(10,2) DEFAULT 0,
  max_discount_amount DECIMAL(10,2),
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  per_user_limit INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_until ON public.coupons(valid_until);

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public can view active coupons" ON public.coupons;
CREATE POLICY "Public can view active coupons"
ON public.coupons FOR SELECT
USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
CREATE POLICY "Admins can manage coupons"
ON public.coupons FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.user_id = auth.uid()
  )
);

-- ============================================================================
-- 4. CREATE OFFERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  discount_percentage INTEGER CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  discount_amount DECIMAL(10,2),
  offer_type VARCHAR(20) CHECK (offer_type IN ('percentage', 'fixed', 'bogo', 'free_shipping')),
  applicable_to VARCHAR(20) DEFAULT 'all' CHECK (applicable_to IN ('all', 'category', 'product')),
  category_id UUID,
  product_id UUID,
  min_purchase_amount DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  display_order INTEGER DEFAULT 0,
  banner_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_offers_active ON public.offers(is_active);
CREATE INDEX IF NOT EXISTS idx_offers_valid_until ON public.offers(valid_until);
CREATE INDEX IF NOT EXISTS idx_offers_display_order ON public.offers(display_order);

-- Enable RLS
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- Policies
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

-- ============================================================================
-- 5. CREATE LOYALTY_TRANSACTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('earned', 'redeemed', 'expired', 'refunded')),
  coins_amount INTEGER NOT NULL,
  order_id UUID,
  description TEXT,
  balance_after INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user_id ON public.loyalty_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_type ON public.loyalty_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_created_at ON public.loyalty_transactions(created_at DESC);

-- Enable RLS
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- Policies
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

-- ============================================================================
-- 6. CREATE AFFILIATE_COMMISSIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES public.affiliate_users(id) ON DELETE CASCADE,
  order_id UUID,
  commission_amount DECIMAL(10,2) NOT NULL,
  commission_percentage DECIMAL(5,2),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  paid_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate_id ON public.affiliate_commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_status ON public.affiliate_commissions(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_created_at ON public.affiliate_commissions(created_at DESC);

-- Enable RLS
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;

-- Policies
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

-- ============================================================================
-- 7. FIX INSTAGRAM_CAMPAIGNS TABLE (add missing columns if table exists)
-- ============================================================================

-- Create table if it doesn't exist with all columns
CREATE TABLE IF NOT EXISTS public.instagram_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_name VARCHAR(255) NOT NULL,
  influencer_name VARCHAR(255),
  influencer_handle VARCHAR(100),
  campaign_type VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active',
  budget DECIMAL(10,2),
  spent_amount DECIMAL(10,2) DEFAULT 0,
  reach INTEGER DEFAULT 0,
  engagement INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if table already exists (will be skipped if table was just created)
DO $$ 
BEGIN
  -- Add columns one by one with error handling
  ALTER TABLE public.instagram_campaigns ADD COLUMN IF NOT EXISTS influencer_name VARCHAR(255);
  ALTER TABLE public.instagram_campaigns ADD COLUMN IF NOT EXISTS influencer_handle VARCHAR(100);
  ALTER TABLE public.instagram_campaigns ADD COLUMN IF NOT EXISTS campaign_type VARCHAR(50);
  ALTER TABLE public.instagram_campaigns ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
  ALTER TABLE public.instagram_campaigns ADD COLUMN IF NOT EXISTS budget DECIMAL(10,2);
  ALTER TABLE public.instagram_campaigns ADD COLUMN IF NOT EXISTS spent_amount DECIMAL(10,2) DEFAULT 0;
  ALTER TABLE public.instagram_campaigns ADD COLUMN IF NOT EXISTS reach INTEGER DEFAULT 0;
  ALTER TABLE public.instagram_campaigns ADD COLUMN IF NOT EXISTS engagement INTEGER DEFAULT 0;
  ALTER TABLE public.instagram_campaigns ADD COLUMN IF NOT EXISTS conversions INTEGER DEFAULT 0;
  ALTER TABLE public.instagram_campaigns ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE;
  ALTER TABLE public.instagram_campaigns ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE;
  ALTER TABLE public.instagram_campaigns ADD COLUMN IF NOT EXISTS notes TEXT;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Some columns may already exist: %', SQLERRM;
END $$;

-- Indexes (create after columns are added)
CREATE INDEX IF NOT EXISTS idx_instagram_campaigns_status ON public.instagram_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_instagram_campaigns_start_date ON public.instagram_campaigns(start_date);

-- Enable RLS
ALTER TABLE public.instagram_campaigns ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Admins can manage campaigns" ON public.instagram_campaigns;
CREATE POLICY "Admins can manage campaigns"
ON public.instagram_campaigns FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.user_id = auth.uid()
  )
);

-- ============================================================================
-- 8. INSERT SAMPLE DATA
-- ============================================================================

-- Sample Coupons
INSERT INTO public.coupons (code, description, discount_type, discount_value, usage_limit, is_active, valid_until)
VALUES 
  ('WELCOME10', 'Welcome discount for new users', 'percentage', 10, 100, true, NOW() + INTERVAL '30 days'),
  ('SAVE50', 'Flat ₹50 off on orders above ₹500', 'fixed', 50, 200, true, NOW() + INTERVAL '60 days'),
  ('FLASH20', 'Flash sale - 20% off', 'percentage', 20, 50, true, NOW() + INTERVAL '7 days')
ON CONFLICT (code) DO NOTHING;

-- Sample Offers
INSERT INTO public.offers (title, description, discount_percentage, offer_type, is_active, valid_until)
VALUES 
  ('Summer Sale', 'Get 30% off on all summer collection', 30, 'percentage', true, NOW() + INTERVAL '30 days'),
  ('Buy 1 Get 1', 'Buy one get one free on selected items', 50, 'bogo', true, NOW() + INTERVAL '15 days'),
  ('Free Shipping', 'Free shipping on orders above ₹999', 0, 'free_shipping', true, NOW() + INTERVAL '90 days')
ON CONFLICT DO NOTHING;

-- Sample Affiliate User
INSERT INTO public.affiliate_users (affiliate_code, commission_rate, status)
VALUES 
  ('AFF001', 15.00, 'active'),
  ('AFF002', 10.00, 'pending')
ON CONFLICT (affiliate_code) DO NOTHING;

-- ============================================================================
-- 9. GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON public.coupons TO authenticated;
GRANT SELECT ON public.offers TO authenticated;
GRANT SELECT ON public.loyalty_transactions TO authenticated;
GRANT SELECT ON public.affiliate_commissions TO authenticated;
GRANT SELECT ON public.affiliate_users TO authenticated;
GRANT SELECT ON public.instagram_campaigns TO authenticated;

-- ============================================================================
-- 10. ENABLE REALTIME (Optional)
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.coupons;
ALTER PUBLICATION supabase_realtime ADD TABLE public.offers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.loyalty_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.affiliate_commissions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.affiliate_users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.instagram_campaigns;

-- ============================================================================
-- 11. VERIFICATION QUERIES
-- ============================================================================

-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'coupons', 
  'offers', 
  'loyalty_transactions', 
  'affiliate_commissions',
  'affiliate_users',
  'instagram_campaigns'
)
ORDER BY table_name;

-- Check if loyalty_coins_balance column exists in user_profiles
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_profiles' 
AND column_name = 'loyalty_coins_balance';

-- Check sample data counts
SELECT 'Coupons' as table_name, COUNT(*) as count FROM public.coupons
UNION ALL
SELECT 'Offers', COUNT(*) FROM public.offers
UNION ALL
SELECT 'Affiliate Users', COUNT(*) FROM public.affiliate_users
UNION ALL
SELECT 'Loyalty Transactions', COUNT(*) FROM public.loyalty_transactions
UNION ALL
SELECT 'Affiliate Commissions', COUNT(*) FROM public.affiliate_commissions
UNION ALL
SELECT 'Instagram Campaigns', COUNT(*) FROM public.instagram_campaigns;

-- ============================================================================
-- COMPLETE! 🎉
-- ============================================================================

-- All missing tables have been created!
-- All missing columns have been added!
-- Now refresh your Store Management page and all errors should be gone.
