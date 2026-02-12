-- ============================================
-- CREATE AFFILIATES TABLE - SIMPLE VERSION
-- ============================================
-- Yeh file sirf affiliates table banayegi
-- Step by step messages dikhayegi
-- ============================================

-- Check if orders table exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
        RAISE EXCEPTION 'ERROR: Orders table does not exist. Please create main database schema first.';
    ELSE
        RAISE NOTICE '✅ Orders table exists';
    END IF;
END $$;

-- Create affiliates table
CREATE TABLE IF NOT EXISTS affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  mobile TEXT UNIQUE NOT NULL,
  referral_code TEXT UNIQUE NOT NULL DEFAULT 'REF00000000',
  commission_type TEXT NOT NULL CHECK (commission_type IN ('flat', 'percentage')),
  commission_value DECIMAL(10,2) NOT NULL CHECK (commission_value >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  wallet_balance DECIMAL(10,2) DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_sales DECIMAL(10,2) DEFAULT 0,
  total_commission DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Check if table was created
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'affiliates') THEN
        RAISE NOTICE '✅ Affiliates table created successfully';
    ELSE
        RAISE EXCEPTION 'ERROR: Failed to create affiliates table';
    END IF;
END $$;

-- Create other tables
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
  commission_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE,
  order_id UUID,
  affiliate_order_id UUID REFERENCES affiliate_orders(id) ON DELETE CASCADE,
  commission_type TEXT NOT NULL,
  commission_value DECIMAL(10,2) NOT NULL,
  order_amount DECIMAL(10,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS affiliate_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_details JSONB,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  processed_by UUID
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  balance_before DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Verify all tables
DO $$ 
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables 
  WHERE table_name IN (
    'affiliates',
    'affiliate_clicks',
    'affiliate_orders',
    'affiliate_commissions',
    'affiliate_withdrawals',
    'wallet_transactions'
  );
  
  RAISE NOTICE '===========================================';
  RAISE NOTICE '✅ Tables created: % of 6', table_count;
  RAISE NOTICE '===========================================';
  
  IF table_count = 6 THEN
    RAISE NOTICE '🎉 SUCCESS! All affiliate tables created';
    RAISE NOTICE '📝 Next: Run FIX_AFFILIATE_API_ACCESS.sql';
  ELSE
    RAISE NOTICE '⚠️  Only % tables created', table_count;
  END IF;
END $$;

-- Show created tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE 'affiliate%'
ORDER BY table_name;
