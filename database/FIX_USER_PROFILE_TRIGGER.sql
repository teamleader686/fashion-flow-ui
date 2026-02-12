-- ============================================================================
-- FIX USER PROFILE AUTO-CREATION TRIGGER
-- ============================================================================
-- This ensures new users automatically get profiles, wallet, and loyalty coins
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Step 1: Drop existing trigger and function (if any)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Step 2: Create improved function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    signup_bonus INTEGER;
BEGIN
    -- Create user profile
    INSERT INTO public.user_profiles (
        user_id,
        email,
        full_name,
        phone,
        role,
        is_active,
        email_verified
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        'customer',
        true,
        NEW.email_confirmed_at IS NOT NULL
    );
    
    -- Create wallet
    INSERT INTO public.wallet (user_id, balance)
    VALUES (NEW.id, 0.00);
    
    -- Create loyalty coins account
    INSERT INTO public.loyalty_coins (user_id, available_coins, total_earned)
    VALUES (NEW.id, 0, 0);
    
    -- Get signup bonus from settings (if exists)
    SELECT COALESCE(signup_bonus_coins, 0) INTO signup_bonus
    FROM public.loyalty_settings
    WHERE is_enabled = true
    LIMIT 1;
    
    -- Give signup bonus if configured
    IF signup_bonus > 0 THEN
        -- Add loyalty transaction
        INSERT INTO public.loyalty_transactions (
            user_id,
            transaction_type,
            coins,
            balance_after,
            source,
            description
        ) VALUES (
            NEW.id,
            'earned',
            signup_bonus,
            signup_bonus,
            'signup',
            'Welcome bonus coins'
        );
        
        -- Update loyalty coins balance
        UPDATE public.loyalty_coins
        SET 
            available_coins = signup_bonus,
            total_earned = signup_bonus
        WHERE user_id = NEW.id;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail user creation
        RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Verify trigger is created
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE '✅ User profile trigger fixed!';
    RAISE NOTICE '✅ New users will automatically get:';
    RAISE NOTICE '   - User profile';
    RAISE NOTICE '   - Wallet (₹0)';
    RAISE NOTICE '   - Loyalty coins (with signup bonus)';
END $$;
