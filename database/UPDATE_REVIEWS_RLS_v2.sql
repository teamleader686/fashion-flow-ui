-- ============================================================================
-- REVIEW SYSTEM UPDATE: USER EDIT/DELETE + ADMIN FULL ACCESS
-- ============================================================================

-- 1. Add 'updated_at' if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='product_reviews' AND column_name='updated_at') THEN
        ALTER TABLE public.product_reviews ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 2. Enable RLS (Ensure it's on)
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to start fresh
DROP POLICY IF EXISTS "read_reviews_policy" ON public.product_reviews;
DROP POLICY IF EXISTS "insert_own_reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "update_own_reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "delete_own_reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Admin full access" ON public.product_reviews;
-- Cleanup strictly named old ones too
DROP POLICY IF EXISTS "Users can update own reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON public.product_reviews;

-- 4. Define Policy: READ
-- Visible if Approved OR Owner OR Admin
CREATE POLICY "read_reviews_policy"
ON public.product_reviews FOR SELECT
USING (
  is_approved = true 
  OR 
  auth.uid() = user_id
  OR 
  EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- 5. Define Policy: INSERT
-- Users can insert their own reviews
CREATE POLICY "insert_own_reviews"
ON public.product_reviews FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 6. Define Policy: UPDATE
-- Owner can update own reviews (e.g. fix typo)
-- Admin can update anything (e.g. approve/reject)
CREATE POLICY "update_reviews_policy"
ON public.product_reviews FOR UPDATE
USING (
  auth.uid() = user_id
  OR 
  EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- 7. Define Policy: DELETE
-- Owner can delete own reviews
-- Admin can delete anything
CREATE POLICY "delete_reviews_policy"
ON public.product_reviews FOR DELETE
USING (
  auth.uid() = user_id
  OR 
  EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'admin')
);
