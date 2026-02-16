-- ============================================================================
-- FINAL RLS SETUP: VISIBLE PENDING REVIEWS
-- ============================================================================
-- Objective: 
-- 1. Users must see ALL approved reviews.
-- 2. Users must see THEIR OWN pending reviews.
-- 3. Users must NOT see other people's pending reviews.
-- ============================================================================

-- 1. Enable RLS
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing SELECT policies to avoid confusion
DROP POLICY IF EXISTS "Anyone can read approved reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Users can read own reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Public read approved" ON public.product_reviews;
DROP POLICY IF EXISTS "Users CRUD own" ON public.product_reviews;
DROP POLICY IF EXISTS "read_reviews_policy" ON public.product_reviews;

-- 3. Create the Unified Select Policy
-- Logic: (is_approved = true) OR (auth.uid() = user_id)
CREATE POLICY "read_reviews_policy"
ON public.product_reviews FOR SELECT
USING (
  is_approved = true 
  OR 
  auth.uid() = user_id
);

-- 4. Create Insert/Update/Delete Policies for Owners
CREATE POLICY "insert_own_reviews"
ON public.product_reviews FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_reviews"
ON public.product_reviews FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "delete_own_reviews"
ON public.product_reviews FOR DELETE
USING (auth.uid() = user_id);

-- 5. Ensure Indexes exist for RLS performance
CREATE INDEX IF NOT EXISTS idx_reviews_user_approved 
ON public.product_reviews(user_id, is_approved);
