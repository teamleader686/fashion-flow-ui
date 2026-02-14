-- E2E Test Script for Affiliate System
-- This script automatically finds an existing user and tests the referral triggers.
BEGIN;

-- 1. Create a test affiliate
INSERT INTO public.affiliates (id, name, email, mobile, referral_code, commission_type, commission_value, status)
VALUES (
    '00000000-0000-0000-0000-000000000001', 
    'Tester Affiliate', 
    'tester@affiliate.com', 
    '1234567890', 
    'TESTREF', 
    'percentage', 
    10.00, 
    'active'
) ON CONFLICT (email) DO UPDATE SET referral_code = 'TESTREF';

-- 2. AUTOMATED LOGIC BLOCK
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Try to find an existing user from user_profiles to satisfy foreign key constraints
    SELECT user_id INTO v_user_id FROM public.user_profiles LIMIT 1;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'No users found in user_profiles. Please sign up on the website first before running this test.';
    END IF;

    RAISE NOTICE 'Using User ID: % for testing', v_user_id;

    -- Update this user to have our test affiliate persistently linked
    UPDATE public.user_profiles 
    SET referred_by_affiliate = '00000000-0000-0000-0000-000000000001'
    WHERE user_id = v_user_id;

    -- 3. Create a test order for this user
    -- We leave affiliate_id as NULL to verify the trigger 'trigger_link_affiliate_to_order' picks it up
    INSERT INTO public.orders (
        id, 
        order_number, 
        user_id, 
        customer_name, 
        customer_phone, 
        shipping_address_line1, 
        shipping_city, 
        shipping_state, 
        shipping_zip, 
        subtotal, 
        total_amount, 
        status, 
        payment_method,
        affiliate_id -- Explicitly NULL to test auto-linking
    ) VALUES (
        '00000000-0000-0000-0000-000000000003',
        'TEST-ORD-001',
        v_user_id,
        'Test Customer',
        '0987654321',
        'Test Street',
        'Mumbai',
        'Maharashtra',
        '400001',
        1000.00,
        1000.00,
        'pending',
        'cod',
        NULL
    );

    -- 4. Create the mapping record in affiliate_orders
    -- Providing both order_total and order_amount to satisfy different schema variants
    INSERT INTO public.affiliate_orders (
        order_id, 
        affiliate_id, 
        user_id, 
        order_total, 
        order_amount, 
        commission_type,
        commission_rate,
        commission_amount, 
        commission_status,
        status
    )
    VALUES (
        '00000000-0000-0000-0000-000000000003',
        '00000000-0000-0000-0000-000000000001',
        v_user_id,
        1000.00,
        1000.00,
        'percentage',
        10.00,
        100.00,
        'pending',
        'pending'
    );

    -- 5. Mark order as delivered to test the commission approval trigger
    UPDATE public.orders SET status = 'delivered' WHERE id = '00000000-0000-0000-0000-000000000003';

    RAISE NOTICE 'Test flow completed successfully.';
END $$;

-- 6. VERIFICATION QUERIES
-- Check if the order was auto-linked to the affiliate
SELECT 'Order Affiliate Link' as test, affiliate_id, status as order_status 
FROM public.orders 
WHERE id = '00000000-0000-0000-0000-000000000003';

-- Check if the commission was auto-approved on delivery
SELECT 'Commission Status' as test, commission_status 
FROM public.affiliate_orders 
WHERE order_id = '00000000-0000-0000-0000-000000000003';

ROLLBACK; -- Ensures your database stays clean after the test
