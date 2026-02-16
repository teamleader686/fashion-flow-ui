-- ========================================================
-- 🚨 CRITICAL FIX: MISSING COUPON COLUMNS
-- ========================================================
-- Run this script in the Supabase SQL Editor to fix the 400 error.
-- ========================================================

DO $$ 
BEGIN 
    -- 1. Check and add affiliate_user_id to coupons
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'affiliate_user_id') THEN
        ALTER TABLE coupons ADD COLUMN affiliate_user_id UUID;
    END IF;

    -- 2. Check and add is_affiliate_coupon to coupons
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'is_affiliate_coupon') THEN
        ALTER TABLE coupons ADD COLUMN is_affiliate_coupon BOOLEAN DEFAULT FALSE;
    END IF;

    -- 3. Check and add coupon_type to coupons
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'coupon_type') THEN
        ALTER TABLE coupons ADD COLUMN coupon_type TEXT DEFAULT 'normal';
    END IF;

    -- 4. Check and add commission_type to coupons
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'commission_type') THEN
        ALTER TABLE coupons ADD COLUMN commission_type TEXT;
    END IF;

    -- 5. Check and add commission_value to coupons
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupons' AND column_name = 'commission_value') THEN
        ALTER TABLE coupons ADD COLUMN commission_value NUMERIC DEFAULT 0;
    END IF;

    -- 6. Check and add commission_amount to coupon_usages
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupon_usages' AND column_name = 'commission_amount') THEN
        ALTER TABLE coupon_usages ADD COLUMN commission_amount NUMERIC DEFAULT 0;
    END IF;

    -- 7. Check and add affiliate_user_id to coupon_usages
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coupon_usages' AND column_name = 'affiliate_user_id') THEN
        ALTER TABLE coupon_usages ADD COLUMN affiliate_user_id UUID;
    END IF;

    -- 8. Add constraint for commission_type if it doesn't exist
    ALTER TABLE coupons DROP CONSTRAINT IF EXISTS coupons_commission_type_check;
    ALTER TABLE coupons ADD CONSTRAINT coupons_commission_type_check CHECK (commission_type IN ('percentage', 'fixed'));

END $$;

-- Update RLS and Permissions just in case
GRANT ALL ON TABLE coupons TO authenticated, service_role;
GRANT ALL ON TABLE coupon_usages TO authenticated, service_role;

-- 🚀 IMPORTANT: AFTER RUNNING THIS, RELOAD SCHEMA CACHE IN SUPABASE SETTINGS!
-- Jayein: Settings -> API -> Reload Schema
