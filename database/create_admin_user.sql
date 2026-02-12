-- ============================================================================
-- CREATE ADMIN USER SCRIPT
-- ============================================================================
-- This script helps you create an admin user for the e-commerce platform
-- Run this in Supabase SQL Editor after creating a user via Authentication UI
-- ============================================================================

-- INSTRUCTIONS:
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Click "Add User" → "Create new user"
-- 3. Enter email and password, check "Auto Confirm User"
-- 4. Copy the User ID (UUID) from the created user
-- 5. Replace 'YOUR_USER_ID_HERE' below with the actual UUID
-- 6. Run this script in SQL Editor

-- ============================================================================
-- STEP 1: Update user profile to admin role
-- ============================================================================
UPDATE public.user_profiles 
SET 
  role = 'admin',
  full_name = 'Admin User',  -- Change this to actual name
  is_active = true
WHERE user_id = 'YOUR_USER_ID_HERE';

-- ============================================================================
-- STEP 2: Create admin user entry with permissions
-- ============================================================================
INSERT INTO public.admin_users (
  user_id, 
  admin_level, 
  permissions, 
  is_active
)
VALUES (
  'YOUR_USER_ID_HERE',
  'super_admin',  -- Options: 'super_admin', 'admin', 'moderator'
  '{
    "products": true,
    "orders": true,
    "users": true,
    "settings": true
  }'::jsonb,
  true
)
ON CONFLICT (user_id) DO UPDATE
SET 
  admin_level = EXCLUDED.admin_level,
  permissions = EXCLUDED.permissions,
  is_active = EXCLUDED.is_active;

-- ============================================================================
-- STEP 3: Verify admin user was created
-- ============================================================================
SELECT 
  up.user_id,
  up.email,
  up.full_name,
  up.role,
  au.admin_level,
  au.permissions,
  au.is_active as admin_active
FROM public.user_profiles up
LEFT JOIN public.admin_users au ON up.user_id = au.user_id
WHERE up.user_id = 'YOUR_USER_ID_HERE';

-- ============================================================================
-- ALTERNATIVE: Create admin user directly (if auth.users is accessible)
-- ============================================================================
-- Note: This might not work if you don't have direct access to auth.users
-- It's better to create users via Supabase Dashboard UI

/*
-- Create user in auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@example.com',
  crypt('your_secure_password', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Admin User"}'::jsonb,
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
)
RETURNING id;
*/

-- ============================================================================
-- QUICK REFERENCE: Admin Levels
-- ============================================================================
-- super_admin: Full access to all features
-- admin: Standard admin access (can manage products, orders, users)
-- moderator: Limited access (view only, can approve reviews)

-- ============================================================================
-- QUICK REFERENCE: Permissions
-- ============================================================================
-- products: Can add, edit, delete products
-- orders: Can view and manage orders
-- users: Can view and manage customers
-- settings: Can change website settings

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================

-- Check if user exists in auth.users
-- SELECT id, email, email_confirmed_at FROM auth.users WHERE email = 'admin@example.com';

-- Check if user profile exists
-- SELECT * FROM public.user_profiles WHERE email = 'admin@example.com';

-- Check if admin user entry exists
-- SELECT * FROM public.admin_users WHERE user_id = 'YOUR_USER_ID_HERE';

-- Delete admin user (if needed to recreate)
-- DELETE FROM public.admin_users WHERE user_id = 'YOUR_USER_ID_HERE';

-- ============================================================================
-- MULTIPLE ADMIN USERS
-- ============================================================================
-- To create multiple admin users, repeat the process:
-- 1. Create user via Supabase Dashboard
-- 2. Copy User ID
-- 3. Run UPDATE and INSERT queries with new User ID

-- Example for second admin:
/*
UPDATE public.user_profiles 
SET role = 'admin', full_name = 'Second Admin'
WHERE user_id = 'SECOND_USER_ID';

INSERT INTO public.admin_users (user_id, admin_level, permissions, is_active)
VALUES ('SECOND_USER_ID', 'admin', '{"products": true, "orders": true, "users": false, "settings": false}'::jsonb, true);
*/

-- ============================================================================
-- SECURITY NOTES
-- ============================================================================
-- 1. Always use strong passwords for admin accounts
-- 2. Enable 2FA in Supabase for admin emails
-- 3. Regularly review admin user list
-- 4. Disable inactive admin accounts
-- 5. Use different admin levels based on responsibilities
-- 6. Monitor admin activity through order_status_history table

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================
