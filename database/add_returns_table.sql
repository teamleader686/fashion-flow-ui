-- ============================================================================
-- ADD RETURNS TABLE TO DATABASE (FIXED & IDEMPOTENT)
-- ============================================================================

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

-- CLEANUP OLD POLICIES
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

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_returns_updated_at ON public.returns;
CREATE TRIGGER update_returns_updated_at
    BEFORE UPDATE ON public.returns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
