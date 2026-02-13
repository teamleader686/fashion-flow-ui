-- ============================================================================
-- STEP 4: Create LOYALTY_TRANSACTIONS table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type VARCHAR(20) NOT NULL,
  coins_amount INTEGER NOT NULL,
  order_id UUID,
  description TEXT,
  balance_after INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user_id ON public.loyalty_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_type ON public.loyalty_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_created_at ON public.loyalty_transactions(created_at DESC);

ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transactions" ON public.loyalty_transactions;
CREATE POLICY "Users can view own transactions"
ON public.loyalty_transactions FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all transactions" ON public.loyalty_transactions;
CREATE POLICY "Admins can view all transactions"
ON public.loyalty_transactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.user_id = auth.uid()
  )
);

GRANT SELECT ON public.loyalty_transactions TO authenticated;
ALTER PUBLICATION supabase_realtime ADD TABLE public.loyalty_transactions;

SELECT 'Step 4 Complete: Loyalty transactions table created' as status;
