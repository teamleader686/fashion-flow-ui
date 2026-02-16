-- ============================================================================
-- FINAL FIX: REVIEWS RELATIONSHIP ERROR (PGRST200)
-- ============================================================================
-- The error "Could not find a relationship between 'product_reviews' and 'user_profiles'"
-- happens because Supabase needs an explicit Foreign Key to know how to join them.
-- ============================================================================

-- 1. Ensure user_profiles.user_id is UNIQUE (Required for Foreign Key reference)
-- This is often the missing piece that prevents FK creation
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'user_profiles_user_id_key') THEN
        ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- 2. Drop existing foreign keys on product_reviews.user_id to start fresh and clean
DO $$ 
BEGIN
    -- Drop constraint to auth.users if exists (to avoid conflicts)
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'product_reviews_user_id_fkey') THEN
        ALTER TABLE public.product_reviews DROP CONSTRAINT product_reviews_user_id_fkey;
    END IF;

    -- Drop constraint to user_profiles if exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_reviews_user_profile') THEN
        ALTER TABLE public.product_reviews DROP CONSTRAINT fk_reviews_user_profile;
    END IF;
END $$;

-- 3. Re-Create the Table if it doesn't exist (Safety check)
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL, 
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Add the Crucial Foreign Keys
-- Link to Auth Users (for RLS and Cascade Delete)
ALTER TABLE public.product_reviews
ADD CONSTRAINT product_reviews_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Link to User Profiles (This is what fixes the "Could not find relationship" error)
-- This allows: .select('*, users:user_profiles(full_name)')
ALTER TABLE public.product_reviews
ADD CONSTRAINT fk_reviews_user_profile
FOREIGN KEY (user_id)
REFERENCES public.user_profiles(user_id);

-- 5. Refresh Schema Cache Hint
-- (Supabase sometimes needs a nudge. Changing comments or permissions helps trigger cache reload)
COMMENT ON TABLE public.product_reviews IS 'Product reviews with dual relationships to auth and profiles';

-- 6. Verify Policies (Ensure RLS doesn't block Insert/Select)
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read approved" ON public.product_reviews;
CREATE POLICY "Public read approved" ON public.product_reviews FOR SELECT USING (is_approved = true);

DROP POLICY IF EXISTS "Users CRUD own" ON public.product_reviews;
CREATE POLICY "Users CRUD own" ON public.product_reviews FOR ALL USING (auth.uid() = user_id);
