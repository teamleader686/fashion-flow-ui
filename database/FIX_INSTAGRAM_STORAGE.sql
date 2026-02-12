-- ============================================
-- FIX INSTAGRAM STORAGE BUCKET
-- ============================================
-- This creates the storage bucket and policies
-- for Instagram campaign images
-- ============================================

-- Note: Storage buckets are created via Supabase Dashboard
-- Go to: Storage → Create new bucket → Name: "products"

-- After creating bucket, run these policies:

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'products');

-- Policy: Authenticated users can upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'products');

-- Policy: Authenticated users can update their uploads
CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'products');

-- Policy: Authenticated users can delete their uploads
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'products');

-- Success
SELECT '✅ Storage policies created!' as status;
SELECT 'Make sure "products" bucket exists in Storage' as note;
