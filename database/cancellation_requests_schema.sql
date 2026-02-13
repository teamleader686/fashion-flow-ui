-- ============================================================================
-- ORDER CANCELLATION REQUESTS SYSTEM
-- ============================================================================
-- This schema supports order cancellation with admin approval workflow
-- ============================================================================

-- Create cancellation_requests table
CREATE TABLE IF NOT EXISTS cancellation_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    reason TEXT NOT NULL,
    comment TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    previous_order_status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID,
    UNIQUE(order_id) -- One cancellation request per order
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cancellation_requests_order_id ON cancellation_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_cancellation_requests_user_id ON cancellation_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_cancellation_requests_status ON cancellation_requests(status);
CREATE INDEX IF NOT EXISTS idx_cancellation_requests_created_at ON cancellation_requests(created_at DESC);

-- Enable Row Level Security
ALTER TABLE cancellation_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own cancellation requests
CREATE POLICY "Users can view own cancellation requests"
    ON cancellation_requests
    FOR SELECT
    USING (user_id = auth.uid());

-- Policy: Users can insert their own cancellation requests
CREATE POLICY "Users can insert own cancellation requests"
    ON cancellation_requests
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = cancellation_requests.order_id
            AND orders.user_id = auth.uid()
            AND orders.status IN ('pending', 'confirmed', 'processing')
        )
    );

-- Policy: Admins can view all cancellation requests
CREATE POLICY "Admins can view all cancellation requests"
    ON cancellation_requests
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.user_id = auth.uid()
            AND admin_users.is_active = true
        )
    );

-- Policy: Admins can update cancellation requests
CREATE POLICY "Admins can update cancellation requests"
    ON cancellation_requests
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.user_id = auth.uid()
            AND admin_users.is_active = true
        )
    );

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to handle cancellation request approval
CREATE OR REPLACE FUNCTION approve_cancellation_request(
    p_request_id UUID,
    p_admin_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_order_id UUID;
    v_user_id UUID;
    v_order_number TEXT;
BEGIN
    -- Get order details
    SELECT cr.order_id, cr.user_id, o.order_number
    INTO v_order_id, v_user_id, v_order_number
    FROM cancellation_requests cr
    JOIN orders o ON o.id = cr.order_id
    WHERE cr.id = p_request_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Cancellation request not found';
    END IF;

    -- Update cancellation request
    UPDATE cancellation_requests
    SET status = 'approved',
        reviewed_at = NOW(),
        reviewed_by = p_admin_id
    WHERE id = p_request_id;

    -- Update order status
    UPDATE orders
    SET status = 'cancelled',
        updated_at = NOW()
    WHERE id = v_order_id;

    -- Restore stock (if needed, implement stock restoration logic here)
    -- This is a placeholder for stock restoration
    -- You can implement actual stock restoration based on order_items

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle cancellation request rejection
CREATE OR REPLACE FUNCTION reject_cancellation_request(
    p_request_id UUID,
    p_admin_id UUID,
    p_rejection_reason TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_order_id UUID;
    v_previous_status TEXT;
BEGIN
    -- Get order details
    SELECT cr.order_id, cr.previous_order_status
    INTO v_order_id, v_previous_status
    FROM cancellation_requests cr
    WHERE cr.id = p_request_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Cancellation request not found';
    END IF;

    -- Update cancellation request
    UPDATE cancellation_requests
    SET status = 'rejected',
        reviewed_at = NOW(),
        reviewed_by = p_admin_id,
        rejection_reason = p_rejection_reason
    WHERE id = p_request_id;

    -- Revert order status to previous state
    UPDATE orders
    SET status = v_previous_status,
        updated_at = NOW()
    WHERE id = v_order_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically update order status when cancellation is requested
CREATE OR REPLACE FUNCTION handle_cancellation_request()
RETURNS TRIGGER AS $$
BEGIN
    -- Store previous order status
    SELECT status INTO NEW.previous_order_status
    FROM orders
    WHERE id = NEW.order_id;

    -- Update order status to 'cancellation_requested'
    UPDATE orders
    SET status = 'cancellation_requested',
        updated_at = NOW()
    WHERE id = NEW.order_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update order status when cancellation is requested
CREATE TRIGGER on_cancellation_request_created
    BEFORE INSERT ON cancellation_requests
    FOR EACH ROW
    EXECUTE FUNCTION handle_cancellation_request();

-- ============================================================================
-- UPDATE ORDERS TABLE (if needed)
-- ============================================================================

-- Add 'cancellation_requested' to order status if not exists
-- This is a safe operation that won't fail if the constraint already allows it
DO $$
BEGIN
    -- Try to add the new status to the check constraint
    -- Note: This might need manual adjustment based on your existing constraint
    ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
    ALTER TABLE orders ADD CONSTRAINT orders_status_check 
        CHECK (status IN (
            'pending', 
            'confirmed', 
            'processing', 
            'packed', 
            'shipped', 
            'out_for_delivery', 
            'delivered', 
            'cancelled', 
            'returned',
            'cancellation_requested'
        ));
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not update orders status constraint. You may need to do this manually.';
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify table created
SELECT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'cancellation_requests'
) AS table_exists;

-- Verify policies created
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'cancellation_requests'
ORDER BY policyname;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE cancellation_requests IS 'Stores order cancellation requests that require admin approval';
COMMENT ON COLUMN cancellation_requests.status IS 'Request status: pending, approved, rejected';
COMMENT ON COLUMN cancellation_requests.previous_order_status IS 'Original order status before cancellation request';
COMMENT ON COLUMN cancellation_requests.rejection_reason IS 'Admin reason for rejecting cancellation';
COMMENT ON FUNCTION approve_cancellation_request IS 'Approves cancellation request and updates order status';
COMMENT ON FUNCTION reject_cancellation_request IS 'Rejects cancellation request and reverts order status';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CANCELLATION REQUESTS SYSTEM CREATED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Table: cancellation_requests ✓';
    RAISE NOTICE 'Indexes: 4 created ✓';
    RAISE NOTICE 'RLS Policies: 4 created ✓';
    RAISE NOTICE 'Functions: 3 created ✓';
    RAISE NOTICE 'Triggers: 1 created ✓';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'System ready for use!';
    RAISE NOTICE '========================================';
END $$;
