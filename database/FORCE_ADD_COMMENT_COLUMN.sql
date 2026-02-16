-- ============================================================================
-- FORCE FIX: MISSING 'comment' COLUMN (PGRST204 Error)
-- ============================================================================
-- The error "Could not find the 'comment' column" means the table exists
-- but likely has a different column name (e.g., 'review_text') or is missing 'comment'.
-- ============================================================================

DO $$ 
BEGIN
    -- 1. Check if 'comment' column exists. If not, add it.
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='product_reviews' AND column_name='comment') THEN
        
        ALTER TABLE public.product_reviews ADD COLUMN comment TEXT;
        
        -- 2. If 'review_text' exists, copy its data to 'comment' to preserve history
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='product_reviews' AND column_name='review_text') THEN
            
            UPDATE public.product_reviews 
            SET comment = review_text 
            WHERE comment IS NULL;
            
            -- Optional: We can keep review_text for safety or drop it. 
            -- For now, let's keep it but make 'comment' the main one.
        END IF;
    END IF;

    -- 3. Ensure foreign key to user_profiles exists (Prevent PGRST200)
    -- Just in case the previous fix didn't fully take or was rolled back
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'fk_reviews_user_profile') THEN
                   
        ALTER TABLE public.product_reviews
        ADD CONSTRAINT fk_reviews_user_profile
        FOREIGN KEY (user_id)
        REFERENCES public.user_profiles(user_id);
    END IF;

END $$;

-- 4. Reload Schema Cache
-- Explicitly notifying Supabase to refresh its cache of the table structure
NOTIFY pgrst, 'reload schema';

-- 5. Grant permissions again just to be safe
GRANT ALL ON public.product_reviews TO postgres;
GRANT ALL ON public.product_reviews TO service_role;
GRANT ALL ON public.product_reviews TO authenticated;
GRANT ALL ON public.product_reviews TO anon;
