# 🗂️ Storage Bucket Fix - Complete Guide

## ❌ Error

```
StorageApiError: Bucket not found
POST https://[your-project].supabase.co/storage/v1/object/product-images/products/[filename].png 400 (Bad Request)
```

---

## 🔍 Problem

The Supabase storage bucket `product-images` doesn't exist in your project. When trying to upload product images from the admin panel, the upload fails because there's no bucket to store the files.

---

## ✅ Solution - 2 Methods

### Method 1: Using SQL Script (Recommended)

**Step 1:** Run the SQL script
```sql
-- File: database/create_storage_buckets.sql
-- Run this in Supabase SQL Editor
```

This will create:
- ✅ `product-images` bucket (for product photos)
- ✅ `category-images` bucket (for category icons)
- ✅ `avatars` bucket (for user profile pictures)
- ✅ All necessary RLS policies

**Step 2:** Verify in Supabase Dashboard
1. Go to Supabase Dashboard
2. Click on "Storage" in left sidebar
3. You should see the buckets listed

---

### Method 2: Manual Creation (Alternative)

**Step 1:** Go to Supabase Dashboard
1. Open your Supabase project
2. Click "Storage" in the left sidebar
3. Click "New bucket" button

**Step 2:** Create Product Images Bucket
```
Bucket name: product-images
Public bucket: ✅ Yes (checked)
File size limit: 10 MB
Allowed MIME types: image/jpeg, image/png, image/gif, image/webp
```

**Step 3:** Set Policies
Go to "Policies" tab and add:

1. **Public Read Policy**
   ```
   Policy name: Public can view product images
   Allowed operation: SELECT
   Target roles: public
   USING expression: bucket_id = 'product-images'
   ```

2. **Admin Upload Policy**
   ```
   Policy name: Admins can upload product images
   Allowed operation: INSERT
   Target roles: authenticated
   WITH CHECK expression:
   bucket_id = 'product-images' AND 
   EXISTS (
     SELECT 1 FROM public.admin_users 
     WHERE admin_users.user_id = auth.uid()
   )
   ```

3. **Admin Update Policy**
   ```
   Policy name: Admins can update product images
   Allowed operation: UPDATE
   Target roles: authenticated
   USING expression: (same as upload)
   ```

4. **Admin Delete Policy**
   ```
   Policy name: Admins can delete product images
   Allowed operation: DELETE
   Target roles: authenticated
   USING expression: (same as upload)
   ```

---

## 🧪 Testing

### Test 1: Verify Bucket Exists
```sql
-- Run in SQL Editor
SELECT * FROM storage.buckets WHERE id = 'product-images';
```

**Expected Result:** One row with bucket details

### Test 2: Check Policies
```sql
-- Run in SQL Editor
SELECT * FROM storage.policies WHERE bucket_id = 'product-images';
```

**Expected Result:** 4 policies (SELECT, INSERT, UPDATE, DELETE)

### Test 3: Upload Test
1. Go to Admin Panel > Products
2. Click "Add New Product" or edit existing
3. Go to "Images" tab
4. Try uploading an image
5. Should upload successfully ✅

---

## 📁 Bucket Structure

After setup, your storage will look like:

```
storage/
├── product-images/          (Public bucket)
│   └── products/
│       ├── 0.123456.jpg
│       ├── 0.789012.png
│       └── ...
│
├── category-images/         (Public bucket)
│   └── categories/
│       ├── fashion.jpg
│       ├── electronics.png
│       └── ...
│
└── avatars/                 (Public bucket)
    └── [user-id]/
        └── avatar.jpg
```

---

## 🔐 Security Policies Explained

### Product Images Bucket

**Public Read (SELECT)**
- Anyone can view product images
- No authentication required
- Needed for customers to see products

**Admin Upload (INSERT)**
- Only admins can upload new images
- Checks if user is in `admin_users` table
- Prevents unauthorized uploads

**Admin Update (UPDATE)**
- Only admins can update existing images
- Same authentication check

**Admin Delete (DELETE)**
- Only admins can delete images
- Prevents accidental/malicious deletion

---

## 🎯 File Upload Flow

### Current Implementation (ImagesTab.tsx)

```typescript
// 1. User selects files
const files = e.target.files;

// 2. Generate unique filename
const fileName = `${Math.random()}.${fileExt}`;
const filePath = `products/${fileName}`;

// 3. Upload to Supabase Storage
const { error, data } = await supabase.storage
  .from('product-images')  // ← Bucket name
  .upload(filePath, file);

// 4. Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('product-images')
  .getPublicUrl(filePath);

// 5. Save URL to database
// URL saved in product_images table
```

---

## 🔧 Troubleshooting

### Issue 1: "Bucket not found" Error
**Solution:** Run the SQL script to create the bucket

### Issue 2: "Permission denied" Error
**Solution:** Check RLS policies are set correctly

### Issue 3: Images Upload but Don't Display
**Solution:** 
1. Check if bucket is marked as "Public"
2. Verify public URL is correct
3. Check CORS settings

### Issue 4: File Size Too Large
**Solution:** 
1. Check bucket file size limit (default 10MB)
2. Compress images before upload
3. Or increase limit in bucket settings

### Issue 5: Wrong MIME Type
**Solution:**
1. Check allowed MIME types in bucket
2. Add missing types if needed
3. Common types: image/jpeg, image/png, image/gif, image/webp

---

## 📊 Bucket Configuration

### Product Images Bucket
```
Name: product-images
Public: Yes
File Size Limit: 10 MB
Allowed Types: JPEG, PNG, GIF, WebP
Folder Structure: products/[filename]
```

### Category Images Bucket
```
Name: category-images
Public: Yes
File Size Limit: 5 MB
Allowed Types: JPEG, PNG, GIF, WebP
Folder Structure: categories/[filename]
```

### Avatars Bucket
```
Name: avatars
Public: Yes
File Size Limit: 2 MB
Allowed Types: JPEG, PNG, GIF
Folder Structure: [user-id]/avatar.[ext]
```

---

## 🚀 Best Practices

### 1. Image Optimization
```typescript
// Before upload, consider:
- Compress images (use tools like TinyPNG)
- Resize to appropriate dimensions
- Convert to WebP for better compression
- Remove EXIF data for privacy
```

### 2. Filename Strategy
```typescript
// Current: Random number
const fileName = `${Math.random()}.${fileExt}`;

// Better: UUID + timestamp
const fileName = `${Date.now()}-${crypto.randomUUID()}.${fileExt}`;

// Best: Product slug + UUID
const fileName = `${productSlug}-${crypto.randomUUID()}.${fileExt}`;
```

### 3. Error Handling
```typescript
try {
  const { error, data } = await supabase.storage
    .from('product-images')
    .upload(filePath, file);
    
  if (error) {
    // Handle specific errors
    if (error.message.includes('Bucket not found')) {
      toast.error('Storage not configured. Contact admin.');
    } else if (error.message.includes('File size')) {
      toast.error('File too large. Max 10MB.');
    } else {
      toast.error('Upload failed. Try again.');
    }
    return;
  }
  
  // Success
  toast.success('Image uploaded!');
} catch (err) {
  console.error('Upload error:', err);
  toast.error('Unexpected error occurred.');
}
```

### 4. Progress Indication
```typescript
// Show upload progress
const [uploadProgress, setUploadProgress] = useState(0);

// Use with upload
const { error } = await supabase.storage
  .from('product-images')
  .upload(filePath, file, {
    onUploadProgress: (progress) => {
      const percent = (progress.loaded / progress.total) * 100;
      setUploadProgress(percent);
    }
  });
```

---

## 📝 Quick Checklist

Before uploading images, ensure:

- [ ] Storage bucket `product-images` exists
- [ ] Bucket is marked as "Public"
- [ ] RLS policies are set (4 policies)
- [ ] Admin user is authenticated
- [ ] Admin user exists in `admin_users` table
- [ ] File size is under 10MB
- [ ] File type is allowed (JPEG, PNG, GIF, WebP)
- [ ] Internet connection is stable

---

## 🎊 Success!

After running the SQL script:
- ✅ Storage buckets created
- ✅ Policies configured
- ✅ Image uploads working
- ✅ Public URLs accessible
- ✅ Admin panel functional

**You can now upload product images from the admin panel!** 🎉

---

## 📞 Support

If issues persist:
1. Check Supabase Dashboard > Storage
2. Verify bucket exists and is public
3. Check policies in Policies tab
4. Test with small image first
5. Check browser console for errors
6. Verify admin authentication

---

## 🔗 Related Files

- `database/create_storage_buckets.sql` - SQL script to create buckets
- `src/components/admin/product-form/ImagesTab.tsx` - Upload component
- `src/lib/supabase.ts` - Supabase client configuration

---

**Happy Uploading! 📸✨**
