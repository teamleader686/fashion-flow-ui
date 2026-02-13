-- ============================================================================
-- FULL USER WALLET & LOYALTY SYSTEM (EXPANDED FOR ADMIN)
-- ============================================================================

-- 1. Create or Update LOYALTY_WALLET
CREATE TABLE IF NOT EXISTS public.loyalty_wallet (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    available_balance INTEGER DEFAULT 0 CHECK (available_balance >= 0), -- This is the loyalty coins
    affiliate_balance DECIMAL(10,2) DEFAULT 0 CHECK (affiliate_balance >= 0),
    refund_balance DECIMAL(10,2) DEFAULT 0 CHECK (refund_balance >= 0),
    promotional_balance DECIMAL(10,2) DEFAULT 0 CHECK (promotional_balance >= 0),
    total_balance DECIMAL(10,2) DEFAULT 0, -- Sum of all balances (coins converted 1:1 or as needed)
    total_earned INTEGER DEFAULT 0,
    total_redeemed INTEGER DEFAULT 0,
    frozen BOOLEAN DEFAULT false,
    frozen_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create LOYALTY_TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('earn', 'redeem', 'refund', 'admin_adjust', 'affiliate_credit', 'promotional')),
    coins INTEGER NOT NULL DEFAULT 0,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0, -- For currency based transactions
    wallet_type VARCHAR(20) DEFAULT 'loyalty', -- which balance this affects
    description TEXT,
    balance_after INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_wallet_user_id ON public.loyalty_wallet(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON public.loyalty_transactions(user_id);

-- 4. RLS
ALTER TABLE public.loyalty_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- 5. Policies
DROP POLICY IF EXISTS "Users can view own wallet" ON public.loyalty_wallet;
CREATE POLICY "Users can view own wallet" ON public.loyalty_wallet FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all wallets" ON public.loyalty_wallet;
CREATE POLICY "Admins can manage all wallets" ON public.loyalty_wallet FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Users can view own transactions" ON public.loyalty_transactions;
CREATE POLICY "Users can view own transactions" ON public.loyalty_transactions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all transactions" ON public.loyalty_transactions;
CREATE POLICY "Admins can manage all transactions" ON public.loyalty_transactions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- 6. Trigger for balance sync
CREATE OR REPLACE FUNCTION update_total_balance()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_balance := COALESCE(NEW.available_balance, 0) + 
                         COALESCE(NEW.affiliate_balance, 0) + 
                         COALESCE(NEW.refund_balance, 0) + 
                         COALESCE(NEW.promotional_balance, 0);
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_total_balance ON public.loyalty_wallet;
CREATE TRIGGER tr_update_total_balance
    BEFORE INSERT OR UPDATE ON public.loyalty_wallet
    FOR EACH ROW EXECUTE FUNCTION update_total_balance();

-- Function to handle transactions
CREATE OR REPLACE FUNCTION process_loyalty_transaction()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure wallet exists
    INSERT INTO public.loyalty_wallet (user_id)
    VALUES (NEW.user_id)
    ON CONFLICT (user_id) DO NOTHING;

    -- Update based on type
    IF NEW.type = 'earn' OR NEW.type = 'refund' OR (NEW.type = 'admin_adjust' AND NEW.coins > 0) THEN
        UPDATE public.loyalty_wallet 
        SET available_balance = available_balance + ABS(NEW.coins),
            total_earned = total_earned + (CASE WHEN NEW.type = 'earn' THEN ABS(NEW.coins) ELSE 0 END),
            updated_at = NOW()
        WHERE user_id = NEW.user_id;
    ELSIF NEW.type = 'redeem' OR (NEW.type = 'admin_adjust' AND NEW.coins < 0) THEN
        UPDATE public.loyalty_wallet 
        SET available_balance = available_balance - ABS(NEW.coins),
            total_redeemed = total_redeemed + (CASE WHEN NEW.type = 'redeem' THEN ABS(NEW.coins) ELSE 0 END),
            updated_at = NOW()
        WHERE user_id = NEW.user_id;
    END IF;

    -- Set balance_after
    SELECT available_balance INTO NEW.balance_after FROM public.loyalty_wallet WHERE user_id = NEW.user_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_process_loyalty_transaction ON public.loyalty_transactions;
CREATE TRIGGER tr_process_loyalty_transaction
    BEFORE INSERT ON public.loyalty_transactions
    FOR EACH ROW EXECUTE FUNCTION process_loyalty_transaction();

-- 7. Earning on delivery
CREATE OR REPLACE FUNCTION earn_coins_on_delivery()
RETURNS TRIGGER AS $$
DECLARE v_coins INTEGER;
BEGIN
    IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
        v_coins := FLOOR(NEW.total_amount / 10);
        IF v_coins > 0 THEN
            INSERT INTO public.loyalty_transactions (user_id, order_id, type, coins, description)
            VALUES (NEW.user_id, NEW.id, 'earn', v_coins, 'Earned from order #' || NEW.order_number);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_earn_coins_on_delivery ON public.orders;
CREATE TRIGGER tr_earn_coins_on_delivery AFTER UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION earn_coins_on_delivery();

-- 8. Final touches: Auto-redemption on order placement
CREATE OR REPLACE FUNCTION process_redemption_on_order()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.loyalty_coins_used > 0 THEN
        INSERT INTO public.loyalty_transactions (user_id, order_id, type, coins, description)
        VALUES (NEW.user_id, NEW.id, 'redeem', NEW.loyalty_coins_used, 'Redeemed on order #' || NEW.order_number);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_process_redemption_on_order ON public.orders;
CREATE TRIGGER tr_process_redemption_on_order
    AFTER INSERT ON public.orders
    FOR EACH ROW EXECUTE FUNCTION process_redemption_on_order();

-- 9. Auto-reversal on Cancellation or Return
CREATE OR REPLACE FUNCTION handle_order_status_wallet_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_coins_to_earn INTEGER;
BEGIN
    -- If order cancelled/returned, refund redeemed coins
    IF (NEW.status IN ('cancelled', 'returned') AND OLD.status NOT IN ('cancelled', 'returned')) THEN
        IF NEW.loyalty_coins_used > 0 THEN
            INSERT INTO public.loyalty_transactions (user_id, order_id, type, coins, description)
            VALUES (NEW.user_id, NEW.id, 'refund', NEW.loyalty_coins_used, 'Refund of redeemed coins from order #' || NEW.order_number);
        END IF;

        -- If order was already delivered and then returned, reverse earned coins
        IF OLD.status = 'delivered' THEN
            v_coins_to_earn := FLOOR(NEW.total_amount / 10);
            IF v_coins_to_earn > 0 THEN
                INSERT INTO public.loyalty_transactions (user_id, order_id, type, coins, description)
                VALUES (NEW.user_id, NEW.id, 'admin_adjust', -v_coins_to_earn, 'Reversal of earned coins - order returned #' || NEW.order_number);
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_handle_order_status_wallet_changes ON public.orders;
CREATE TRIGGER tr_handle_order_status_wallet_changes
    AFTER UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION handle_order_status_wallet_changes();

-- Enable Realtime (Idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'loyalty_wallet'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.loyalty_wallet;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'loyalty_transactions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.loyalty_transactions;
    END IF;
END $$;
