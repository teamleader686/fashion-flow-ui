-- ========================================================
-- 📦 ORDER & SHIPPING FLOW ENHANCEMENT
-- ========================================================
-- 1. Standardize Order Statuses
-- 2. Add Tracking Columns to Orders table
-- 3. Ensure Order History exists
-- ========================================================

-- STEP 1: Add Tracking & Shipping columns directly to orders for easier sync
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'tracking_id') THEN
        ALTER TABLE orders ADD COLUMN tracking_id TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shipping_partner') THEN
        ALTER TABLE orders ADD COLUMN shipping_partner TEXT;
    END IF;

    -- Ensure timestamps exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'confirmed_at') THEN
        ALTER TABLE orders ADD COLUMN confirmed_at TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'packed_at') THEN
        ALTER TABLE orders ADD COLUMN packed_at TIMESTAMPTZ;
    END IF;
END $$;

-- STEP 2: Update existing statuses and apply new constraint
-- Migration: Update old 'pending' to new 'placed'
UPDATE orders SET status = 'placed' WHERE status = 'pending';

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN (
    'placed', 'confirmed', 'processing', 'packed', 'shipped', 
    'out_for_delivery', 'delivered', 'cancelled', 'returned', 'refunded', 'cancellation_requested'
));

-- STEP 3: Ensure Order Status History has proper setup
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    notes TEXT,
    changed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 4: Grant Permissions
GRANT ALL ON TABLE public.orders TO authenticated, service_role;
GRANT ALL ON TABLE public.order_status_history TO authenticated, service_role;

-- STEP 5: Reload Schema Cache
NOTIFY pgrst, 'reload schema';
