# Fix Notifications Error - Quick Steps

## 🔴 Current Error
```
400 Bad Request
/rest/v1/notifications?...&role=eq.admin
Error fetching notifications
```

## ✅ Solution (2 Minutes)

### Step 1: Open Supabase SQL Editor
1. Go to: https://supabase.com/dashboard/project/jwaynvjeasaidymgqgdn
2. Click "SQL Editor" in left sidebar

### Step 2: Run the Fix Script
1. Open file: `database/FIX_NOTIFICATIONS_COMPLETE.sql`
2. Press Ctrl+A (select all)
3. Press Ctrl+C (copy)
4. Go to Supabase SQL Editor
5. Press Ctrl+V (paste)
6. Click "Run" button

### Step 3: Wait for Success Message
You should see:
```
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

### Step 4: Refresh Browser
1. Close ALL browser tabs with your app
2. Wait 5 seconds
3. Open app in NEW tab
4. Notification bell should work now! 🔔

---

## 🎯 What This Fixes

The script will:
- ✅ Create notifications table (if missing)
- ✅ Add all required columns (including `role`)
- ✅ Set up 7 indexes for performance
- ✅ Configure 5 RLS policies for security
- ✅ Verify everything is working

---

## 🔍 Verify It Worked

After running the script, check:

```sql
SELECT COUNT(*) FROM notifications;
```

Should return: 0 (or more if you have notifications)

If you get an error, the script didn't run properly.

---

## ⚠️ Important

- Run the ENTIRE script (don't select parts)
- Wait for it to complete
- Close all browser tabs after
- Hard refresh (Ctrl+Shift+R)

---

**File to run**: `database/FIX_NOTIFICATIONS_COMPLETE.sql`

**Time needed**: 2 minutes

**Risk**: Zero (safe script)

---

Run it now and your notifications will work! 🚀
