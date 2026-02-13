-- ============================================================================
-- SUPABASE STORAGE BUCKETS SETUP
-- ============================================================================
-- This script creates all necessary storage buckets for the application
-- Run this in Supabase SQL Editor

-- ============================================================================
-- 1. CREATE PRODUCT IMAGES BUCKET
-- ============================================================================

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,  -- Public bucket (images accessible via URL)
  10485760,  -- 10MB file size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. STORAGE POLICIES FOR PRODUCT IMAGES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;

-- Allow public to view product images
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Allow admins to upload product images
CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' 
  AND EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.user_id = auth.uid()
  )
);

-- Allow admins to update product images
CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images' 
  AND EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.user_id = auth.uid()
  )
);

-- Allow admins to delete product images
CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images' 
  AND EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.user_id = auth.uid()
  )
);

-- ============================================================================
-- 3. CREATE CATEGORY IMAGES BUCKET (Optional)
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'category-images',
  'category-images',
  true,
  5242880,  -- 5MB file size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Category images policies
DROP POLICY IF EXISTS "Public can view category images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage category images" ON storage.objects;

CREATE POLICY "Public can view category images"
ON storage.objects FOR SELECT
USING (bucket_id = 'category-images');

CREATE POLICY "Admins can manage category images"
ON storage.objects FOR ALL
USING (
  bucket_id = 'category-images' 
  AND EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.user_id = auth.uid()
  )
);

-- ============================================================================
-- 4. CREATE USER AVATARS BUCKET (Optional)
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,  -- 2MB file size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Avatar policies
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;

CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================================================
-- 5. VERIFY BUCKETS CREATED
-- ============================================================================

-- Check if buckets were created successfully
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE id IN ('product-images', 'category-images', 'avatars');

-- ============================================================================
-- COMPLETE
-- ============================================================================

-- Note: After running this script:
-- 1. Go to Supabase Dashboard > Storage
-- 2. Verify that 'product-images' bucket exists
-- 3. Check that the bucket is marked as "Public"
-- 4. Test uploading an image from admin panel
