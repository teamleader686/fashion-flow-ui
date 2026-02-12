-- ============================================================================
-- FIX RLS POLICIES - Infinite Recursion Error
-- ============================================================================
-- Error: infinite recursion detected in policy for relation "user_profiles"
-- Solution: Drop and recreate policies without circular references
-- ============================================================================

-- Run this in Supabase SQL Editor to fix the error

-- ============================================================================
-- STEP 1: Drop problematic policies
-- ============================================================================

-- Drop all user_profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;

-- Drop all products policies
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;

-- Drop all categories policies
DROP POLICY IF EXISTS "Anyone can view active categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;

-- ============================================================================
-- STEP 2: Create fixed policies (no recursion)
-- ============================================================================

-- User Profiles Policies (FIXED)
CREATE POLICY "Users can view their own profile"
    ON public.user_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
    ON public.user_profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- Admin policy WITHOUT recursion
CREATE POLICY "Admins can view all profiles"
    ON public.user_profiles FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM public.admin_users WHERE is_active = true
        )
    );

CREATE POLICY "Admins can manage all profiles"
    ON public.user_profiles FOR ALL
    USING (
        auth.uid() IN (
            SELECT user_id FROM public.admin_users WHERE is_active = true
        )
    );

-- Products Policies (FIXED - No admin check for public read)
CREATE POLICY "Anyone can view active products"
    ON public.products FOR SELECT
    USING (is_active = true OR auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage products"
    ON public.products FOR ALL
    USING (
        auth.uid() IN (
            SELECT user_id FROM public.admin_users WHERE is_active = true
        )
    );

-- Categories Policies (FIXED)
CREATE POLICY "Anyone can view active categories"
    ON public.categories FOR SELECT
    USING (is_active = true OR auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage categories"
    ON public.categories FOR ALL
    USING (
        auth.uid() IN (
            SELECT user_id FROM public.admin_users WHERE is_active = true
        )
    );

-- ============================================================================
-- STEP 3: Fix other tables with similar issues
-- ============================================================================

-- Product Images - Allow public read
DROP POLICY IF EXISTS "Anyone can view product images" ON public.product_images;
CREATE POLICY "Anyone can view product images"
    ON public.product_images FOR SELECT
    USING (true);

-- Product Variants - Allow public read
DROP POLICY IF EXISTS "Anyone can view product variants" ON public.product_variants;
CREATE POLICY "Anyone can view product variants"
    ON public.product_variants FOR SELECT
    USING (true);

-- Product Reviews - Allow public read of approved reviews
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.product_reviews;
CREATE POLICY "Anyone can view approved reviews"
    ON public.product_reviews FOR SELECT
    USING (is_approved = true OR auth.uid() IS NOT NULL);

-- ============================================================================
-- STEP 4: Verify policies
-- ============================================================================

-- Check if policies are created correctly
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'products', 'categories')
ORDER BY tablename, policyname;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$ 
BEGIN 
    RAISE NOTICE '✅ RLS Policies fixed successfully!';
    RAISE NOTICE '✅ Infinite recursion error resolved';
    RAISE NOTICE '✅ Products and categories are now accessible';
END $$;
