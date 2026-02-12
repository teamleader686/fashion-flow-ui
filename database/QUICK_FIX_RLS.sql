-- ============================================================================
-- QUICK FIX - Copy and Run This Entire Script
-- ============================================================================

-- Drop problematic policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Anyone can view active categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;

-- Create simple policies without recursion
CREATE POLICY "Users can view their own profile"
    ON public.user_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
    ON public.user_profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all profiles"
    ON public.user_profiles FOR ALL
    USING (
        auth.uid() IN (
            SELECT user_id FROM public.admin_users WHERE is_active = true
        )
    );

-- Products - Allow everyone to view
CREATE POLICY "Anyone can view products"
    ON public.products FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage products"
    ON public.products FOR ALL
    USING (
        auth.uid() IN (
            SELECT user_id FROM public.admin_users WHERE is_active = true
        )
    );

-- Categories - Allow everyone to view
CREATE POLICY "Anyone can view categories"
    ON public.categories FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage categories"
    ON public.categories FOR ALL
    USING (
        auth.uid() IN (
            SELECT user_id FROM public.admin_users WHERE is_active = true
        )
    );

-- Product Images - Allow everyone to view
DROP POLICY IF EXISTS "Anyone can view product images" ON public.product_images;
CREATE POLICY "Anyone can view product images"
    ON public.product_images FOR SELECT
    USING (true);

-- Product Variants - Allow everyone to view
DROP POLICY IF EXISTS "Anyone can view product variants" ON public.product_variants;
CREATE POLICY "Anyone can view product variants"
    ON public.product_variants FOR SELECT
    USING (true);

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE '✅ RLS Policies fixed!';
    RAISE NOTICE '✅ Products and categories are now accessible';
    RAISE NOTICE '✅ Refresh your browser to see changes';
END $$;
