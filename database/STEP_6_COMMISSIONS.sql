-- ============================================================================
-- STEP 6: Create AFFILIATE_COMMISSIONS table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES public.affiliate_users(id) ON DELETE CASCADE,
  order_id UUID,
  commission_amount DECIMAL(10,2) NOT NULL,
  commission_percentage DECIMAL(5,2),
  status VARCHAR(20) DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate_id ON public.affiliate_commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_status ON public.affiliate_commissions(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_created_at ON public.affiliate_commissions(created_at DESC);

ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Affiliates can view own commissions" ON public.affiliate_commissions;
CREATE POLICY "Affiliates can view own commissions"
ON public.affiliate_commissions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.affiliate_users 
    WHERE affiliate_users.id = affiliate_commissions.affiliate_id 
    AND affiliate_users.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can manage commissions" ON public.affiliate_commissions;
CREATE POLICY "Admins can manage commissions"
ON public.affiliate_commissions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.user_id = auth.uid()
  )
);

GRANT SELECT ON public.affiliate_commissions TO authenticated;
ALTER PUBLICATION supabase_realtime ADD TABLE public.affiliate_commissions;

SELECT 'Step 6 Complete: Affiliate commissions table created' as status;
SELECT COUNT(*) as commission_count FROM public.affiliate_commissions;
