-- ============================================
-- Quick Admin Fix - 10 Seconds
-- ============================================

-- Step 1: Check all users
SELECT id, email, role, country FROM user_profiles;

-- Step 2: Make everyone admin (safest if you're the only user)
UPDATE user_profiles SET role = 'admin';

-- Step 3: Verify
SELECT id, email, role FROM user_profiles;

-- ============================================
-- Expected: All users should have role = 'admin'
-- Now test campaign creation!
-- ============================================
