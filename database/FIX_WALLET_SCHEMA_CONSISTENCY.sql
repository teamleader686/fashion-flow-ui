-- ============================================================================
-- FIX WALLET SCHEMA CONSISTENCY & AUTO-CREATION
-- ============================================================================
-- This ensures the handle_new_user trigger correctly populates the 
-- loyalty_wallet table used by the frontend.
-- ============================================================================

-- Step 1: Ensure loyalty_wallet table exists with correct structure
-- (Idempotent: matches USER_WALLET_SYSTEM.sql)
CREATE TABLE IF NOT EXISTS public.loyalty_wallet (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    available_balance INTEGER DEFAULT 0 CHECK (available_balance >= 0),
    affiliate_balance DECIMAL(10,2) DEFAULT 0 CHECK (affiliate_balance >= 0),
    refund_balance DECIMAL(10,2) DEFAULT 0 CHECK (refund_balance >= 0),
    promotional_balance DECIMAL(10,2) DEFAULT 0 CHECK (promotional_balance >= 0),
    total_balance DECIMAL(10,2) DEFAULT 0,
    total_earned INTEGER DEFAULT 0,
    total_redeemed INTEGER DEFAULT 0,
    frozen BOOLEAN DEFAULT false,
    frozen_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Update the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    signup_bonus INTEGER;
BEGIN
    -- 1. Create user profile
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
    ) ON CONFLICT (user_id) DO NOTHING;
    
    -- 2. Create loyalty_wallet (Standardized)
    INSERT INTO public.loyalty_wallet (user_id, available_balance)
    VALUES (NEW.id, 0)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- 3. Get signup bonus from settings (if exists)
    SELECT COALESCE(signup_bonus_coins, 0) INTO signup_bonus
    FROM public.loyalty_settings
    WHERE is_enabled = true
    LIMIT 1;
    
    -- 4. Give signup bonus if configured
    IF signup_bonus > 0 THEN
        -- Add loyalty transaction
        INSERT INTO public.loyalty_transactions (
            user_id,
            type,
            coins,
            balance_after,
            description
        ) VALUES (
            NEW.id,
            'earn',
            signup_bonus,
            signup_bonus,
            'Welcome bonus coins'
        );
        
        -- Update loyalty wallet balance
        UPDATE public.loyalty_wallet
        SET 
            available_balance = signup_bonus,
            total_earned = signup_bonus
        WHERE user_id = NEW.id;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Ensure trigger is active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE '✅ Wallet schema consistency fixed!';
    RAISE NOTICE '✅ New users will now correctly get a loyalty_wallet record.';
END $$;
