-- ============================================================================
-- STEP 2: Create or Fix COUPONS table
-- ============================================================================

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL,
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

-- Fix existing table: Remove ALL NOT NULL constraints automatically
DO $$ 
DECLARE
  col_record RECORD;
BEGIN
  -- Find all NOT NULL columns in coupons table and remove the constraint
  FOR col_record IN 
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'coupons' 
    AND is_nullable = 'NO'
    AND column_name NOT IN ('id', 'code') -- Keep id and code as NOT NULL
  LOOP
    EXECUTE format('ALTER TABLE public.coupons ALTER COLUMN %I DROP NOT NULL', col_record.column_name);
    RAISE NOTICE 'Removed NOT NULL constraint from column: %', col_record.column_name;
  END LOOP;
  
  -- Set default values for common columns
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coupons' AND column_name = 'type') THEN
    EXECUTE 'ALTER TABLE public.coupons ALTER COLUMN type SET DEFAULT ''discount''';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coupons' AND column_name = 'value') THEN
    EXECUTE 'ALTER TABLE public.coupons ALTER COLUMN value SET DEFAULT 0';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coupons' AND column_name = 'applicable_type') THEN
    EXECUTE 'ALTER TABLE public.coupons ALTER COLUMN applicable_type SET DEFAULT ''all''';
  END IF;
END $$;

-- Add missing columns if table already exists
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS discount_type VARCHAR(20);
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS discount_value DECIMAL(10,2);
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS min_purchase_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS max_discount_amount DECIMAL(10,2);
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS usage_limit INTEGER;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS per_user_limit INTEGER DEFAULT 1;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS valid_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes (after ensuring columns exist)
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_until ON public.coupons(valid_until);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

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

-- Sample data
INSERT INTO public.coupons (code, description, discount_type, discount_value, usage_limit, is_active, valid_until)
VALUES 
  ('WELCOME10', 'Welcome discount', 'percentage', 10, 100, true, NOW() + INTERVAL '30 days'),
  ('SAVE50', 'Flat ₹50 off', 'fixed', 50, 200, true, NOW() + INTERVAL '60 days'),
  ('FLASH20', 'Flash sale', 'percentage', 20, 50, true, NOW() + INTERVAL '7 days')
ON CONFLICT (code) DO NOTHING;

GRANT SELECT ON public.coupons TO authenticated;
ALTER PUBLICATION supabase_realtime ADD TABLE public.coupons;

SELECT 'Step 2 Complete: Coupons table created' as status;
SELECT COUNT(*) as coupon_count FROM public.coupons;
