-- ============================================================================
-- CREATE PROFILE FOR YOUR USER
-- ============================================================================
-- User ID: 9b746fe9-6896-4bbc-89cb-2b7fca159c5f
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Step 1: Check if user exists in auth.users
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    raw_user_meta_data
FROM auth.users 
WHERE id = '9b746fe9-6896-4bbc-89cb-2b7fca159c5f';

-- Step 2: Create user profile (if not exists)
INSERT INTO public.user_profiles (
    user_id,
    email,
    full_name,
    phone,
    role,
    is_active,
    email_verified,
    created_at
)
SELECT 
    id,
    email,
    COALESCE(raw_user_meta_data->>'full_name', email, 'User'),
    COALESCE(raw_user_meta_data->>'phone', ''),
    'customer',
    true,
    email_confirmed_at IS NOT NULL,
    NOW()
FROM auth.users 
WHERE id = '9b746fe9-6896-4bbc-89cb-2b7fca159c5f'
ON CONFLICT (user_id) DO NOTHING;

-- Step 3: Create wallet (if not exists)
INSERT INTO public.wallet (
    user_id,
    balance,
    total_credited,
    total_debited,
    created_at
)
VALUES (
    '9b746fe9-6896-4bbc-89cb-2b7fca159c5f',
    0.00,
    0.00,
    0.00,
    NOW()
)
ON CONFLICT (user_id) DO NOTHING;

-- Step 4: Create loyalty coins (if not exists)
INSERT INTO public.loyalty_coins (
    user_id,
    available_coins,
    total_earned,
    total_redeemed,
    total_expired,
    created_at
)
VALUES (
    '9b746fe9-6896-4bbc-89cb-2b7fca159c5f',
    50,  -- Signup bonus
    50,
    0,
    0,
    NOW()
)
ON CONFLICT (user_id) DO NOTHING;

-- Step 5: Add signup bonus transaction (if loyalty coins were created)
INSERT INTO public.loyalty_transactions (
    user_id,
    transaction_type,
    coins,
    balance_after,
    coin_value,
    source,
    description,
    created_at
)
SELECT 
    '9b746fe9-6896-4bbc-89cb-2b7fca159c5f',
    'earned',
    50,
    50,
    1.00,
    'signup',
    'Welcome bonus - Thank you for joining!',
    NOW()
WHERE EXISTS (
    SELECT 1 FROM public.loyalty_coins 
    WHERE user_id = '9b746fe9-6896-4bbc-89cb-2b7fca159c5f'
)
AND NOT EXISTS (
    SELECT 1 FROM public.loyalty_transactions 
    WHERE user_id = '9b746fe9-6896-4bbc-89cb-2b7fca159c5f' 
    AND source = 'signup'
);

-- Step 6: Verify everything was created
SELECT 
    'User Profile' as item,
    CASE WHEN EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = '9b746fe9-6896-4bbc-89cb-2b7fca159c5f'
    ) THEN '✅ Created' ELSE '❌ Missing' END as status
UNION ALL
SELECT 
    'Wallet',
    CASE WHEN EXISTS (
        SELECT 1 FROM public.wallet 
        WHERE user_id = '9b746fe9-6896-4bbc-89cb-2b7fca159c5f'
    ) THEN '✅ Created' ELSE '❌ Missing' END
UNION ALL
SELECT 
    'Loyalty Coins',
    CASE WHEN EXISTS (
        SELECT 1 FROM public.loyalty_coins 
        WHERE user_id = '9b746fe9-6896-4bbc-89cb-2b7fca159c5f'
    ) THEN '✅ Created' ELSE '❌ Missing' END;

-- Step 7: Show your profile details
SELECT 
    up.user_id,
    up.email,
    up.full_name,
    up.role,
    w.balance as wallet_balance,
    lc.available_coins as loyalty_coins,
    up.created_at
FROM public.user_profiles up
LEFT JOIN public.wallet w ON up.user_id = w.user_id
LEFT JOIN public.loyalty_coins lc ON up.user_id = lc.user_id
WHERE up.user_id = '9b746fe9-6896-4bbc-89cb-2b7fca159c5f';

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE '✅ Profile created for user: 9b746fe9-6896-4bbc-89cb-2b7fca159c5f';
    RAISE NOTICE '✅ Wallet initialized with ₹0';
    RAISE NOTICE '✅ Loyalty coins: 50 (signup bonus)';
    RAISE NOTICE '✅ Refresh your browser and login again!';
END $$;
