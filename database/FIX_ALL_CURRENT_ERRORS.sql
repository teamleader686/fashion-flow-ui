-- ============================================================================
-- FIX ALL CURRENT ERRORS - Run This Once
-- ============================================================================
-- This fixes:
-- 1. Returns table relationship
-- 2. User profile for your account
-- 3. Admin access for your account
-- ============================================================================

-- PART 1: Fix Returns Table
-- ============================================================================
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

CREATE INDEX idx_returns_order_id ON public.returns(order_id);
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage returns"
    ON public.returns FOR ALL
    USING (
        auth.uid() IN (
            SELECT user_id FROM public.admin_users WHERE is_active = true
        )
    );

-- PART 2: Create Your User Profile
-- ============================================================================
INSERT INTO public.user_profiles (user_id, email, full_name, phone, role, is_active)
SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', email), '', 'admin', true
FROM auth.users WHERE id = '9b746fe9-6896-4bbc-89cb-2b7fca159c5f'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin', is_active = true;

INSERT INTO public.wallet (user_id, balance)
VALUES ('9b746fe9-6896-4bbc-89cb-2b7fca159c5f', 0.00)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.loyalty_coins (user_id, available_coins, total_earned)
VALUES ('9b746fe9-6896-4bbc-89cb-2b7fca159c5f', 50, 50)
ON CONFLICT (user_id) DO NOTHING;

-- PART 3: Make You Super Admin
-- ============================================================================
INSERT INTO public.admin_users (user_id, admin_level, permissions, is_active)
VALUES (
    '9b746fe9-6896-4bbc-89cb-2b7fca159c5f',
    'super_admin',
    '{"products": true, "orders": true, "users": true, "settings": true}'::jsonb,
    true
)
ON CONFLICT (user_id) DO UPDATE SET admin_level = 'super_admin', is_active = true;

-- PART 4: Verification
-- ============================================================================
SELECT '✅ ALL FIXES APPLIED!' as status;

SELECT 'Returns Table' as item, COUNT(*)::text as status FROM information_schema.tables WHERE table_name = 'returns'
UNION ALL
SELECT 'Your Profile', COUNT(*)::text FROM public.user_profiles WHERE user_id = '9b746fe9-6896-4bbc-89cb-2b7fca159c5f'
UNION ALL
SELECT 'Your Admin Access', COUNT(*)::text FROM public.admin_users WHERE user_id = '9b746fe9-6896-4bbc-89cb-2b7fca159c5f';
