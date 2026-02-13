-- ============================================================================
-- ORDER CANCELLATION REQUESTS SYSTEM (IDEMPOTENT)
-- ============================================================================

-- Create cancellation_requests table
CREATE TABLE IF NOT EXISTS cancellation_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    UNIQUE(order_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cancellation_requests_order_id ON cancellation_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_cancellation_requests_user_id ON cancellation_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_cancellation_requests_status ON cancellation_requests(status);
CREATE INDEX IF NOT EXISTS idx_cancellation_requests_created_at ON cancellation_requests(created_at DESC);

-- Enable RLS
ALTER TABLE cancellation_requests ENABLE ROW LEVEL SECURITY;

-- CLEANUP OLD POLICIES
DROP POLICY IF EXISTS "Users can view own cancellation requests" ON cancellation_requests;
DROP POLICY IF EXISTS "Users can insert own cancellation requests" ON cancellation_requests;
DROP POLICY IF EXISTS "Admins can view all cancellation requests" ON cancellation_requests;
DROP POLICY IF EXISTS "Admins can update cancellation requests" ON cancellation_requests;

-- Policies
CREATE POLICY "Users can view own cancellation requests" ON cancellation_requests FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own cancellation requests"
    ON cancellation_requests FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = cancellation_requests.order_id
            AND orders.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all cancellation requests"
    ON cancellation_requests FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.user_id = auth.uid()
            AND admin_users.is_active = true
        )
    );

CREATE POLICY "Admins can update cancellation requests"
    ON cancellation_requests FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.user_id = auth.uid()
            AND admin_users.is_active = true
        )
    );

-- Functions and Triggers
CREATE OR REPLACE FUNCTION handle_cancellation_request()
RETURNS TRIGGER AS $$
BEGIN
    SELECT status INTO NEW.previous_order_status FROM orders WHERE id = NEW.order_id;
    UPDATE orders SET status = 'cancellation_requested', updated_at = NOW() WHERE id = NEW.order_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_cancellation_request_created ON cancellation_requests;
CREATE TRIGGER on_cancellation_request_created
    BEFORE INSERT ON cancellation_requests
    FOR EACH ROW EXECUTE FUNCTION handle_cancellation_request();
