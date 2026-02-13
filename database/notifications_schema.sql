-- ============================================================================
-- CENTRALIZED NOTIFICATIONS SYSTEM
-- ============================================================================
-- This schema supports notifications for:
-- - Orders
-- - Shipping
-- - Instagram Marketing
-- - Affiliate Marketing
-- ============================================================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'user', 'affiliate', 'instagram_user')),
    module TEXT NOT NULL CHECK (module IN ('order', 'shipping', 'instagram', 'affiliate', 'system')),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    reference_id UUID,
    reference_type TEXT,
    action_url TEXT,
    action_label TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    archived_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_role ON notifications(role);
CREATE INDEX IF NOT EXISTS idx_notifications_module ON notifications(module);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_role_status ON notifications(user_id, role, status);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_role_module ON notifications(user_id, role, module);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own notifications
CREATE POLICY "Users can view own notifications"
    ON notifications
    FOR SELECT
    USING (
        user_id = auth.uid()
        OR
        (role = 'admin' AND EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.user_id = auth.uid()
            AND admin_users.is_active = true
        ))
    );

-- Policy: Users can update their own notifications (mark as read/archived)
CREATE POLICY "Users can update own notifications"
    ON notifications
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Policy: Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
    ON notifications
    FOR DELETE
    USING (user_id = auth.uid());

-- Policy: System can insert notifications (via service role)
CREATE POLICY "System can insert notifications"
    ON notifications
    FOR INSERT
    WITH CHECK (true);

-- ============================================================================
-- NOTIFICATION PREFERENCES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    order_updates BOOLEAN DEFAULT true,
    shipping_updates BOOLEAN DEFAULT true,
    marketing_updates BOOLEAN DEFAULT true,
    affiliate_updates BOOLEAN DEFAULT true,
    instagram_updates BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own preferences
CREATE POLICY "Users can view own preferences"
    ON notification_preferences
    FOR SELECT
    USING (user_id = auth.uid());

-- Policy: Users can update their own preferences
CREATE POLICY "Users can update own preferences"
    ON notification_preferences
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Policy: Users can insert their own preferences
CREATE POLICY "Users can insert own preferences"
    ON notification_preferences
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to automatically create notification preferences for new users
CREATE OR REPLACE FUNCTION create_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create preferences when user is created
CREATE TRIGGER on_user_created_notification_preferences
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_notification_preferences();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for notification_preferences
CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS FOR NOTIFICATION STATS
-- ============================================================================

-- Function to get unread count for a user
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID, p_role TEXT)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM notifications
        WHERE user_id = p_user_id
        AND role = p_role
        AND status = 'unread'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID, p_role TEXT)
RETURNS INTEGER AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    UPDATE notifications
    SET status = 'read',
        read_at = NOW()
    WHERE user_id = p_user_id
    AND role = p_role
    AND status = 'unread';
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RETURN affected_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Uncomment to insert sample notifications for testing
/*
INSERT INTO notifications (user_id, role, module, type, title, message, priority, reference_id, action_url, action_label)
VALUES
    (auth.uid(), 'user', 'order', 'order_placed', 'Order Placed Successfully', 'Your order #12345 has been placed successfully.', 'high', uuid_generate_v4(), '/account?tab=orders', 'View Order'),
    (auth.uid(), 'user', 'shipping', 'tracking_generated', 'Tracking Number Generated', 'Tracking number ABC123 generated for your order.', 'high', uuid_generate_v4(), '/account?tab=orders', 'Track Order'),
    (auth.uid(), 'user', 'order', 'order_delivered', 'Order Delivered', 'Your order has been delivered successfully.', 'high', uuid_generate_v4(), '/account?tab=orders', 'View Order');
*/

-- ============================================================================
-- CLEANUP (Optional - use with caution)
-- ============================================================================

-- Function to delete old archived notifications (older than 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM notifications
    WHERE status = 'archived'
    AND archived_at < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE notifications IS 'Centralized notifications for all modules (Orders, Shipping, Instagram, Affiliate)';
COMMENT ON TABLE notification_preferences IS 'User preferences for notification delivery methods';
COMMENT ON COLUMN notifications.module IS 'Module that generated the notification: order, shipping, instagram, affiliate, system';
COMMENT ON COLUMN notifications.type IS 'Specific notification type within the module';
COMMENT ON COLUMN notifications.priority IS 'Notification priority: low, medium, high, urgent';
COMMENT ON COLUMN notifications.reference_id IS 'ID of the related entity (order_id, shipment_id, campaign_id, etc.)';
COMMENT ON COLUMN notifications.reference_type IS 'Type of the referenced entity (order, shipment, campaign, etc.)';
