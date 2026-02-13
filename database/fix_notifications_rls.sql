-- ============================================================================
-- FIX NOTIFICATIONS RLS POLICIES
-- ============================================================================
-- This script fixes the RLS policies for notifications table
-- ============================================================================

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can view all notifications" ON notifications;

-- Recreate policies with proper logic

-- Policy 1: Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON notifications
FOR SELECT
USING (
    user_id = auth.uid()
);

-- Policy 2: Admins can view admin notifications
CREATE POLICY "Admins can view admin notifications"
ON notifications
FOR SELECT
USING (
    role = 'admin' AND
    EXISTS (
        SELECT 1 FROM admin_users
        WHERE admin_users.user_id = auth.uid()
        AND admin_users.is_active = true
    )
);

-- Policy 3: Allow service role to insert notifications
CREATE POLICY "Service can insert notifications"
ON notifications
FOR INSERT
WITH CHECK (true);

-- Policy 4: Users can update their own notifications
CREATE POLICY "Users can update own notifications"
ON notifications
FOR UPDATE
USING (user_id = auth.uid());

-- Policy 5: Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
ON notifications
FOR DELETE
USING (user_id = auth.uid());

-- Verify policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'notifications'
ORDER BY policyname;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'NOTIFICATIONS RLS POLICIES FIXED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Policies recreated: 5';
    RAISE NOTICE 'System ready for use!';
    RAISE NOTICE '========================================';
END $$;
