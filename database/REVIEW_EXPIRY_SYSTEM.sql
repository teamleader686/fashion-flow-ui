-- ============================================================================
-- REVIEW SYSTEM UPGRADE: 24-HOUR AUTO-EXPIRY
-- ============================================================================
-- This script adds an expiry mechanism for pending reviews.
-- 1. Adds 'expires_at' column
-- 2. Sets default expiry for new reviews (24 hours)
-- 3. Creates a function to clean up expired pending reviews
-- 4. (Optional) Sets up a pg_cron job if the extension is enabled
-- ============================================================================

-- 1. Add 'expires_at' column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='product_reviews' AND column_name='expires_at') THEN
        ALTER TABLE public.product_reviews ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 2. Set default expiry for existing pending reviews (Give them 24 hours from NOW)
UPDATE public.product_reviews 
SET expires_at = NOW() + INTERVAL '24 hours' 
WHERE is_approved = false AND expires_at IS NULL;

-- 3. Trigger to automatically set expires_at on INSERT
CREATE OR REPLACE FUNCTION set_review_expiry()
RETURNS TRIGGER AS $$
BEGIN
    -- If expires_at is not provided, set it to 24 hours from now
    IF NEW.expires_at IS NULL THEN
        NEW.expires_at := NOW() + INTERVAL '24 hours';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_set_review_expiry ON public.product_reviews;
CREATE TRIGGER tr_set_review_expiry
    BEFORE INSERT ON public.product_reviews
    FOR EACH ROW
    EXECUTE FUNCTION set_review_expiry();

-- 4. Function to Delete Expired Reviews
-- Only deletes PENDING reviews that have passed their expiry time
CREATE OR REPLACE FUNCTION delete_expired_reviews()
RETURNS void AS $$
BEGIN
    DELETE FROM public.product_reviews
    WHERE is_approved = false 
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 5. Safe Review Cleanup Function (Can be called by Admin Frontend)
-- This allows the admin dashboard to trigger cleanup on load as a fallback
-- if pg_cron is not available or enabled.
CREATE OR REPLACE FUNCTION cleanup_expired_reviews()
RETURNS JSONB AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH deleted_rows AS (
        DELETE FROM public.product_reviews
        WHERE is_approved = false 
        AND expires_at < NOW()
        RETURNING *
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted_rows;
    
    RETURN jsonb_build_object('success', true, 'deleted_count', deleted_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Attempt to Schedule Cron Job (If pg_cron is available)
-- Note: This block might fail if pg_cron is not enabled. 
-- In Supabase, you enable it in Dashboard -> Database -> Extensions.
-- We wrap it in a DO block to try gracefully.
DO $$
BEGIN
    -- Check if pg_cron extension exists
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        -- Schedule to run every hour
        PERFORM cron.schedule(
            'delete-expired-reviews',
            '0 * * * *', -- Every hour
            'SELECT delete_expired_reviews()'
        );
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Ignore errors if pg_cron is not available or permission denied
    RAISE NOTICE 'Could not schedule cron job. Please enable pg_cron or use frontend trigger.';
END $$;
