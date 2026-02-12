-- ============================================================================
-- CREATE MISSING USER PROFILES
-- ============================================================================
-- This script creates profiles for users who don't have one
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Step 1: Check which users are missing profiles
SELECT 
    au.id as user_id,
    au.email,
    'Missing Profile' as status
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.user_id
WHERE up.id IS NULL;

-- Step 2: Create profiles for users without one
INSERT INTO public.user_profiles (
    user_id,
    email,
    full_name,
    phone,
    role,
    is_active,
    email_verified
)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', au.email),
    COALESCE(au.raw_user_meta_data->>'phone', ''),
    'customer',
    true,
    au.email_confirmed_at IS NOT NULL
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.user_id
WHERE up.id IS NULL;

-- Step 3: Create wallet for users without one
INSERT INTO public.wallet (user_id, balance)
SELECT 
    au.id,
    0.00
FROM auth.users au
LEFT JOIN public.wallet w ON au.id = w.user_id
WHERE w.id IS NULL;

-- Step 4: Create loyalty coins for users without one
INSERT INTO public.loyalty_coins (user_id, available_coins)
SELECT 
    au.id,
    0
FROM auth.users au
LEFT JOIN public.loyalty_coins lc ON au.id = lc.user_id
WHERE lc.id IS NULL;

-- Step 5: Verify all users now have profiles
SELECT 
    COUNT(*) as total_users,
    COUNT(up.id) as users_with_profiles,
    COUNT(*) - COUNT(up.id) as missing_profiles
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.user_id;

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE '✅ Missing user profiles created!';
    RAISE NOTICE '✅ Wallets created for all users';
    RAISE NOTICE '✅ Loyalty coins initialized';
    RAISE NOTICE '✅ Refresh your app to see changes';
END $$;
