-- ============================================================================
-- FIX ORDERS AND RETURNS RELATIONSHIP ERROR
-- ============================================================================
-- Error: Could not find a relationship between 'orders' and 'returns'
-- Solution: Create the returns table if it doesn't exist
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Drop existing returns table if it has issues (CAREFUL!)
-- Uncomment the line below only if you want to recreate the table
-- DROP TABLE IF EXISTS public.returns CASCADE;

-- Create returns table
CREATE TABLE IF NOT EXISTS public.returns (
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_returns_order_id ON public.returns(order_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON public.returns(status);
CREATE INDEX IF NOT EXISTS idx_returns_created_at ON public.returns(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own returns" ON public.returns;
DROP POLICY IF EXISTS "Users can create returns for their orders" ON public.returns;
DROP POLICY IF EXISTS "Admins can manage returns" ON public.returns;

-- RLS Policy: Users can view their own returns
CREATE POLICY "Users can view their own returns"
    ON public.returns FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = returns.order_id
            AND orders.user_id = auth.uid()
        )
    );

-- RLS Policy: Users can create returns for their orders
CREATE POLICY "Users can create returns for their orders"
    ON public.returns FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = returns.order_id
            AND orders.user_id = auth.uid()
        )
    );

-- RLS Policy: Admins can manage all returns
CREATE POLICY "Admins can manage returns"
    ON public.returns FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Create trigger for updated_at (if function exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        DROP TRIGGER IF EXISTS update_returns_updated_at ON public.returns;
        CREATE TRIGGER update_returns_updated_at
            BEFORE UPDATE ON public.returns
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run these queries to verify:

-- 1. Check if table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'returns'
) AS returns_table_exists;

-- 2. Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'returns'
ORDER BY ordinal_position;

-- 3. Check RLS policies
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'returns';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
-- If no errors, the returns table is now properly configured!
-- You can now query orders with returns relationship:
-- SELECT * FROM orders o LEFT JOIN returns r ON r.order_id = o.id;
