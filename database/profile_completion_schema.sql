-- ============================================================================
-- USER PROFILE COMPLETION SYSTEM - DATABASE SCHEMA UPDATE
-- ============================================================================
-- This migration adds fields needed for profile completion tracking
-- Run this in Supabase SQL Editor
-- ============================================================================

-- 1. Add missing fields to user_profiles table
DO $$ 
BEGIN
    -- Add anniversary_date if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='user_profiles' AND column_name='anniversary_date') THEN
        ALTER TABLE user_profiles ADD COLUMN anniversary_date DATE;
    END IF;

    -- Add profile_completed if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='user_profiles' AND column_name='profile_completed') THEN
        ALTER TABLE user_profiles ADD COLUMN profile_completed BOOLEAN DEFAULT false;
    END IF;

    -- Make phone nullable initially (will be required after profile completion)
    ALTER TABLE user_profiles ALTER COLUMN phone DROP NOT NULL;
    
    -- Make full_name nullable initially (will be required after profile completion)
    ALTER TABLE user_profiles ALTER COLUMN full_name DROP NOT NULL;
END $$;

-- 2. Create index for profile_completed for faster queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_profile_completed 
ON user_profiles(profile_completed);

-- 3. Create index for phone number lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone 
ON user_profiles(phone) WHERE phone IS NOT NULL;

-- 4. Update existing profiles to mark as completed if they have required fields
UPDATE user_profiles 
SET profile_completed = true 
WHERE phone IS NOT NULL 
  AND full_name IS NOT NULL 
  AND profile_completed = false;

-- 5. Create a function to check if profile is complete
CREATE OR REPLACE FUNCTION check_profile_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-update profile_completed based on required fields
    IF NEW.phone IS NOT NULL AND NEW.full_name IS NOT NULL THEN
        NEW.profile_completed := true;
    ELSE
        NEW.profile_completed := false;
    END IF;
    
    -- Update updated_at timestamp
    NEW.updated_at := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger to auto-update profile_completed
DROP TRIGGER IF EXISTS trigger_check_profile_completion ON user_profiles;
CREATE TRIGGER trigger_check_profile_completion
    BEFORE INSERT OR UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION check_profile_completion();

-- 7. Create a view for incomplete profiles (for admin monitoring)
CREATE OR REPLACE VIEW incomplete_profiles AS
SELECT 
    up.id,
    up.user_id,
    up.email,
    up.full_name,
    up.phone,
    up.city,
    up.created_at,
    up.last_login_at,
    CASE 
        WHEN up.phone IS NULL THEN 'Missing Phone'
        WHEN up.full_name IS NULL THEN 'Missing Name'
        ELSE 'Complete'
    END as missing_field
FROM user_profiles up
WHERE up.profile_completed = false
  AND up.role = 'customer'
ORDER BY up.created_at DESC;

-- 8. Grant permissions for the view
GRANT SELECT ON incomplete_profiles TO authenticated;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if all columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_profiles'
  AND column_name IN ('phone', 'full_name', 'city', 'date_of_birth', 'anniversary_date', 'gender', 'profile_completed')
ORDER BY column_name;

-- Count incomplete profiles
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN profile_completed = true THEN 1 END) as completed_profiles,
    COUNT(CASE WHEN profile_completed = false THEN 1 END) as incomplete_profiles,
    ROUND(COUNT(CASE WHEN profile_completed = true THEN 1 END)::numeric / NULLIF(COUNT(*), 0)::numeric * 100, 2) as completion_rate
FROM user_profiles
WHERE role = 'customer';

-- View incomplete profiles
SELECT * FROM incomplete_profiles LIMIT 10;

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================
-- Uncomment to rollback changes

-- DROP VIEW IF EXISTS incomplete_profiles;
-- DROP TRIGGER IF EXISTS trigger_check_profile_completion ON user_profiles;
-- DROP FUNCTION IF EXISTS check_profile_completion();
-- DROP INDEX IF EXISTS idx_user_profiles_profile_completed;
-- DROP INDEX IF EXISTS idx_user_profiles_phone;
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS anniversary_date;
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS profile_completed;
