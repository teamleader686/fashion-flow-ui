-- ============================================================================
-- STEP 5: Create AFFILIATE_USERS table (or fix existing one)
-- ============================================================================

-- First check if table exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'affiliate_users') THEN
    -- Table doesn't exist, create it
    CREATE TABLE public.affiliate_users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      affiliate_code VARCHAR(50) UNIQUE NOT NULL,
      commission_rate DECIMAL(5,2) DEFAULT 10.00,
      status VARCHAR(20) DEFAULT 'pending',
      total_earnings DECIMAL(10,2) DEFAULT 0,
      total_clicks INTEGER DEFAULT 0,
      total_conversions INTEGER DEFAULT 0,
      payment_method VARCHAR(50),
      payment_details JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    RAISE NOTICE 'Created affiliate_users table';
  ELSE
    -- Table exists, add missing columns
    ALTER TABLE public.affiliate_users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';
    ALTER TABLE public.affiliate_users ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 10.00;
    ALTER TABLE public.affiliate_users ADD COLUMN IF NOT EXISTS total_earnings DECIMAL(10,2) DEFAULT 0;
    ALTER TABLE public.affiliate_users ADD COLUMN IF NOT EXISTS total_clicks INTEGER DEFAULT 0;
    ALTER TABLE public.affiliate_users ADD COLUMN IF NOT EXISTS total_conversions INTEGER DEFAULT 0;
    RAISE NOTICE 'Updated affiliate_users table with missing columns';
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_affiliate_users_code ON public.affiliate_users(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_users_user_id ON public.affiliate_users(user_id);

-- Only create status index if column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'affiliate_users' 
    AND column_name = 'status'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_affiliate_users_status ON public.affiliate_users(status);
  END IF;
END $$;

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

-- Sample data
INSERT INTO public.affiliate_users (affiliate_code, commission_rate, status)
VALUES 
  ('AFF001', 15.00, 'active'),
  ('AFF002', 10.00, 'pending')
ON CONFLICT (affiliate_code) DO NOTHING;

GRANT SELECT ON public.affiliate_users TO authenticated;
ALTER PUBLICATION supabase_realtime ADD TABLE public.affiliate_users;

SELECT 'Step 5 Complete: Affiliate users table ready' as status;
SELECT COUNT(*) as affiliate_count FROM public.affiliate_users;
