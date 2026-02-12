-- ============================================
-- PEHLE YEH FILE CHALAO - COLUMNS ADD KARO
-- ============================================
-- Yeh file SIRF columns add karegi
-- Iske baad AFFILIATE_MAIN_INSTALL.sql chalana
-- ============================================

-- Orders table mein columns add karo
ALTER TABLE orders ADD COLUMN IF NOT EXISTS affiliate_id UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS referral_code TEXT;

-- Orders table pe index bhi bana do
CREATE INDEX IF NOT EXISTS idx_orders_affiliate_id ON orders(affiliate_id);

-- Products table mein columns add karo
ALTER TABLE products ADD COLUMN IF NOT EXISTS affiliate_enabled BOOLEAN DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS affiliate_commission_type TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS affiliate_commission_value DECIMAL(10,2);

-- Verify karo
SELECT 
    'orders' as table_name,
    column_name
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('affiliate_id', 'referral_code')

UNION ALL

SELECT 
    'products' as table_name,
    column_name
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('affiliate_enabled', 'affiliate_commission_type', 'affiliate_commission_value')
ORDER BY table_name, column_name;

-- Success message
SELECT '✅ STEP 1 COMPLETE - Ab AFFILIATE_MAIN_INSTALL.sql chalao' as message;
