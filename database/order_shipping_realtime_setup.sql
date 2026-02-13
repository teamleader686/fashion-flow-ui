-- ============================================================================
-- ORDER & SHIPPING REALTIME SYNC SETUP
-- ============================================================================
-- This script sets up real-time subscriptions for orders and shipments
-- Ensures instant sync between user and admin sides

-- Enable realtime for orders table
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- Enable realtime for shipments table
ALTER PUBLICATION supabase_realtime ADD TABLE public.shipments;

-- Enable realtime for shipment tracking events
ALTER PUBLICATION supabase_realtime ADD TABLE public.shipment_tracking_events;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for faster order queries by user
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- Index for shipment queries
CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON public.shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON public.shipments(status);

-- Index for tracking events
CREATE INDEX IF NOT EXISTS idx_tracking_events_shipment_id ON public.shipment_tracking_events(shipment_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_time ON public.shipment_tracking_events(event_time DESC);

-- ============================================================================
-- FUNCTIONS FOR AUTO-UPDATING TIMESTAMPS
-- ============================================================================

-- Function to update order timestamps based on status
CREATE OR REPLACE FUNCTION update_order_status_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    -- Update confirmed_at when status changes to confirmed
    IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
        NEW.confirmed_at = NOW();
    END IF;
    
    -- Update packed_at when status changes to packed
    IF NEW.status = 'packed' AND OLD.status != 'packed' THEN
        NEW.packed_at = NOW();
    END IF;
    
    -- Update shipped_at when status changes to shipped
    IF NEW.status = 'shipped' AND OLD.status != 'shipped' THEN
        NEW.shipped_at = NOW();
    END IF;
    
    -- Update delivered_at when status changes to delivered
    IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
        NEW.delivered_at = NOW();
    END IF;
    
    -- Always update updated_at
    NEW.updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order status updates
DROP TRIGGER IF EXISTS trigger_update_order_timestamps ON public.orders;
CREATE TRIGGER trigger_update_order_timestamps
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION update_order_status_timestamps();

-- ============================================================================
-- FUNCTION TO AUTO-UPDATE SHIPMENT TIMESTAMPS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_shipment_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    -- Update shipped_at when status changes to picked_up or in_transit
    IF (NEW.status IN ('picked_up', 'in_transit')) AND 
       (OLD.status IS NULL OR OLD.status = 'pending') THEN
        NEW.shipped_at = NOW();
    END IF;
    
    -- Update delivered_at when status changes to delivered
    IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
        NEW.delivered_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for shipment status updates
DROP TRIGGER IF EXISTS trigger_update_shipment_timestamps ON public.shipments;
CREATE TRIGGER trigger_update_shipment_timestamps
    BEFORE UPDATE ON public.shipments
    FOR EACH ROW
    EXECUTE FUNCTION update_shipment_timestamps();

-- ============================================================================
-- FUNCTION TO SYNC ORDER STATUS WITH SHIPMENT STATUS
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_order_with_shipment_status()
RETURNS TRIGGER AS $$
BEGIN
    -- When shipment is delivered, mark order as delivered
    IF NEW.status = 'delivered' THEN
        UPDATE public.orders 
        SET status = 'delivered', 
            delivered_at = NOW(),
            updated_at = NOW()
        WHERE id = NEW.order_id AND status != 'delivered';
    END IF;
    
    -- When shipment is out for delivery, update order status
    IF NEW.status = 'out_for_delivery' THEN
        UPDATE public.orders 
        SET status = 'out_for_delivery',
            updated_at = NOW()
        WHERE id = NEW.order_id AND status NOT IN ('delivered', 'out_for_delivery');
    END IF;
    
    -- When shipment is in transit, ensure order is shipped
    IF NEW.status = 'in_transit' THEN
        UPDATE public.orders 
        SET status = 'shipped',
            updated_at = NOW()
        WHERE id = NEW.order_id AND status NOT IN ('shipped', 'out_for_delivery', 'delivered');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to sync order status with shipment
DROP TRIGGER IF EXISTS trigger_sync_order_shipment ON public.shipments;
CREATE TRIGGER trigger_sync_order_shipment
    AFTER UPDATE ON public.shipments
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION sync_order_with_shipment_status();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_tracking_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own shipments" ON public.shipments;
DROP POLICY IF EXISTS "Users can view own tracking events" ON public.shipment_tracking_events;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can manage shipments" ON public.shipments;
DROP POLICY IF EXISTS "Admins can manage tracking events" ON public.shipment_tracking_events;

-- Users can view their own orders
CREATE POLICY "Users can view own orders"
    ON public.orders FOR SELECT
    USING (auth.uid() = user_id);

-- Users can view shipments for their orders
CREATE POLICY "Users can view own shipments"
    ON public.shipments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = shipments.order_id 
            AND orders.user_id = auth.uid()
        )
    );

-- Users can view tracking events for their shipments
CREATE POLICY "Users can view own tracking events"
    ON public.shipment_tracking_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.shipments 
            JOIN public.orders ON orders.id = shipments.order_id
            WHERE shipments.id = shipment_tracking_events.shipment_id 
            AND orders.user_id = auth.uid()
        )
    );

-- Admin policies (assuming admin_users table exists)
CREATE POLICY "Admins can view all orders"
    ON public.orders FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE admin_users.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can update orders"
    ON public.orders FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE admin_users.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage shipments"
    ON public.shipments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE admin_users.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage tracking events"
    ON public.shipment_tracking_events FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE admin_users.user_id = auth.uid()
        )
    );

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON public.orders TO authenticated;
GRANT SELECT ON public.shipments TO authenticated;
GRANT SELECT ON public.shipment_tracking_events TO authenticated;

-- ============================================================================
-- COMPLETE
-- ============================================================================
