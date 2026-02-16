-- ========================================================
-- 🎯 CANCELLATION SYSTEM FIX - DATABASE REPAIR
-- ========================================================

-- 1. Ensure Table Structure is robust
ALTER TABLE IF EXISTS public.cancellation_requests 
ADD COLUMN IF NOT EXISTS comment TEXT,
ADD COLUMN IF NOT EXISTS admin_note TEXT,
ADD COLUMN IF NOT EXISTS previous_order_status TEXT;

-- 2. Update status check constraint if needed
ALTER TABLE public.cancellation_requests 
DROP CONSTRAINT IF EXISTS cancellation_requests_status_check;

ALTER TABLE public.cancellation_requests 
ADD CONSTRAINT cancellation_requests_status_check 
CHECK (status IN ('pending', 'approved', 'rejected'));

-- 3. FIX RLS POLICIES (Make them more inclusive for statuses)
DROP POLICY IF EXISTS "Users can insert own cancellation requests" ON cancellation_requests;
CREATE POLICY "Users can insert own cancellation requests"
    ON cancellation_requests FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND (user_id = auth.uid())
        AND EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = cancellation_requests.order_id
            AND orders.user_id = auth.uid()
            -- Allowing cancellation from any reasonable early state
            AND orders.status IN ('pending', 'placed', 'confirmed', 'processing', 'packed')
        )
    );

DROP POLICY IF EXISTS "Users can view own cancellation requests" ON cancellation_requests;
CREATE POLICY "Users can view own cancellation requests" 
ON cancellation_requests FOR SELECT 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all cancellation requests" ON cancellation_requests;
CREATE POLICY "Admins can view all cancellation requests"
    ON cancellation_requests FOR SELECT
    USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true));

-- 4. Ensure Orders table has required columns
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'cancellation_status') THEN
        ALTER TABLE orders ADD COLUMN cancellation_status TEXT DEFAULT 'none';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'order_status') THEN
        ALTER TABLE orders ADD COLUMN order_status TEXT;
    END IF;
END $$;

-- 5. Fix/Recreate the Trigger for robust state updates
CREATE OR REPLACE FUNCTION handle_cancellation_request_submitted()
RETURNS TRIGGER AS $$
BEGIN
    -- Capture current status to restore if rejected
    SELECT status INTO NEW.previous_order_status FROM orders WHERE id = NEW.order_id;
    
    -- Update order status in both columns for compatibility
    UPDATE orders 
    SET 
        status = 'cancellation_requested', 
        order_status = 'cancellation_requested',
        cancellation_status = 'requested',
        updated_at = NOW()
    WHERE id = NEW.order_id;
    
    -- Add to status history - handle potential missing table gracefully
    BEGIN
        INSERT INTO order_status_history (order_id, status, notes, created_at)
        VALUES (NEW.order_id, 'cancellation_requested', 'Cancellation requested by user. Reason: ' || NEW.reason, NOW());
    EXCEPTION WHEN OTHERS THEN
        -- Fallback if table or column name differs (e.g., 'note' instead of 'notes')
        BEGIN
            INSERT INTO order_status_history (order_id, status, note, created_at)
            VALUES (NEW.order_id, 'cancellation_requested', 'Cancellation requested by user. Reason: ' || NEW.reason, NOW());
        EXCEPTION WHEN OTHERS THEN
            -- Ignore history errors to allow cancellation to proceed
        END;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_cancellation_request_submitted ON cancellation_requests;
CREATE TRIGGER trg_cancellation_request_submitted
BEFORE INSERT ON cancellation_requests
FOR EACH ROW EXECUTE FUNCTION handle_cancellation_request_submitted();

-- 6. Ensure admin functions are available and robust
-- Explicitly drop existing versions to avoid ambiguity
DROP FUNCTION IF EXISTS public.approve_cancellation_request(UUID, UUID);
DROP FUNCTION IF EXISTS public.approve_cancellation_request(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS public.reject_cancellation_request(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS public.reject_cancellation_request(UUID, UUID);

CREATE OR REPLACE FUNCTION public.approve_cancellation_request(
  p_request_id UUID,
  p_admin_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_order_id UUID;
BEGIN
  -- Get order ID
  SELECT order_id INTO v_order_id FROM cancellation_requests WHERE id = p_request_id;
  
  -- Update request status
  UPDATE cancellation_requests 
  SET status = 'approved', reviewed_at = NOW(), reviewed_by = p_admin_id
  WHERE id = p_request_id;
  
  -- Update order status to cancelled
  UPDATE orders 
  SET status = 'cancelled', order_status = 'cancelled', cancellation_status = 'approved', updated_at = NOW()
  WHERE id = v_order_id;
  
  -- Add to history - handle potential missing table gracefully
  BEGIN
    INSERT INTO order_status_history (order_id, status, notes, created_at)
    VALUES (v_order_id, 'cancelled', 'Cancellation request approved by admin', NOW());
  EXCEPTION WHEN OTHERS THEN
    BEGIN
      INSERT INTO order_status_history (order_id, status, note, created_at)
      VALUES (v_order_id, 'cancelled', 'Cancellation request approved by admin', NOW());
    EXCEPTION WHEN OTHERS THEN
      -- Ignore
    END;
  END;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
  -- Get order ID and previous status
  SELECT order_id, previous_order_status INTO v_order_id, v_prev_status 
  FROM cancellation_requests WHERE id = p_request_id;
  
  -- Update request status
  UPDATE cancellation_requests 
  SET status = 'rejected', admin_note = p_admin_note, reviewed_at = NOW(), reviewed_by = p_admin_id
  WHERE id = p_request_id;
  
  -- Restore original order status
  UPDATE orders 
  SET status = v_prev_status, order_status = v_prev_status, cancellation_status = 'rejected', updated_at = NOW()
  WHERE id = v_order_id;
  
  -- Add to history
  BEGIN
    INSERT INTO order_status_history (order_id, status, notes, created_at)
    VALUES (v_order_id, v_prev_status, 'Cancellation request rejected by admin. Note: ' || p_admin_note, NOW());
  EXCEPTION WHEN OTHERS THEN
    BEGIN
      INSERT INTO order_status_history (order_id, status, note, created_at)
      VALUES (v_order_id, v_prev_status, 'Cancellation request rejected by admin. Note: ' || p_admin_note, NOW());
    EXCEPTION WHEN OTHERS THEN
      -- Ignore
    END;
  END;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Grant Permissions
GRANT ALL ON cancellation_requests TO authenticated, service_role;
GRANT ALL ON order_status_history TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION approve_cancellation_request TO authenticated;
GRANT EXECUTE ON FUNCTION reject_cancellation_request TO authenticated;
