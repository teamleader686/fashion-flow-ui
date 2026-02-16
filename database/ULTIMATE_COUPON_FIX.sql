-- ========================================================
-- 🚀 ULTIMATE COUPON TABLE FIX (RUN THIS IN SQL EDITOR)
-- ========================================================
-- Ye script aapke 'coupons' table mein saare missing columns add kar degi.
-- ========================================================

-- 1. Add missing columns (IF NOT EXISTS ensures no errors if already there)
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS affiliate_user_id UUID;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS is_affiliate_coupon BOOLEAN DEFAULT FALSE;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS coupon_type TEXT DEFAULT 'normal';
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS commission_type TEXT;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS commission_value NUMERIC DEFAULT 0;

-- 2. Ensure commission_type only allows 'percentage' or 'fixed'
-- First drop constraint if exists to avoid conflict
ALTER TABLE public.coupons DROP CONSTRAINT IF EXISTS coupons_commission_type_check;
ALTER TABLE public.coupons ADD CONSTRAINT coupons_commission_type_check 
CHECK (commission_type IN ('percentage', 'fixed') OR commission_type IS NULL);

-- 3. Update Permissions
GRANT ALL ON TABLE public.coupons TO authenticated, anon, service_role;

-- 4. REFRESH EVERYTHING
NOTIFY pgrst, 'reload schema';

-- 5. VERIFICATION (Check the results below after running)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'coupons' 
AND column_name IN ('affiliate_user_id', 'is_affiliate_coupon', 'coupon_type', 'commission_type', 'commission_value');
