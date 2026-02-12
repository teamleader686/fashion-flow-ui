-- ============================================
-- Fix Instagram Campaigns RLS Policy
-- ============================================
-- Error: 400 Bad Request when creating campaign
-- Cause: RLS policy requires admin role in user_profiles
-- Solution: Check and fix user role
-- ============================================

-- Step 1: Check current user's role
SELECT 
  user_id,
  email,
  role,
  created_at
FROM user_profiles
WHERE user_id = auth.uid();

-- ============================================
-- If no row returned or role is not 'admin':
-- ============================================

-- Step 2: Make yourself admin (replace with your actual user_id)
-- Get your user_id first:
SELECT auth.uid() as my_user_id;

-- Then update your role to admin:
UPDATE user_profiles
SET role = 'admin'
WHERE user_id = auth.uid();

-- ============================================
-- Alternative: Create profile if missing
-- ============================================

-- If user_profiles row doesn't exist, create it:
INSERT INTO user_profiles (user_id, email, role)
SELECT 
  auth.uid(),
  (SELECT email FROM auth.users WHERE id = auth.uid()),
  'admin'
WHERE NOT EXISTS (
  SELECT 1 FROM user_profiles WHERE user_id = auth.uid()
);

-- ============================================
-- Step 3: Verify admin role
-- ============================================
SELECT 
  user_id,
  email,
  role,
  created_at
FROM user_profiles
WHERE user_id = auth.uid();

-- Expected: role should be 'admin'

-- ============================================
-- Step 4: Test RLS policy
-- ============================================

-- This should return TRUE if you're admin:
SELECT EXISTS (
  SELECT 1 FROM user_profiles
  WHERE user_profiles.user_id = auth.uid()
  AND user_profiles.role = 'admin'
) as am_i_admin;

-- Expected: am_i_admin = true

-- ============================================
-- Now test campaign creation from frontend!
-- ============================================
