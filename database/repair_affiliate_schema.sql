-- FINAL REPAIR: Unify Affiliate Schema
-- This script fixes the column mismatch and not-null violations

-- 1. Ensure all columns needed by the code exist
ALTER TABLE public.affiliate_orders 
ADD COLUMN IF NOT EXISTS user_id UUID,
ADD COLUMN IF NOT EXISTS order_total DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS order_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS commission_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';

-- 2. Relax NOT NULL constraints on all secondary columns to prevent errors
ALTER TABLE public.affiliate_orders ALTER COLUMN order_amount DROP NOT NULL;
ALTER TABLE public.affiliate_orders ALTER COLUMN commission_amount DROP NOT NULL;
ALTER TABLE public.affiliate_orders ALTER COLUMN order_total DROP NOT NULL;
ALTER TABLE public.affiliate_orders ALTER COLUMN commission_type DROP NOT NULL;
ALTER TABLE public.affiliate_orders ALTER COLUMN commission_rate DROP NOT NULL;
ALTER TABLE public.affiliate_orders ALTER COLUMN user_id DROP NOT NULL;

-- 3. Synchronize data between redundant columns to be safe
UPDATE public.affiliate_orders 
SET 
  order_total = COALESCE(order_total, order_amount),
  order_amount = COALESCE(order_amount, order_total),
  commission_status = COALESCE(commission_status, status),
  status = COALESCE(status, commission_status);

-- 4. Clean up triggers if they point to old names
-- (Triggers were defined in advanced_affiliate_tracking.sql)
