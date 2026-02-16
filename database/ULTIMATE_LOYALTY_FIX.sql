-- ============================================================================
-- ULTIMATE LOYALTY SYSTEM FIX
-- ============================================================================
-- 1. Standardize ALL table columns to use 'type' instead of 'transaction_type'
-- 2. Clean up ALL legacy and duplicate triggers
-- 3. Install robust triggers for rewards and refunds
-- ============================================================================

-- STEP 1: DROP ALL KNOWN COMPETING TRIGGERS & FUNCTIONS
DROP TRIGGER IF EXISTS trigger_process_loyalty_on_delivery ON public.orders;
DROP TRIGGER IF EXISTS tr_earn_coins_on_delivery ON public.orders;
DROP TRIGGER IF EXISTS tr_handle_order_status_wallet_changes ON public.orders;
DROP TRIGGER IF EXISTS tr_process_loyalty_transaction ON public.loyalty_transactions;
DROP TRIGGER IF EXISTS trigger_log_order_status ON public.orders;

-- STEP 2: NORMALIZE TABLES
DO $$ 
BEGIN 
    -- 2.1 Fix loyalty_transactions column names
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loyalty_transactions' AND column_name = 'transaction_type') THEN
        ALTER TABLE public.loyalty_transactions RENAME COLUMN transaction_type TO type;
    END IF;

    -- 2.2 Ensure loyalty_transactions has coins column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loyalty_transactions' AND column_name = 'coins') THEN
        ALTER TABLE public.loyalty_transactions ADD COLUMN coins INTEGER DEFAULT 0;
    END IF;

    -- 2.3 Relax constraints for trigger computation
    ALTER TABLE public.loyalty_transactions ALTER COLUMN balance_after DROP NOT NULL;
    
    -- 2.4 Add balance_before if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loyalty_transactions' AND column_name = 'balance_before') THEN
        ALTER TABLE public.loyalty_transactions ADD COLUMN balance_before INTEGER;
    END IF;
END $$;

-- STEP 3: CREATE UNIFIED TRANSACTION PROCESSOR
CREATE OR REPLACE FUNCTION process_loyalty_transaction()
RETURNS TRIGGER AS $$
DECLARE
    v_old_balance INTEGER;
BEGIN
    -- 1. Ensure wallet exists
    INSERT INTO public.loyalty_wallet (user_id, available_balance)
    VALUES (NEW.user_id, 0)
    ON CONFLICT (user_id) DO NOTHING;

    -- 2. Get current balance
    SELECT available_balance INTO v_old_balance 
    FROM public.loyalty_wallet 
    WHERE user_id = NEW.user_id;

    NEW.balance_before := COALESCE(v_old_balance, 0);

    -- 3. Normalize 'earned' to 'earn' etc. if they come from old code
    IF NEW.type = 'earned' THEN NEW.type := 'earn'; END IF;
    IF NEW.type = 'redeemed' THEN NEW.type := 'redeem'; END IF;

    -- 4. Update wallet balance
    IF NEW.type IN ('earn', 'refund', 'promotional', 'affiliate_credit') OR (NEW.type = 'admin_adjust' AND NEW.coins > 0) THEN
        UPDATE public.loyalty_wallet 
        SET available_balance = available_balance + ABS(NEW.coins),
            total_earned = total_earned + (CASE WHEN NEW.type = 'earn' THEN ABS(NEW.coins) ELSE 0 END),
            updated_at = NOW()
        WHERE user_id = NEW.user_id;
    ELSIF NEW.type IN ('redeem', 'expire') OR (NEW.type = 'admin_adjust' AND NEW.coins < 0) THEN
        UPDATE public.loyalty_wallet 
        SET available_balance = available_balance - ABS(NEW.coins),
            total_redeemed = total_redeemed + (CASE WHEN NEW.type = 'redeem' THEN ABS(NEW.coins) ELSE 0 END),
            updated_at = NOW()
        WHERE user_id = NEW.user_id;
    END IF;

    -- 5. Set balance_after
    SELECT available_balance INTO NEW.balance_after FROM public.loyalty_wallet WHERE user_id = NEW.user_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 4: CREATE UNIFIED ORDER REWARDS HANDLER
CREATE OR REPLACE FUNCTION earn_coins_on_delivery()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process when order status changes to 'delivered'
    IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
        -- Use pre-calculated value from order
        IF COALESCE(NEW.total_coins_to_earn, 0) > 0 THEN
            -- Check for duplicates
            IF NOT EXISTS (
                SELECT 1 FROM public.loyalty_transactions 
                WHERE order_id = NEW.id AND (type = 'earn' OR type = 'earned')
            ) THEN
                INSERT INTO public.loyalty_transactions (user_id, order_id, type, coins, description)
                VALUES (NEW.user_id, NEW.id, 'earn', NEW.total_coins_to_earn, 'Earned from order #' || NEW.order_number);
            END IF;
        END IF;
    END IF;

    -- Handle Refund on Cancellation
    IF (NEW.status = 'cancelled') AND OLD.status != 'cancelled' AND COALESCE(NEW.loyalty_coins_used, 0) > 0 THEN
        IF NOT EXISTS (SELECT 1 FROM public.loyalty_transactions WHERE order_id = NEW.id AND type = 'refund') THEN
            INSERT INTO public.loyalty_transactions (user_id, order_id, type, coins, description)
            VALUES (NEW.user_id, NEW.id, 'refund', NEW.loyalty_coins_used, 'Refund for cancelled order #' || NEW.order_number);
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 5: ATTACH NEW TRIGGERS
CREATE TRIGGER tr_process_loyalty_transaction
    BEFORE INSERT ON public.loyalty_transactions
    FOR EACH ROW EXECUTE FUNCTION process_loyalty_transaction();

CREATE TRIGGER tr_earn_coins_on_delivery 
    AFTER UPDATE ON public.orders 
    FOR EACH ROW 
    EXECUTE FUNCTION earn_coins_on_delivery();

-- Helper: Add missing columns if any
DO $$ 
BEGIN 
    ALTER TABLE public.loyalty_wallet ADD COLUMN IF NOT EXISTS total_earned INTEGER DEFAULT 0;
    ALTER TABLE public.loyalty_wallet ADD COLUMN IF NOT EXISTS total_redeemed INTEGER DEFAULT 0;
END $$;

-- Reload Cache
NOTIFY pgrst, 'reload schema';
