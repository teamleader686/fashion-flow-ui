-- ============================================
-- Check & Fix Storage Policies
-- ============================================
-- Policy already exists but upload still failing?
-- Let's check and fix them!
-- ============================================

-- Step 1: Check existing policies
SELECT 
  policyname,
  cmd as operation,
  qual as using_expression,
  with_check as check_expression,
  roles
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
ORDER BY cmd;

-- ============================================
-- If policies are wrong, DROP and RECREATE
-- ============================================

-- Step 2: Drop existing policies (if needed)
DROP POLICY IF EXISTS "Allow authenticated uploads to product bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to product bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to product bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from product bucket" ON storage.objects;

-- Step 3: Create correct policies
-- Policy 1: Allow authenticated users to INSERT (upload)
CREATE POLICY "Allow authenticated uploads to product bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product'
);

-- Policy 2: Allow public to SELECT (read/view)
CREATE POLICY "Allow public read access to product bucket"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product');

-- Policy 3: Allow authenticated users to UPDATE
CREATE POLICY "Allow authenticated updates to product bucket"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'product')
WITH CHECK (bucket_id = 'product');

-- Policy 4: Allow authenticated users to DELETE
CREATE POLICY "Allow authenticated deletes from product bucket"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'product');

-- ============================================
-- Step 4: Verify policies are created
-- ============================================
SELECT 
  policyname,
  cmd as operation,
  roles
FROM pg_policies 
WHERE tablename = 'objects' 
  AND policyname LIKE '%product%'
ORDER BY cmd;

-- ============================================
-- Expected Output: 4 policies
-- 1. DELETE | {authenticated}
-- 2. INSERT | {authenticated}
-- 3. SELECT | {public}
-- 4. UPDATE | {authenticated}
-- ============================================
