-- ============================================================================
-- FIX RETURNS TABLE RELATIONSHIP
-- ============================================================================
-- Error: Could not find a relationship between 'orders' and 'returns'
-- Solution: Ensure returns table has proper foreign key
-- ============================================================================

-- Step 1: Check if returns table exists
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'returns'
ORDER BY ordinal_position;

-- Step 2: Check foreign key constraint
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'returns' 
AND tc.constraint_type = 'FOREIGN KEY';

-- Step 3: Drop and recreate returns table with proper relationship
DROP TABLE IF EXISTS public.returns CASCADE;

CREATE TABLE public.returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
        'pending', 'approved', 'rejected', 'pickup_scheduled', 
        'picked_up', 'refund_completed'
    )),
    refund_amount DECIMAL(10,2),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create indexes
CREATE INDEX idx_returns_order_id ON public.returns(order_id);
CREATE INDEX idx_returns_status ON public.returns(status);
CREATE INDEX idx_returns_created_at ON public.returns(created_at DESC);

-- Step 5: Enable RLS
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies
DROP POLICY IF EXISTS "Users can view their own returns" ON public.returns;
CREATE POLICY "Users can view their own returns"
    ON public.returns FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = returns.order_id
            AND orders.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create returns for their orders" ON public.returns;
CREATE POLICY "Users can create returns for their orders"
    ON public.returns FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = returns.order_id
            AND orders.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can manage returns" ON public.returns;
CREATE POLICY "Admins can manage returns"
    ON public.returns FOR ALL
    USING (
        auth.uid() IN (
            SELECT user_id FROM public.admin_users WHERE is_active = true
        )
    );

-- Step 7: Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_returns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_returns_updated_at ON public.returns;
CREATE TRIGGER update_returns_updated_at
    BEFORE UPDATE ON public.returns
    FOR EACH ROW EXECUTE FUNCTION update_returns_updated_at();

-- Step 8: Verify the relationship
SELECT 
    'Returns table' as item,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'returns'
    ) THEN '✅ Exists' ELSE '❌ Missing' END as status
UNION ALL
SELECT 
    'Foreign key to orders',
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'returns' 
        AND constraint_type = 'FOREIGN KEY'
    ) THEN '✅ Exists' ELSE '❌ Missing' END;

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE '✅ Returns table recreated with proper relationship!';
    RAISE NOTICE '✅ Foreign key to orders table configured';
    RAISE NOTICE '✅ RLS policies applied';
    RAISE NOTICE '✅ Refresh your app to test';
END $$;
