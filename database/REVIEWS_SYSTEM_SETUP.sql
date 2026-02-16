-- ============================================================================
-- PRODUCT REVIEWS SYSTEM SETUP
-- ============================================================================

-- 1. Create Table (if not exists)
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies

-- Policy: Anyone can read APPROVED reviews
DROP POLICY IF EXISTS "Anyone can read approved reviews" ON public.product_reviews;
CREATE POLICY "Anyone can read approved reviews"
ON public.product_reviews FOR SELECT
USING (is_approved = true);

-- Policy: Users can read their OWN reviews (even pending)
DROP POLICY IF EXISTS "Users can read own reviews" ON public.product_reviews;
CREATE POLICY "Users can read own reviews"
ON public.product_reviews FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Admins can read ALL reviews
-- (Assuming admins have a specific role or we rely on service role/dashboard logic often bypasses RLS, 
-- but for query correctness from client-side admin panel):
-- Note: Supabase generic admin policy usually depends on a lookup or claims. 
-- For now, we often use a "public" admin check or simpler logic. 
-- If you have an 'admins' table or role claim:
-- CREATE POLICY "Admins can read all" ON public.product_reviews FOR ALL USING (public.is_admin());

-- Policy: Users can insert their OWN reviews
DROP POLICY IF EXISTS "Users can insert own reviews" ON public.product_reviews;
CREATE POLICY "Users can insert own reviews"
ON public.product_reviews FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their OWN reviews (optional)
DROP POLICY IF EXISTS "Users can update own reviews" ON public.product_reviews;
CREATE POLICY "Users can update own reviews"
ON public.product_reviews FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their OWN reviews
DROP POLICY IF EXISTS "Users can delete own reviews" ON public.product_reviews;
CREATE POLICY "Users can delete own reviews"
ON public.product_reviews FOR DELETE
USING (auth.uid() = user_id);

-- 4. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON public.product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_is_approved ON public.product_reviews(is_approved);

-- 5. Helper Function to Calculate Average Rating (Optional but faster)
CREATE OR REPLACE FUNCTION public.get_product_rating_stats(p_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_avg NUMERIC;
  v_count INTEGER;
BEGIN
  SELECT 
    COALESCE(AVG(rating), 0), 
    COUNT(*)
  INTO v_avg, v_count
  FROM public.product_reviews
  WHERE product_id = p_id AND is_approved = true;

  RETURN jsonb_build_object(
    'average_rating', ROUND(v_avg, 1),
    'total_reviews', v_count
  );
END;
$$ LANGUAGE plpgsql STABLE;
