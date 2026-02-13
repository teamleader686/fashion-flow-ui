# Fix Notifications Error - Quick Guide

## 🔴 Error
```
column notifications.role does not exist
```

## 🎯 Problem
The notifications table in your database is either:
1. Missing completely, OR
2. Created with incomplete schema (missing the `role` column)

## ✅ Solution

### Step 1: Run the Fix Script

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Open file: `database/FIX_NOTIFICATIONS_COMPLETE.sql`
4. Copy entire contents
5. Paste in SQL Editor
6. Click "Run"

### Step 2: Verify Success

You should see output like:
```
✓ Notifications table exists
○ role column already exists
○ module column already exists
...

========================================
   NOTIFICATIONS TABLE FIXED! ✓
========================================

Columns: 17
Indexes: 7
RLS Policies: 5
Notifications: 0

========================================
System ready for use!
========================================
```

### Step 3: Refresh Browser

1. Go back to your app
2. Hard refresh (Ctrl + Shift + R)
3. Notification bell should work without errors

---

## 📊 What This Script Does

### 1. Checks Existing Table
- Verifies if notifications table exists
- Lists current columns

### 2. Creates/Updates Table
- Creates table if missing
- Adds missing columns safely:
  - `role` (admin/user/affiliate/instagram_user)
  - `module` (order/shipping/instagram/affiliate/system)
  - `priority` (low/medium/high/urgent)
  - `reference_id`, `reference_type`
  - `action_url`, `action_label`
  - `metadata` (JSONB)
  - `read_at`, `archived_at`

### 3. Creates Indexes
- 7 indexes for optimal query performance
- Composite indexes for common queries

### 4. Sets Up RLS Policies
- Users can view their own notifications
- Admins can view admin notifications
- Service role can insert notifications
- Users can update/delete their own notifications

### 5. Verifies Setup
- Shows column count
- Shows index count
- Shows policy count
- Displays table structure

---

## 🔍 Troubleshooting

### Still Getting Error After Running Script?

1. **Check if script ran successfully**
   ```sql
   SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_name = 'notifications';
   ```
   Should return: 17 (or more)

2. **Check if role column exists**
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'notifications' AND column_name = 'role';
   ```
   Should return: role

3. **Check RLS policies**
   ```sql
   SELECT policyname FROM pg_policies 
   WHERE tablename = 'notifications';
   ```
   Should return: 5 policies

4. **Clear browser cache**
   - Hard refresh: Ctrl + Shift + R
   - Or clear cache completely

### Error: "permission denied"

Make sure you're logged in as database owner in Supabase.

### Error: "relation notifications does not exist"

The table doesn't exist at all. The script will create it automatically.

---

## 📋 Expected Table Structure

After running the script, your notifications table should have:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | User who receives notification |
| role | TEXT | User role (admin/user/affiliate/instagram_user) |
| module | TEXT | Module (order/shipping/instagram/affiliate/system) |
| type | TEXT | Notification type |
| title | TEXT | Notification title |
| message | TEXT | Notification message |
| status | TEXT | Status (unread/read/archived) |
| priority | TEXT | Priority (low/medium/high/urgent) |
| reference_id | UUID | Related entity ID |
| reference_type | TEXT | Related entity type |
| action_url | TEXT | Action button URL |
| action_label | TEXT | Action button label |
| metadata | JSONB | Additional data |
| created_at | TIMESTAMP | Creation time |
| read_at | TIMESTAMP | Read time |
| archived_at | TIMESTAMP | Archive time |

---

## ✅ After Fix

Once fixed, you'll be able to:
- ✅ View notifications in notification bell
- ✅ Mark notifications as read
- ✅ Archive notifications
- ✅ Delete notifications
- ✅ Receive real-time notifications
- ✅ Filter by module and priority
- ✅ See notification stats

---

## 🎯 Related Files

- `database/FIX_NOTIFICATIONS_COMPLETE.sql` - **RUN THIS**
- `database/notifications_schema.sql` - Original schema
- `database/fix_notifications_rls.sql` - RLS policies only
- `src/hooks/useNotifications.ts` - Frontend hook
- `src/components/notifications/NotificationBell.tsx` - UI component

---

**Status**: Ready to fix  
**Time Required**: 2 minutes  
**Risk Level**: Zero (safe script)

---

**Run the script and your notifications will work perfectly!** 🔔
