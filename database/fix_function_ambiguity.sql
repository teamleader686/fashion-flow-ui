-- ========================================================
-- 🧹 FUNCTION AMBIGUITY FIX - CANCELLATION SYSTEM
-- ========================================================
-- This script safely removes all overloaded versions of cancellation functions
-- and reinstalls the correct ones to fix the "function not unique" error.

-- 1. Drop all possible versions of Approve function
DROP FUNCTION IF EXISTS public.approve_cancellation_request(UUID, UUID);
DROP FUNCTION IF EXISTS public.approve_cancellation_request(UUID, UUID, TEXT);

-- 2. Drop all possible versions of Reject function
DROP FUNCTION IF EXISTS public.reject_cancellation_request(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS public.reject_cancellation_request(UUID, UUID);

-- 3. Re-install Approve Function (Signature: UUID, UUID)
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
  
  IF v_order_id IS NULL THEN
    RAISE EXCEPTION 'Cancellation request not found';
  END IF;

  -- Update request status
  UPDATE cancellation_requests 
  SET status = 'approved', 
      reviewed_at = NOW(), 
      reviewed_by = p_admin_id
  WHERE id = p_request_id;
  
  -- Update order status to cancelled
  UPDATE orders 
  SET status = 'cancelled', 
      order_status = 'cancelled', 
      cancellation_status = 'approved', 
      updated_at = NOW()
  WHERE id = v_order_id;
  
  -- Add to history (robustly handles different schema versions)
  BEGIN
    INSERT INTO order_status_history (order_id, status, notes, created_at)
    VALUES (v_order_id, 'cancelled', 'Cancellation request approved by admin', NOW());
  EXCEPTION WHEN OTHERS THEN
    BEGIN
      INSERT INTO order_status_history (order_id, status, note, created_at)
      VALUES (v_order_id, 'cancelled', 'Cancellation request approved by admin', NOW());
    EXCEPTION WHEN OTHERS THEN
      -- Ignore if table missing
    END;
  END;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Re-install Reject Function (Signature: UUID, UUID, TEXT)
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
  
  IF v_order_id IS NULL THEN
    RAISE EXCEPTION 'Cancellation request not found';
  END IF;

  -- Update request status
  UPDATE cancellation_requests 
  SET status = 'rejected', 
      admin_note = p_admin_note, 
      reviewed_at = NOW(), 
      reviewed_by = p_admin_id
  WHERE id = p_request_id;
  
  -- Restore original order status (or fallback to processing)
  UPDATE orders 
  SET status = COALESCE(v_prev_status, 'processing'), 
      order_status = COALESCE(v_prev_status, 'processing'), 
      cancellation_status = 'rejected', 
      updated_at = NOW()
  WHERE id = v_order_id;
  
  -- Add to history
  BEGIN
    INSERT INTO order_status_history (order_id, status, notes, created_at)
    VALUES (v_order_id, COALESCE(v_prev_status, 'processing'), 'Cancellation request rejected by admin. Note: ' || p_admin_note, NOW());
  EXCEPTION WHEN OTHERS THEN
    BEGIN
      INSERT INTO order_status_history (order_id, status, note, created_at)
      VALUES (v_order_id, COALESCE(v_prev_status, 'processing'), 'Cancellation request rejected by admin. Note: ' || p_admin_note, NOW());
    EXCEPTION WHEN OTHERS THEN
      -- Ignore if table missing
    END;
  END;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Restore Permissions
GRANT EXECUTE ON FUNCTION public.approve_cancellation_request(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reject_cancellation_request(UUID, UUID, TEXT) TO authenticated, service_role;
