-- ============================================================================
-- FIX LOYALTY SYSTEM ERRORS & DUPLICATION
-- ============================================================================
-- 1. Fix loyalty_transactions schema: make balance columns safer
-- 2. Update process_loyalty_transaction trigger to auto-calculate balances
-- 3. Ensure trigger logic is consistent and handles all types
-- ============================================================================

-- STEP 1: Relax constraints on legacy columns if they exist
DO $$ 
BEGIN 
    -- Make balance columns nullable to allow trigger to fill them
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loyalty_transactions' AND column_name = 'balance_before') THEN
        ALTER TABLE public.loyalty_transactions ALTER COLUMN balance_before DROP NOT NULL;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loyalty_transactions' AND column_name = 'balance_after') THEN
        ALTER TABLE public.loyalty_transactions ALTER COLUMN balance_after DROP NOT NULL;
    END IF;
END $$;

-- STEP 2: Enhanced process_loyalty_transaction function
CREATE OR REPLACE FUNCTION process_loyalty_transaction()
RETURNS TRIGGER AS $$
DECLARE
    v_old_balance INTEGER;
BEGIN
    -- 1. Ensure wallet exists and get current balance (balance_before)
    INSERT INTO public.loyalty_wallet (user_id, available_balance)
    VALUES (NEW.user_id, 0)
    ON CONFLICT (user_id) DO NOTHING;

    -- Get current balance BEFORE update
    SELECT available_balance INTO v_old_balance 
    FROM public.loyalty_wallet 
    WHERE user_id = NEW.user_id;

    NEW.balance_before := COALESCE(v_old_balance, 0);

    -- 2. Update wallet balance based on type
    -- Supported types: earn, redeem, refund, admin_adjust, promotional, etc.
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

    -- 3. Set balance_after
    SELECT available_balance INTO NEW.balance_after FROM public.loyalty_wallet WHERE user_id = NEW.user_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 3: Re-attach the trigger
DROP TRIGGER IF EXISTS tr_process_loyalty_transaction ON public.loyalty_transactions;
CREATE TRIGGER tr_process_loyalty_transaction
    BEFORE INSERT ON public.loyalty_transactions
    FOR EACH ROW EXECUTE FUNCTION process_loyalty_transaction();

-- STEP 4: Robust Reward & Cancellation Triggers
CREATE OR REPLACE FUNCTION earn_coins_on_delivery()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process when order status changes to 'delivered'
    IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
        -- Use the pre-calculated value from the order
        IF COALESCE(NEW.total_coins_to_earn, 0) > 0 THEN
            -- Check for duplicates
            IF NOT EXISTS (
                SELECT 1 FROM public.loyalty_transactions 
                WHERE order_id = NEW.id AND type = 'earn'
            ) THEN
                INSERT INTO public.loyalty_transactions (user_id, order_id, type, coins, description)
                VALUES (NEW.user_id, NEW.id, 'earn', NEW.total_coins_to_earn, 'Earned from order #' || NEW.order_number);
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_order_status_wallet_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Refund coins if order is cancelled or returned
    IF (NEW.status IN ('cancelled', 'returned')) AND OLD.status NOT IN ('cancelled', 'returned') AND COALESCE(NEW.loyalty_coins_used, 0) > 0 THEN
        -- Check if already refunded
        IF NOT EXISTS (
            SELECT 1 FROM public.loyalty_transactions 
            WHERE order_id = NEW.id AND type = 'refund'
        ) THEN
            INSERT INTO public.loyalty_transactions (user_id, order_id, type, coins, description)
            VALUES (NEW.user_id, NEW.id, 'refund', NEW.loyalty_coins_used, 'Refund for ' || NEW.status || ' order #' || NEW.order_number);
        END IF;
    END IF;

    -- 2. Reverse earned coins if order is cancelled after being delivered (edge case)
    IF NEW.status = 'cancelled' AND OLD.status = 'delivered' AND COALESCE(NEW.total_coins_to_earn, 0) > 0 THEN
         -- Reversal logic could be added here if needed
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 5: Re-attach Order Triggers
DROP TRIGGER IF EXISTS tr_earn_coins_on_delivery ON public.orders;
CREATE TRIGGER tr_earn_coins_on_delivery 
    AFTER UPDATE ON public.orders 
    FOR EACH ROW 
    EXECUTE FUNCTION earn_coins_on_delivery();

DROP TRIGGER IF EXISTS tr_handle_order_status_wallet_changes ON public.orders;
CREATE TRIGGER tr_handle_order_status_wallet_changes 
    AFTER UPDATE ON public.orders 
    FOR EACH ROW 
    EXECUTE FUNCTION handle_order_status_wallet_changes();

-- Reload Cache
NOTIFY pgrst, 'reload schema';
