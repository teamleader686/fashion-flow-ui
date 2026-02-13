-- ============================================================================
-- FIX RETURNS TABLE - SIMPLE & WORKING
-- ============================================================================
-- Run this ENTIRE script in Supabase SQL Editor
-- ============================================================================

-- Step 1: Create returns table if not exists
CREATE TABLE IF NOT EXISTS returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending', 'approved', 'rejected', 'pickup_scheduled', 
        'picked_up', 'refund_completed'
    )),
    refund_amount DECIMAL(10,2),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_returns_order_id ON returns(order_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON returns(status);
CREATE INDEX IF NOT EXISTS idx_returns_created_at ON returns(created_at DESC);

-- Step 3: Enable RLS
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop old policies (if any)
DROP POLICY IF EXISTS "Users can view their own returns" ON returns;
DROP POLICY IF EXISTS "Users can create returns for their orders" ON returns;
DROP POLICY IF EXISTS "Admins can manage returns" ON returns;
DROP POLICY IF EXISTS "Admins can view all returns" ON returns;
DROP POLICY IF EXISTS "Admins can update returns" ON returns;

-- Step 5: Create RLS policies

-- Policy 1: Users can view their own returns
CREATE POLICY "Users can view their own returns"
ON returns FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM orders
        WHERE orders.id = returns.order_id
        AND orders.user_id = auth.uid()
    )
);

-- Policy 2: Users can create returns for their orders
CREATE POLICY "Users can create returns for their orders"
ON returns FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM orders
        WHERE orders.id = returns.order_id
        AND orders.user_id = auth.uid()
    )
);

-- Policy 3: Admins can view all returns
CREATE POLICY "Admins can view all returns"
ON returns FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE admin_users.user_id = auth.uid()
        AND admin_users.is_active = true
    )
);

-- Policy 4: Admins can update returns
CREATE POLICY "Admins can update returns"
ON returns FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE admin_users.user_id = auth.uid()
        AND admin_users.is_active = true
    )
);

-- Step 6: Create trigger function if not exists
CREATE OR REPLACE FUNCTION update_returns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create trigger
DROP TRIGGER IF EXISTS update_returns_updated_at ON returns;
CREATE TRIGGER update_returns_updated_at
    BEFORE UPDATE ON returns
    FOR EACH ROW
    EXECUTE FUNCTION update_returns_updated_at();

-- Step 8: Verify setup
DO $$
DECLARE
    col_count INTEGER;
    idx_count INTEGER;
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO col_count 
    FROM information_schema.columns 
    WHERE table_name = 'returns';
    
    SELECT COUNT(*) INTO idx_count 
    FROM pg_indexes 
    WHERE tablename = 'returns';
    
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE tablename = 'returns';
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '   RETURNS TABLE FIXED! ✓';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Columns: %', col_count;
    RAISE NOTICE 'Indexes: %', idx_count;
    RAISE NOTICE 'RLS Policies: %', policy_count;
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'System ready for use!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
END $$;

-- Step 9: Show table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'returns'
ORDER BY ordinal_position;
