-- ============================================================================
-- WISHLIST-BASED MARKETING SYSTEM SCHEMA (REPAIR & SYNC)
-- ============================================================================

-- 1. Repair/Create Wishlist Table
CREATE TABLE IF NOT EXISTS wishlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- Ensure Wishlist has all required columns if it existed before
DO $$ 
BEGIN
    -- Check for 'id' column (some old versions use composite keys)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='wishlist' AND column_name='id') THEN
        ALTER TABLE wishlist ADD COLUMN id UUID DEFAULT uuid_generate_v4() PRIMARY KEY;
    END IF;

    -- Check for 'created_at' column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='wishlist' AND column_name='created_at') THEN
        ALTER TABLE wishlist ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Enable RLS for wishlist
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

-- Idempotent Policy Creation for wishlist
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view their own wishlist" ON wishlist;
    CREATE POLICY "Users can view their own wishlist"
        ON wishlist FOR SELECT
        USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can manage their own wishlist" ON wishlist;
    CREATE POLICY "Users can manage their own wishlist"
        ON wishlist FOR ALL
        USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Admins can view all wishlists" ON wishlist;
    CREATE POLICY "Admins can view all wishlists"
        ON wishlist FOR SELECT
        USING (EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.role = 'admin'
        ));
END $$;

-- 2. Coupons Table (Repair/Create)
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT NOT NULL DEFAULT 'percentage',
    discount_value NUMERIC NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to coupons table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coupons' AND column_name='is_active') THEN
        ALTER TABLE coupons ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coupons' AND column_name='expiry_date') THEN
        ALTER TABLE coupons ADD COLUMN expiry_date TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coupons' AND column_name='usage_limit') THEN
        ALTER TABLE coupons ADD COLUMN usage_limit INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coupons' AND column_name='times_used') THEN
        ALTER TABLE coupons ADD COLUMN times_used INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coupons' AND column_name='min_order_amount') THEN
        ALTER TABLE coupons ADD COLUMN min_order_amount NUMERIC DEFAULT 0;
    END IF;
END $$;

-- Enable RLS for coupons
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Everyone can view active coupons" ON coupons;
    CREATE POLICY "Everyone can view active coupons"
        ON coupons FOR SELECT
        USING (is_active = true AND (expiry_date IS NULL OR expiry_date > NOW()));

    DROP POLICY IF EXISTS "Admins can manage coupons" ON coupons;
    CREATE POLICY "Admins can manage coupons"
        ON coupons FOR ALL
        USING (EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.role = 'admin'
        ));
END $$;

-- 3. Marketing Logs Table
CREATE TABLE IF NOT EXISTS marketing_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    message_type TEXT NOT NULL CHECK (message_type IN ('whatsapp', 'email', 'sms')),
    message TEXT NOT NULL,
    coupon_id UUID REFERENCES coupons(id),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_by UUID REFERENCES auth.users(id)
);

-- Enable RLS for marketing_logs
ALTER TABLE marketing_logs ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Admins can view marketing logs" ON marketing_logs;
    CREATE POLICY "Admins can view marketing logs"
        ON marketing_logs FOR SELECT
        USING (EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.role = 'admin'
        ));

    DROP POLICY IF EXISTS "Admins can insert marketing logs" ON marketing_logs;
    CREATE POLICY "Admins can insert marketing logs"
        ON marketing_logs FOR INSERT
        WITH CHECK (EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.role = 'admin'
        ));
END $$;

-- 4. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_product_id ON wishlist(product_id);
CREATE INDEX IF NOT EXISTS idx_marketing_logs_user_id ON marketing_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
