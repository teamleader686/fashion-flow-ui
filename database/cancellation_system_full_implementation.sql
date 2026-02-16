-- ============================================================================
-- 🎯 ORDER CANCELLATION SYSTEM - FULL IMPLEMENTATION
-- ============================================================================
-- Audit, Fix, and Enhance Order Cancellation with Admin Approval and Refunds
-- ============================================================================

-- 1. EXTEND TABLES
-- ----------------------------------------------------------------------------

-- Add cancellation_status to orders
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'cancellation_status') THEN
        ALTER TABLE orders ADD COLUMN cancellation_status TEXT DEFAULT 'none';
        -- none, requested, approved, rejected
    END IF;
END $$;

-- Fix/Enhance cancellation_requests table
CREATE TABLE IF NOT EXISTS public.cancellation_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    reason TEXT NOT NULL,
    comment TEXT,
    admin_note TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    previous_order_status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(order_id)
);

-- Create order_status_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);

-- Add admin_note if it doesn't exist (if table existed but without it)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cancellation_requests' AND column_name = 'admin_note') THEN
        ALTER TABLE cancellation_requests ADD COLUMN admin_note TEXT;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE cancellation_requests ENABLE ROW LEVEL SECURITY;

-- 2. POLICIES
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view own cancellation requests" ON cancellation_requests;
DROP POLICY IF EXISTS "Users can insert own cancellation requests" ON cancellation_requests;
DROP POLICY IF EXISTS "Admins can view all cancellation requests" ON cancellation_requests;
DROP POLICY IF EXISTS "Admins can update cancellation requests" ON cancellation_requests;

CREATE POLICY "Users can view own cancellation requests" ON cancellation_requests FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own cancellation requests"
    ON cancellation_requests FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = cancellation_requests.order_id
            AND orders.user_id = auth.uid()
            AND orders.status IN ('placed', 'confirmed', 'processing')
        )
    );

CREATE POLICY "Admins can view all cancellation requests"
    ON cancellation_requests FOR SELECT
    USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Admins can update cancellation requests"
    ON cancellation_requests FOR UPDATE
    USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true));

-- 3. HELPER FUNCTIONS
-- ----------------------------------------------------------------------------

-- Trigger function for automatic order update on request creation
CREATE OR REPLACE FUNCTION handle_cancellation_request_submitted()
RETURNS TRIGGER AS $$
BEGIN
    -- Capture current status to restore if rejected
    SELECT status INTO NEW.previous_order_status FROM orders WHERE id = NEW.order_id;
    
    -- Update order status
    UPDATE orders 
    SET 
        status = 'cancellation_requested', 
        cancellation_status = 'requested',
        updated_at = NOW() 
    WHERE id = NEW.order_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_cancellation_request_created ON cancellation_requests;
CREATE TRIGGER on_cancellation_request_created
    BEFORE INSERT ON cancellation_requests
    FOR EACH ROW EXECUTE FUNCTION handle_cancellation_request_submitted();

-- 4. ADMIN RPC FUNCTIONS
-- ----------------------------------------------------------------------------

-- Drop old versions to avoid parameter name conflict errors
DROP FUNCTION IF EXISTS public.approve_cancellation_request(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS public.reject_cancellation_request(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS public.approve_cancellation_request(UUID, UUID);
DROP FUNCTION IF EXISTS public.reject_cancellation_request(UUID, UUID);

-- APPROVE CANCELLATION RPC
CREATE OR REPLACE FUNCTION public.approve_cancellation_request(
    p_request_id UUID,
    p_admin_id UUID,
    p_admin_note TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_order_id UUID;
    v_user_id UUID;
    v_coins_to_refund INTEGER;
    v_wallet_amount_to_refund DECIMAL(10,2);
    v_order_number TEXT;
BEGIN
    -- 1. Get Request Details
    SELECT order_id, user_id INTO v_order_id, v_user_id
    FROM cancellation_requests
    WHERE id = p_request_id AND status = 'pending';

    IF v_order_id IS NULL THEN
        RAISE EXCEPTION 'Pending cancellation request not found';
    END IF;

    -- 2. Get Order Details
    SELECT loyalty_coins_used, wallet_amount_used, order_number 
    INTO v_coins_to_refund, v_wallet_amount_to_refund, v_order_number
    FROM orders
    WHERE id = v_order_id;

    -- 3. Update Request
    UPDATE cancellation_requests
    SET 
        status = 'approved',
        admin_note = p_admin_note,
        updated_at = NOW()
    WHERE id = p_request_id;

    -- 4. Update Order
    UPDATE orders
    SET 
        status = 'cancelled',
        cancellation_status = 'approved',
        updated_at = NOW()
    WHERE id = v_order_id;

    -- 5. Record in Status History
    INSERT INTO order_status_history (order_id, status, notes)
    VALUES (v_order_id, 'cancelled', COALESCE(p_admin_note, 'Cancellation approved by admin'));

    -- 6. PROCESS REFUNDS
    
    -- Refund Loyalty Coins
    IF v_coins_to_refund > 0 THEN
        -- Add back to wallet balance
        UPDATE loyalty_wallet
        SET 
            available_balance = available_balance + v_coins_to_refund,
            total_redeemed = CASE WHEN total_redeemed >= v_coins_to_refund THEN total_redeemed - v_coins_to_refund ELSE 0 END,
            updated_at = NOW()
        WHERE user_id = v_user_id;

        -- Log transaction
        INSERT INTO loyalty_transactions (
            user_id, order_id, coins, type, wallet_type, description, status
        ) VALUES (
            v_user_id, v_order_id, v_coins_to_refund, 'earn', 'loyalty', 
            'Refund for Cancelled Order #' || v_order_number, 'completed'
        );
    END IF;

    -- Refund Wallet Amount (if any used)
    IF v_wallet_amount_to_refund > 0 THEN
        UPDATE loyalty_wallet
        SET 
            refund_balance = refund_balance + v_wallet_amount_to_refund,
            total_balance = total_balance + v_wallet_amount_to_refund,
            updated_at = NOW()
        WHERE user_id = v_user_id;
        
        -- You might have a wallet_transactions table too, but we use loyalty_transactions for simplicity in this schema
        INSERT INTO loyalty_transactions (
            user_id, order_id, amount, type, wallet_type, description, status
        ) VALUES (
            v_user_id, v_order_id, v_wallet_amount_to_refund, 'earn', 'refund', 
            'Refund to wallet for Cancelled Order #' || v_order_number, 'completed'
        );
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- REJECT CANCELLATION RPC
CREATE OR REPLACE FUNCTION public.reject_cancellation_request(
    p_request_id UUID,
    p_admin_id UUID,
    p_admin_note TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_order_id UUID;
    v_prev_status TEXT;
BEGIN
    -- 1. Get Request Details
    SELECT order_id, previous_order_status INTO v_order_id, v_prev_status
    FROM cancellation_requests
    WHERE id = p_request_id AND status = 'pending';

    IF v_order_id IS NULL THEN
        RAISE EXCEPTION 'Pending cancellation request not found';
    END IF;

    -- 2. Update Request
    UPDATE cancellation_requests
    SET 
        status = 'rejected',
        admin_note = p_admin_note,
        updated_at = NOW()
    WHERE id = p_request_id;

    -- 3. Update Order - Restore previous status
    UPDATE orders
    SET 
        status = COALESCE(v_prev_status, 'placed'),
        cancellation_status = 'rejected',
        updated_at = NOW()
    WHERE id = v_order_id;

    -- 4. Record in Status History
    INSERT INTO order_status_history (order_id, status, notes)
    VALUES (v_order_id, COALESCE(v_prev_status, 'placed'), 'Cancellation rejected: ' || p_admin_note);

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. GRANTS
-- ----------------------------------------------------------------------------
-- Use full signatures to avoid "not unique" errors if overloads exist
GRANT EXECUTE ON FUNCTION public.approve_cancellation_request(UUID, UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reject_cancellation_request(UUID, UUID, TEXT) TO authenticated, service_role;
