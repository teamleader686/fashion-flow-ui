-- ============================================================================
-- FINAL MASTER SETUP SCRIPT (Run in Supabase SQL Editor)
-- ============================================================================
-- This script enables ALL the features we built:
-- 1. Review Expiry System (24h auto-delete for pending reviews)
-- 2. Review Permissions (User Edit/Delete Own, Admin Full Access)
-- 3. Dynamic Legal Pages & Support System (Terms, Privacy, FAQ, Contact)
-- ============================================================================

-- ============================================================================
-- PART 1: PRODUCT REVIEWS ENHANCEMENTS
-- ============================================================================

-- 1. Add Columns (Safe Add)
DO $$ 
BEGIN
    -- Expiry date for pending reviews
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='product_reviews' AND column_name='expires_at') THEN
        ALTER TABLE public.product_reviews ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Updated at timestamp for edits
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='product_reviews' AND column_name='updated_at') THEN
        ALTER TABLE public.product_reviews ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- Comment column (in case it was optional before)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='product_reviews' AND column_name='comment') THEN
        ALTER TABLE public.product_reviews ADD COLUMN comment TEXT;
    END IF;

    -- Approval status (ensure it exists)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='product_reviews' AND column_name='is_approved') THEN
        ALTER TABLE public.product_reviews ADD COLUMN is_approved BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 2. Update RLS Policies (Security)
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Drop old policies to avoid conflicts
DROP POLICY IF EXISTS "read_reviews_policy" ON public.product_reviews;
DROP POLICY IF EXISTS "insert_own_reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "update_reviews_policy" ON public.product_reviews;
DROP POLICY IF EXISTS "delete_reviews_policy" ON public.product_reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON public.product_reviews;
DROP POLICY IF EXISTS "Admin full access" ON public.product_reviews;

-- Create New Robust Policies
-- READ: Approved Reviews OR Own Reviews OR Admin (Full Visibility)
CREATE POLICY "read_reviews_policy"
ON public.product_reviews FOR SELECT
USING (
  is_approved = true 
  OR 
  auth.uid() = user_id
  OR 
  EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- INSERT: Only own reviews
CREATE POLICY "insert_own_reviews"
ON public.product_reviews FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Own reviews OR Admin
CREATE POLICY "update_reviews_policy"
ON public.product_reviews FOR UPDATE
USING (
  auth.uid() = user_id
  OR 
  EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- DELETE: Own reviews OR Admin
CREATE POLICY "delete_reviews_policy"
ON public.product_reviews FOR DELETE
USING (
  auth.uid() = user_id
  OR 
  EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- 3. Review Expiry Logic
-- Set default expiry for any existing pending reviews
UPDATE public.product_reviews 
SET expires_at = NOW() + INTERVAL '24 hours' 
WHERE is_approved = false AND expires_at IS NULL;

-- Trigger to automatically set expiry on new reviews
CREATE OR REPLACE FUNCTION set_review_expiry()
RETURNS TRIGGER AS $$
BEGIN
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

-- Cleanup Function
CREATE OR REPLACE FUNCTION delete_expired_reviews()
RETURNS void AS $$
BEGIN
    DELETE FROM public.product_reviews
    WHERE is_approved = false 
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Manual Cleanup RPC (for Admin Button)
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

-- Attempt schedule (Best Effort)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        PERFORM cron.schedule('delete-expired-reviews', '0 * * * *', 'SELECT delete_expired_reviews()');
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron not available';
END $$;


-- ============================================================================
-- PART 2: LEGAL & SUPPORT SYSTEM
-- ============================================================================

-- 1. Create Pages Table
CREATE TABLE IF NOT EXISTS public.pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  is_active BOOLEAN DEFAULT true,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Default Pages
INSERT INTO public.pages (slug, title, content) VALUES
('terms', 'Terms & Conditions', '<h1>Terms & Conditions</h1><p>Placeholder content...</p>'),
('privacy', 'Privacy Policy', '<h1>Privacy Policy</h1><p>Placeholder content...</p>'),
('refund', 'Refund & Return Policy', '<h1>Refund Policy</h1><p>Placeholder content...</p>'),
('shipping', 'Shipping Policy', '<h1>Shipping Policy</h1><p>Placeholder content...</p>'),
('cancellation', 'Cancellation Policy', '<h1>Cancellation Policy</h1><p>Placeholder content...</p>'),
('contact', 'Contact Us', '<h1>Contact Us</h1><p>Contact details...</p>'),
('about', 'About Us', '<h1>About Us</h1><p>Company info...</p>')
ON CONFLICT (slug) DO NOTHING;

-- 2. Create FAQ Table
CREATE TABLE IF NOT EXISTS public.faqs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Contact Messages Table
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  mobile TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Support Tickets Table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'normal',
  admin_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Enable RLS for Legal Tables
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- 6. Legal System Policies
-- Pages: Public Read, Admin Manage
DROP POLICY IF EXISTS "Public read active pages" ON public.pages;
CREATE POLICY "Public read active pages" ON public.pages FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Admin manage pages" ON public.pages;
CREATE POLICY "Admin manage pages" ON public.pages FOR ALL USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'admin'));

-- FAQs: Public Read, Admin Manage
DROP POLICY IF EXISTS "Public read active faqs" ON public.faqs;
CREATE POLICY "Public read active faqs" ON public.faqs FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Admin manage faqs" ON public.faqs;
CREATE POLICY "Admin manage faqs" ON public.faqs FOR ALL USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'admin'));

-- Contact: Public Insert, Admin Manage
DROP POLICY IF EXISTS "Public insert contact messages" ON public.contact_messages;
CREATE POLICY "Public insert contact messages" ON public.contact_messages FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admin manage contact messages" ON public.contact_messages;
CREATE POLICY "Admin manage contact messages" ON public.contact_messages FOR ALL USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'admin'));

-- Tickets: User Own, Admin Manage
DROP POLICY IF EXISTS "Users view own tickets" ON public.support_tickets;
CREATE POLICY "Users view own tickets" ON public.support_tickets FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users insert own tickets" ON public.support_tickets;
CREATE POLICY "Users insert own tickets" ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admin manage tickets" ON public.support_tickets;
CREATE POLICY "Admin manage tickets" ON public.support_tickets FOR ALL USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'admin'));
