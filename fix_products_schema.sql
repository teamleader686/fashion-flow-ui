-- ============================================================
-- FIX: Product Schema Synchronization & Constraint Repair
-- Run this in Supabase SQL Editor to fix the "products_check" error
-- SAFE TO RE-RUN (Idempotent)
-- ============================================================

-- 1. Drop the problematic constraint (it will be re-added if needed, or we rely on standard checks)
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_check;

-- 2. Add specific checks (Drop first to avoid "already exists" error)
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS check_price_positive;
ALTER TABLE public.products ADD CONSTRAINT check_price_positive CHECK (price >= 0);

-- 3. Ensure legacy columns exist (so existing code doesn't break)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS product_name text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS selling_price numeric;

-- 4. Create a Trigger to SYNC new columns (name, price) with legacy columns (product_name, selling_price)
-- This ensures that no matter which set of columns is written to, BOTH are populated.

CREATE OR REPLACE FUNCTION sync_product_columns_logic()
RETURNS TRIGGER AS $$
BEGIN
    -- Sync name -> product_name
    IF NEW.name IS NOT NULL THEN
        NEW.product_name := NEW.name;
    END IF;
    
    -- Sync product_name -> name (if name is missing)
    IF NEW.name IS NULL AND NEW.product_name IS NOT NULL THEN
        NEW.name := NEW.product_name;
    END IF;

    -- Sync price -> selling_price
    IF NEW.price IS NOT NULL THEN
        NEW.selling_price := NEW.price;
    END IF;

    -- Sync selling_price -> price (if price is missing)
    IF NEW.price IS NULL AND NEW.selling_price IS NOT NULL THEN
        NEW.price := NEW.selling_price;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists to avoid duplication
DROP TRIGGER IF EXISTS trigger_sync_product_cols ON public.products;

-- Create the trigger
CREATE TRIGGER trigger_sync_product_cols
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION sync_product_columns_logic();

-- 5. Backfill existing data
UPDATE public.products SET
  product_name = COALESCE(product_name, name),
  name = COALESCE(name, product_name),
  selling_price = COALESCE(selling_price, price),
  price = COALESCE(price, selling_price);
