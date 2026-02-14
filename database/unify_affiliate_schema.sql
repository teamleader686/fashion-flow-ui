-- 1. Ensure 'affiliates' table has all possible columns from both variants
ALTER TABLE public.affiliates 
ADD COLUMN IF NOT EXISTS affiliate_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS referral_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS mobile VARCHAR(20),
ADD COLUMN IF NOT EXISTS total_commission_earned DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS total_commission DECIMAL(12,2);

-- 2. If 'affiliate_users' exists, migrate data to 'affiliates' before fixing FKs
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'affiliate_users') THEN
        RAISE NOTICE 'Merging affiliate_users data into affiliates...';
        
        -- Insert non-existing records
        INSERT INTO public.affiliates (id, user_id, name, email, mobile, referral_code, commission_type, commission_value, status, created_at)
        SELECT id, user_id, name, email, phone, affiliate_code, commission_type, commission_value, 
               CASE WHEN is_active THEN 'active' ELSE 'inactive' END, created_at
        FROM public.affiliate_users
        ON CONFLICT (email) DO NOTHING;

        -- Sync codes globally
        UPDATE public.affiliates SET 
            referral_code = COALESCE(referral_code, affiliate_code),
            affiliate_code = COALESCE(affiliate_code, referral_code);
    END IF;
END $$;

-- 3. Drop existing FK constraints on affiliate_orders to recreate them correctly
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN 
        SELECT conname
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        WHERE rel.relname = 'affiliate_orders' AND con.contype = 'f' AND conname LIKE '%affiliate_id%'
    LOOP
        EXECUTE 'ALTER TABLE public.affiliate_orders DROP CONSTRAINT ' || constraint_record.conname;
    END LOOP;
END $$;

-- 4. Re-link affiliate_orders to 'affiliates' table
-- This is the crucial fix for the FK error
ALTER TABLE public.affiliate_orders 
ADD CONSTRAINT affiliate_orders_affiliate_id_fkey 
FOREIGN KEY (affiliate_id) REFERENCES public.affiliates(id) ON DELETE CASCADE;

-- 5. Final sync of columns in affiliate_orders
ALTER TABLE public.affiliate_orders 
ADD COLUMN IF NOT EXISTS commission_type VARCHAR(20),
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS commission_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS order_total DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS order_amount DECIMAL(10,2);

-- 6. Clean up NOT NULL constraints that block legacy field variants
ALTER TABLE public.affiliate_orders ALTER COLUMN commission_type DROP NOT NULL;
ALTER TABLE public.affiliate_orders ALTER COLUMN commission_rate DROP NOT NULL;
ALTER TABLE public.affiliate_orders ALTER COLUMN order_amount DROP NOT NULL;
ALTER TABLE public.affiliate_orders ALTER COLUMN order_total DROP NOT NULL;
ALTER TABLE public.affiliate_orders ALTER COLUMN commission_amount DROP NOT NULL;

-- 7. Sync statuses
UPDATE public.affiliate_orders 
SET status = COALESCE(status, commission_status),
    commission_status = COALESCE(commission_status, status);

DO $$ 
BEGIN
    RAISE NOTICE 'Affiliate schema unified to use "affiliates" table.';
END $$;
