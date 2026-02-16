-- ============================================================
-- FIX: products_check constraint violation
-- Run this in Supabase SQL Editor to debug & fix
-- ============================================================

-- STEP 1: See what the constraint actually checks
SELECT
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.products'::regclass
  AND contype = 'c';

-- This will output something like:
--   products_check | CHECK ((selling_price IS NOT NULL))
-- or
--   products_check | CHECK ((price > 0))
-- etc.

-- ============================================================
-- STEP 2: Based on the output, either:
--
-- Option A: DROP the constraint if it's outdated/wrong
--   ALTER TABLE public.products DROP CONSTRAINT products_check;
--
-- Option B: Add missing columns with defaults
--   ALTER TABLE public.products ADD COLUMN IF NOT EXISTS selling_price numeric DEFAULT 0;
--   ALTER TABLE public.products ADD COLUMN IF NOT EXISTS product_name text DEFAULT '';
--
-- ============================================================

-- UNCOMMENT the fix you need after running Step 1:

-- Option A: Drop the constraint
-- ALTER TABLE public.products DROP CONSTRAINT products_check;

-- Option B: Add missing columns (if constraint references them)
-- ALTER TABLE public.products ADD COLUMN IF NOT EXISTS selling_price numeric DEFAULT 0;
-- ALTER TABLE public.products ADD COLUMN IF NOT EXISTS product_name text DEFAULT '';
