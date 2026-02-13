-- ============================================================================
-- STEP BY STEP FIX - Run each section separately to find the issue
-- ============================================================================

-- ============================================================================
-- STEP 1: Fix user_profiles table
-- ============================================================================
-- Run this first and check if it works

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS loyalty_coins_balance INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_user_profiles_loyalty_balance 
ON public.user_profiles(loyalty_coins_balance);

SELECT 'Step 1 Complete: user_profiles fixed' as status;

-- ============================================================================
-- STOP HERE AND CHECK IF STEP 1 WORKED
-- If yes, continue to Step 2
-- ============================================================================
