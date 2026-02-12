-- ============================================
-- VERIFY STEP 1 - Check if columns were added
-- ============================================
-- Run this to verify Step 1 completed successfully
-- ============================================

-- Check if affiliate columns exist in orders table
SELECT 
    'orders' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('affiliate_id', 'referral_code')
ORDER BY column_name;

-- Check if affiliate columns exist in products table
SELECT 
    'products' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('affiliate_enabled', 'affiliate_commission_type', 'affiliate_commission_value')
ORDER BY column_name;

-- Summary
DO $$ 
DECLARE
  orders_cols INTEGER;
  products_cols INTEGER;
BEGIN
  SELECT COUNT(*) INTO orders_cols
  FROM information_schema.columns 
  WHERE table_name = 'orders' 
  AND column_name IN ('affiliate_id', 'referral_code');
  
  SELECT COUNT(*) INTO products_cols
  FROM information_schema.columns 
  WHERE table_name = 'products' 
  AND column_name IN ('affiliate_enabled', 'affiliate_commission_type', 'affiliate_commission_value');
  
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'STEP 1 VERIFICATION RESULTS:';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Orders table: % of 2 columns added', orders_cols;
  RAISE NOTICE 'Products table: % of 3 columns added', products_cols;
  RAISE NOTICE '===========================================';
  
  IF orders_cols = 2 AND products_cols = 3 THEN
    RAISE NOTICE '✅ STEP 1 COMPLETE - All columns added!';
    RAISE NOTICE '📝 You can proceed to STEP 2';
  ELSE
    RAISE NOTICE '❌ STEP 1 INCOMPLETE';
    IF orders_cols < 2 THEN
      RAISE NOTICE '⚠️  Missing columns in orders table';
      RAISE NOTICE '   Run STEP_1_ADD_AFFILIATE_COLUMNS.sql again';
    END IF;
    IF products_cols < 3 THEN
      RAISE NOTICE '⚠️  Missing columns in products table';
      RAISE NOTICE '   Run STEP_1_ADD_AFFILIATE_COLUMNS.sql again';
    END IF;
  END IF;
END $$;
