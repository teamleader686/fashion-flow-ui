-- ============================================
-- Make Yourself Admin for Instagram Marketing
-- ============================================
-- Simple fix: Update role directly using your user_id
-- ============================================

-- Step 1: Find your user_id from existing profile
SELECT 
  id,
  email,
  role,
  country
FROM user_profiles
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- Step 2: Copy your ID from above and paste below
-- Replace 'YOUR_USER_ID_HERE' with actual ID
-- ============================================

-- Update your role to admin:
UPDATE user_profiles
SET role = 'admin'
WHERE id = 'YOUR_USER_ID_HERE';

-- Example (replace with your actual ID):
-- UPDATE user_profiles
-- SET role = 'admin'
-- WHERE id = '5be32cb3-cb0a-4873-89ff-34cea60d5a03';

-- ============================================
-- Step 3: Verify the update
-- ============================================
SELECT 
  id,
  email,
  role,
  country,
  created_at
FROM user_profiles
WHERE id = 'YOUR_USER_ID_HERE';

-- Expected: role should be 'admin'

-- ============================================
-- Alternative: Update ALL profiles to admin (if only you exist)
-- ============================================

-- If you're the only user, just update all:
-- UPDATE user_profiles SET role = 'admin';

-- Then verify:
-- SELECT id, email, role FROM user_profiles;

-- ============================================
-- Now test campaign creation from frontend!
-- ============================================
