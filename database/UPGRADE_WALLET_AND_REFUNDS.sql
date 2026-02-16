-- ============================================================================
-- UPGRADE WALLET & LOYALTY SYSTEM: ADVANCED RETURN & REFUND LOGIC
-- ============================================================================

-- 1. DROP EXISTING CONSTRAINTS TO ALLOW NEW TYPES
ALTER TABLE public.loyalty_transactions DROP CONSTRAINT IF EXISTS loyalty_transactions_type_check;
ALTER TABLE public.loyalty_transactions ADD CONSTRAINT loyalty_transactions_type_check 
    CHECK (type IN ('earn', 'redeem', 'refund', 'admin_adjust', 'affiliate_credit', 'promotional', 'deduct', 'penalty', 'credit'));

-- 2. CREATE RPC FOR PROCESSING RETURNS (The "Brain" of the operation)
CREATE OR REPLACE FUNCTION process_return_refund(
    p_order_id UUID,
    p_user_id UUID,
    p_return_amount DECIMAL,
    p_penalty_percent DECIMAL DEFAULT 20,
    p_admin_note TEXT DEFAULT ''
)
RETURNS JSONB AS $$
DECLARE
    v_coins_earned_originally INTEGER;
    v_coins_to_reverse INTEGER;
    v_penalty_coins INTEGER;
    v_total_deduction INTEGER;
    v_current_wallet_coins INTEGER;
    v_result JSONB;
BEGIN
    -- A. Calculate Coins to Reverse
    -- Rule: coinsEarned = Math.floor(orderAmount / 100)
    -- So reversed coins should be proportional to returned amount
    v_coins_to_reverse := FLOOR(p_return_amount / 100);

    -- B. Calculate Penalty
    -- Rule: penalty = Math.ceil(reversed_coins * 0.2)
    v_penalty_coins := CEIL(v_coins_to_reverse * (p_penalty_percent / 100.0));

    -- Total coins to remove
    v_total_deduction := v_coins_to_reverse + v_penalty_coins;

    -- C. Check Balance (Prevent Negative Balance logic)
    SELECT available_balance INTO v_current_wallet_coins FROM public.loyalty_wallet WHERE user_id = p_user_id;
    
    -- If user has fewer coins than deduction, just take what they have (or go negative? User said "Prevent negative balance")
    -- User Logic: if (userCoins < deduction) deduction = userCoins;
    IF v_current_wallet_coins < v_total_deduction THEN
        v_total_deduction := v_current_wallet_coins;
        -- Adjust components logically (optional, but good for tracking)
        -- We just cap the total deduction.
    END IF;

    -- D. Transaction 1: Reverse Earned Coins (Deduct)
    IF v_coins_to_reverse > 0 THEN
        INSERT INTO public.loyalty_transactions (
            user_id, order_id, type, coins, description, wallet_type
        ) VALUES (
            p_user_id, p_order_id, 'deduct', -LEAST(v_coins_to_reverse, v_current_wallet_coins), 
            'Reversal of coins for return. Note: ' || p_admin_note, 'loyalty'
        );
    END IF;

    -- E. Transaction 2: Penalty (Penalty)
    -- Only apply penalty if there is still balance left to deduct
    IF v_penalty_coins > 0 AND (v_current_wallet_coins - v_coins_to_reverse) > 0 THEN
         INSERT INTO public.loyalty_transactions (
            user_id, order_id, type, coins, description, wallet_type
        ) VALUES (
            p_user_id, p_order_id, 'penalty', -LEAST(v_penalty_coins, (v_current_wallet_coins - v_coins_to_reverse)), 
            'Return penalty (' || p_penalty_percent || '%). Note: ' || p_admin_note, 'loyalty'
        );
    END IF;

    -- F. Transaction 3: Refund Money to Wallet (Credit)
    INSERT INTO public.loyalty_transactions (
        user_id, order_id, type, amount, description, wallet_type
    ) VALUES (
        p_user_id, p_order_id, 'credit', p_return_amount, 
        'Refund credited to wallet. Note: ' || p_admin_note, 'refund'
    );

    -- Updates to loyalty_wallet table are handled by the existing trigger 'tr_process_loyalty_transaction' 
    -- BUT we need to ensure it handles 'deduct', 'penalty' (coins) and 'credit' (money) correctly.
    -- Let's update the Trigger Function to be smarter.
    
    v_result := jsonb_build_object(
        'success', true,
        'coins_reversed', v_coins_to_reverse,
        'penalty_coins', v_penalty_coins,
        'refund_amount', p_return_amount
    );

    RETURN v_result;

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. UPDATE TRIGGER FUNCTION TO HANDLE NEW TYPES
CREATE OR REPLACE FUNCTION process_loyalty_transaction()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure wallet exists
    INSERT INTO public.loyalty_wallet (user_id)
    VALUES (NEW.user_id)
    ON CONFLICT (user_id) DO NOTHING;

    -- COIN LOGIC
    -- Types that affect COINS: earn, redeem, admin_adjust (coins), deduct, penalty
    IF NEW.coins != 0 THEN
        UPDATE public.loyalty_wallet 
        SET available_balance = available_balance + NEW.coins, -- coins are negative for deduct/penalty
            total_earned = total_earned + (CASE WHEN NEW.coins > 0 THEN NEW.coins ELSE 0 END),
            total_redeemed = total_redeemed + (CASE WHEN NEW.coins < 0 THEN ABS(NEW.coins) ELSE 0 END),
            updated_at = NOW()
        WHERE user_id = NEW.user_id;
    END IF;

    -- MONEY LOGIC
    -- Types that affect MONEY: credit, refund (if monetary), affiliate_credit, promotional
    -- 'credit' -> Refund Balance
    IF NEW.type = 'credit' OR NEW.wallet_type = 'refund' THEN
        UPDATE public.loyalty_wallet
        SET refund_balance = refund_balance + NEW.amount,
            updated_at = NOW()
        WHERE user_id = NEW.user_id;
    ELSIF NEW.type = 'affiliate_credit' OR NEW.wallet_type = 'affiliate' THEN
        UPDATE public.loyalty_wallet
        SET affiliate_balance = affiliate_balance + NEW.amount,
            updated_at = NOW()
        WHERE user_id = NEW.user_id;
    END IF;

    -- Set balance_after snapshot
    SELECT available_balance INTO NEW.balance_after FROM public.loyalty_wallet WHERE user_id = NEW.user_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. UPDATE PURCHASE EARNING LOGIC TO 1 COIN PER 100 RUPEES
CREATE OR REPLACE FUNCTION earn_coins_on_delivery()
RETURNS TRIGGER AS $$
DECLARE v_coins INTEGER;
BEGIN
    IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
        -- Rule: 1 Coin per ₹100
        v_coins := FLOOR(NEW.total_amount / 100);
        IF v_coins > 0 THEN
            INSERT INTO public.loyalty_transactions (user_id, order_id, type, coins, description)
            VALUES (NEW.user_id, NEW.id, 'earn', v_coins, 'Earned from order #' || NEW.order_number);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. ENSURE USERS TABLE HAS WALLET_BALANCE (For redundancy/display if needed)
-- Some older code might rely on users.wallet_balance
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL(10,2) DEFAULT 0;

-- Sync Trigger: When loyalty_wallet.refund_balance changes, update users.wallet_balance
CREATE OR REPLACE FUNCTION sync_wallet_to_user_table()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.users 
    SET wallet_balance = NEW.refund_balance + NEW.affiliate_balance + NEW.promotional_balance -- Total Spendable Money
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_sync_wallet_user ON public.loyalty_wallet;
CREATE TRIGGER tr_sync_wallet_user
    AFTER UPDATE ON public.loyalty_wallet
    FOR EACH ROW EXECUTE FUNCTION sync_wallet_to_user_table();

