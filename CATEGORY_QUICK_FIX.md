# Category Management - Quick Fix Guide

## Problem
Error: `column "status" does not exist` when trying to use category management system.

## Root Cause
Your database has an existing `categories` table that was created with an incomplete schema. It's missing several required columns including `status`, `description`, `image_url`, `display_order`, and `updated_at`.

## Solution

### Step 1: Run the Fix Script

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Open file: `database/CATEGORY_QUICK_FIX.sql`
4. Copy the ENTIRE contents
5. Paste in SQL Editor
6. Click "Run"

### Step 2: Verify Success

You should see output like:
```
✓ Categories table fixed!
total_categories: 8
active_categories: 8

✓ View created!
categories_in_view: 8
```

### Step 3: Test the System

1. Refresh your browser
2. Navigate to `/admin/categories`
3. You should see 8 default categories
4. Try creating a new category
5. Try editing an existing category
6. Try changing status (Active/Inactive)

## What This Script Does

1. **Adds Missing Columns** (safely, won't break existing data)
   - `status` (active/inactive)
   - `description` (optional text)
   - `image_url` (optional image)
   - `display_order` (for sorting)
   - `updated_at` (timestamp)

2. **Inserts Default Categories**
   - Kurtis
   - Dresses
   - Sarees
   - Sets
   - Tops
   - Bottoms
   - Ethnic Wear
   - Western Wear

3. **Creates Helper Functions**
   - `generate_category_slug()` - Auto-generates URL-friendly slugs
   - `set_category_slug()` - Trigger function for auto-slug
   - `get_category_product_count()` - Counts products per category

4. **Creates View**
   - `categories_with_count` - Categories with product counts

5. **Sets Up RLS Policies**
   - Public can view active categories
   - Authenticated users can view all categories
   - Only admins can create/update/delete categories

6. **Links to Products Table**
   - Adds `category_id` column to products (if not exists)
   - Creates foreign key relationship

## Troubleshooting

### If you still get errors:

1. **Check if admin_users table exists**
   ```sql
   SELECT * FROM admin_users WHERE user_id = auth.uid();
   ```

2. **Check your user ID**
   ```sql
   SELECT auth.uid();
   ```

3. **Verify columns were added**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'categories'
   ORDER BY ordinal_position;
   ```

4. **Check RLS policies**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'categories';
   ```

### If categories don't show in admin panel:

1. Clear browser cache
2. Hard refresh (Ctrl + Shift + R)
3. Check browser console for errors
4. Verify you're logged in as admin

## Frontend Components (Already Created)

- ✅ `src/pages/admin/CategoryManagement.tsx` - Main page
- ✅ `src/components/admin/CategoryDialog.tsx` - Create/Edit dialog
- ✅ Route added: `/admin/categories`
- ✅ Menu item added in AdminLayout

## Features Available

1. **View Categories**
   - Grid/List view
   - Product count per category
   - Status indicators
   - Search/Filter

2. **Create Category**
   - Name (required)
   - Description (optional)
   - Image upload (optional)
   - Status (Active/Inactive)
   - Display order

3. **Edit Category**
   - Update any field
   - Real-time updates
   - Auto-slug generation

4. **Delete Category**
   - Confirmation dialog
   - Checks for linked products
   - Safe deletion

5. **Real-time Sync**
   - Uses Supabase Realtime
   - Instant updates across tabs
   - No manual refresh needed

## Next Steps

After successful installation:

1. Test all CRUD operations
2. Upload category images
3. Link products to categories
4. Test filtering on user side
5. Verify responsive design on mobile

## Support

If you encounter any issues:
1. Check browser console for errors
2. Check Supabase logs
3. Verify your admin user status
4. Ensure all columns exist in categories table
