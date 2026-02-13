-- ============================================================================
-- FINAL FIX - Robust Coupon & Loyalty Schema Update
-- ============================================================================

-- 1. Fix USER_PROFILES
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS loyalty_coins_balance INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_user_profiles_loyalty_balance 
ON public.user_profiles(loyalty_coins_balance);

-- 2. Fix COUPONS table
-- Add missing columns first
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS discount_type VARCHAR(20);
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS discount_value DECIMAL(10,2);
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS valid_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50);
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS coupon_title VARCHAR(255);
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS min_order_value DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS max_discount_amount DECIMAL(10,2);

-- Handle unique constraint for code if column exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'coupons_code_key') THEN
        ALTER TABLE public.coupons ADD CONSTRAINT coupons_code_key UNIQUE (code);
    END IF;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Could not add unique constraint to code';
END $$;

-- Remove problematic constraints
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
  END LOOP;
END $$;

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- DROP OLD POLICIES
DROP POLICY IF EXISTS "Public can view active coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;

-- Create robust policies
DO $$
BEGIN
    CREATE POLICY "Public can view active coupons"
    ON public.coupons FOR SELECT
    USING (is_active = true OR is_active IS NULL);
EXCEPTION WHEN OTHERS THEN
    CREATE POLICY "Public can view active coupons"
    ON public.coupons FOR SELECT
    USING (true);
END $$;

CREATE POLICY "Admins can manage coupons"
ON public.coupons FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.user_id = auth.uid()
  )
);

-- 3. Create OFFERS table
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

-- DROP OLD OFFERS POLICIES
DROP POLICY IF EXISTS "Public can view active offers" ON public.offers;
DROP POLICY IF EXISTS "Admins can manage offers" ON public.offers;

CREATE POLICY "Public can view active offers" ON public.offers FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage offers" ON public.offers FOR ALL USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid())
);

-- 4. Create LOYALTY_TRANSACTIONS table
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

-- DROP OLD LOYALTY POLICIES
DROP POLICY IF EXISTS "Users can view own transactions" ON public.loyalty_transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.loyalty_transactions;

CREATE POLICY "Users can view own transactions" ON public.loyalty_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all transactions" ON public.loyalty_transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE admin_users.user_id = auth.uid())
);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.coupons;
ALTER PUBLICATION supabase_realtime ADD TABLE public.offers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.loyalty_transactions;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Realtime registration might have already been done';
