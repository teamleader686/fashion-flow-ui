-- ============================================
-- Instagram Storage Upload Fix - RLS Policy
-- ============================================
-- Error: "new row violates row-level security policy"
-- Solution: Add storage policies for 'product' bucket
-- ============================================

-- Step 1: Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads to product bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product' 
  AND (storage.foldername(name))[1] = 'instagram-campaigns'
);

-- Step 2: Allow public read access to uploaded files
CREATE POLICY "Allow public read access to product bucket"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product');

-- Step 3: Allow authenticated users to update their uploads
CREATE POLICY "Allow authenticated updates to product bucket"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'product')
WITH CHECK (bucket_id = 'product');

-- Step 4: Allow authenticated users to delete their uploads
CREATE POLICY "Allow authenticated deletes from product bucket"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'product');

-- ============================================
-- Verification Query
-- ============================================
-- Run this to check if policies are created:
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'objects' 
  AND policyname LIKE '%product%';

-- ============================================
-- Expected Output:
-- Should show 4 policies for 'product' bucket
-- ============================================
