-- ============================================================================
-- FIX NOTIFICATIONS TABLE - COMPLETE
-- ============================================================================
-- This script will fix the notifications table completely
-- ============================================================================

-- Step 1: Check if table exists and what columns it has
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        RAISE NOTICE '✓ Notifications table exists';
    ELSE
        RAISE NOTICE '✗ Notifications table does not exist - will create';
    END IF;
END $$;

-- Step 2: Create table if it doesn't exist
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

-- Step 3: Add missing columns if table exists but incomplete
DO $$
BEGIN
    -- Add role column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'role'
    ) THEN
        ALTER TABLE notifications ADD COLUMN role TEXT NOT NULL DEFAULT 'user' 
            CHECK (role IN ('admin', 'user', 'affiliate', 'instagram_user'));
        RAISE NOTICE '✓ Added role column';
    ELSE
        RAISE NOTICE '○ role column already exists';
    END IF;

    -- Add module column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'module'
    ) THEN
        ALTER TABLE notifications ADD COLUMN module TEXT NOT NULL DEFAULT 'system'
            CHECK (module IN ('order', 'shipping', 'instagram', 'affiliate', 'system'));
        RAISE NOTICE '✓ Added module column';
    ELSE
        RAISE NOTICE '○ module column already exists';
    END IF;

    -- Add priority column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'priority'
    ) THEN
        ALTER TABLE notifications ADD COLUMN priority TEXT NOT NULL DEFAULT 'medium'
            CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
        RAISE NOTICE '✓ Added priority column';
    ELSE
        RAISE NOTICE '○ priority column already exists';
    END IF;

    -- Add reference_id column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'reference_id'
    ) THEN
        ALTER TABLE notifications ADD COLUMN reference_id UUID;
        RAISE NOTICE '✓ Added reference_id column';
    ELSE
        RAISE NOTICE '○ reference_id column already exists';
    END IF;

    -- Add reference_type column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'reference_type'
    ) THEN
        ALTER TABLE notifications ADD COLUMN reference_type TEXT;
        RAISE NOTICE '✓ Added reference_type column';
    ELSE
        RAISE NOTICE '○ reference_type column already exists';
    END IF;

    -- Add action_url column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'action_url'
    ) THEN
        ALTER TABLE notifications ADD COLUMN action_url TEXT;
        RAISE NOTICE '✓ Added action_url column';
    ELSE
        RAISE NOTICE '○ action_url column already exists';
    END IF;

    -- Add action_label column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'action_label'
    ) THEN
        ALTER TABLE notifications ADD COLUMN action_label TEXT;
        RAISE NOTICE '✓ Added action_label column';
    ELSE
        RAISE NOTICE '○ action_label column already exists';
    END IF;

    -- Add metadata column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'metadata'
    ) THEN
        ALTER TABLE notifications ADD COLUMN metadata JSONB;
        RAISE NOTICE '✓ Added metadata column';
    ELSE
        RAISE NOTICE '○ metadata column already exists';
    END IF;

    -- Add read_at column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'read_at'
    ) THEN
        ALTER TABLE notifications ADD COLUMN read_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE '✓ Added read_at column';
    ELSE
        RAISE NOTICE '○ read_at column already exists';
    END IF;

    -- Add archived_at column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'archived_at'
    ) THEN
        ALTER TABLE notifications ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE '✓ Added archived_at column';
    ELSE
        RAISE NOTICE '○ archived_at column already exists';
    END IF;
END $$;

-- Step 4: Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_role ON notifications(role);
CREATE INDEX IF NOT EXISTS idx_notifications_module ON notifications(module);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_role_status ON notifications(user_id, role, status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_role_module ON notifications(user_id, role, module);

-- Step 5: Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Step 6: Drop old policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can view all notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can view admin notifications" ON notifications;
DROP POLICY IF EXISTS "Service can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;

-- Step 7: Create new policies

-- Policy 1: Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON notifications
FOR SELECT
USING (user_id = auth.uid());

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

-- Step 8: Verify setup
DO $$
DECLARE
    col_count INTEGER;
    idx_count INTEGER;
    policy_count INTEGER;
    notif_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO col_count 
    FROM information_schema.columns 
    WHERE table_name = 'notifications';
    
    SELECT COUNT(*) INTO idx_count 
    FROM pg_indexes 
    WHERE tablename = 'notifications';
    
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE tablename = 'notifications';
    
    SELECT COUNT(*) INTO notif_count 
    FROM notifications;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '   NOTIFICATIONS TABLE FIXED! ✓';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Columns: %', col_count;
    RAISE NOTICE 'Indexes: %', idx_count;
    RAISE NOTICE 'RLS Policies: %', policy_count;
    RAISE NOTICE 'Notifications: %', notif_count;
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'System ready for use!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
END $$;

-- Step 9: Show table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;
