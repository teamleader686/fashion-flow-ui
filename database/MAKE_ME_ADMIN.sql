-- ============================================================================
-- MAKE YOUR USER AN ADMIN
-- ============================================================================
-- User ID: 9b746fe9-6896-4bbc-89cb-2b7fca159c5f
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Step 1: Update user profile to admin role
UPDATE public.user_profiles 
SET 
    role = 'admin',
    full_name = COALESCE(full_name, 'Admin User'),
    is_active = true,
    updated_at = NOW()
WHERE user_id = '9b746fe9-6896-4bbc-89cb-2b7fca159c5f';

-- Step 2: Create admin user entry with full permissions
INSERT INTO public.admin_users (
    user_id,
    admin_level,
    permissions,
    is_active,
    created_at
)
VALUES (
    '9b746fe9-6896-4bbc-89cb-2b7fca159c5f',
    'super_admin',
    '{
        "products": true,
        "orders": true,
        "users": true,
        "settings": true,
        "shipping": true,
        "coupons": true,
        "affiliate": true,
        "instagram": true,
        "reports": true
    }'::jsonb,
    true,
    NOW()
)
ON CONFLICT (user_id) 
DO UPDATE SET
    admin_level = 'super_admin',
    permissions = '{
        "products": true,
        "orders": true,
        "users": true,
        "settings": true,
        "shipping": true,
        "coupons": true,
        "affiliate": true,
        "instagram": true,
        "reports": true
    }'::jsonb,
    is_active = true;

-- Step 3: Verify admin user was created
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
WHERE up.user_id = '9b746fe9-6896-4bbc-89cb-2b7fca159c5f';

-- Step 4: Check admin access
SELECT 
    CASE 
        WHEN up.role = 'admin' AND au.is_active = true 
        THEN '✅ Admin Access Granted'
        ELSE '❌ Admin Access Denied'
    END as status,
    up.email,
    up.role,
    au.admin_level
FROM public.user_profiles up
LEFT JOIN public.admin_users au ON up.user_id = au.user_id
WHERE up.user_id = '9b746fe9-6896-4bbc-89cb-2b7fca159c5f';

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE '✅ You are now a SUPER ADMIN!';
    RAISE NOTICE '✅ Full access to all admin features';
    RAISE NOTICE '✅ Logout and login again to see admin panel';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Your Permissions:';
    RAISE NOTICE '   ✅ Products Management';
    RAISE NOTICE '   ✅ Orders Management';
    RAISE NOTICE '   ✅ Users Management';
    RAISE NOTICE '   ✅ Settings Management';
    RAISE NOTICE '   ✅ Shipping Management';
    RAISE NOTICE '   ✅ Coupons & Offers';
    RAISE NOTICE '   ✅ Affiliate System';
    RAISE NOTICE '   ✅ Instagram Marketing';
    RAISE NOTICE '   ✅ Reports & Analytics';
END $$;
