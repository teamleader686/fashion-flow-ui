# 🗄️ Database Setup Guide - Complete Checklist

## Overview
Step-by-step guide to set up all database tables, functions, and policies for the complete e-commerce system.

---

## 🚨 Current Errors & Fixes

### Error 1: Notifications 400 Error
```
Failed to load resource: 400 (Bad Request)
/rest/v1/notifications?select=*&user_id=eq...
```

**Cause**: RLS policies blocking notification queries

**Fix**: Run this SQL script:
```sql
-- Execute in Supabase SQL Editor
database/fix_notifications_rls.sql
```

---

### Error 2: Categories View 404 Error
```
Failed to load resource: 404 (Not Found)
/rest/v1/categories_with_count?select=*
```

**Cause**: Category management schema not yet installed

**Fix**: Run this SIMPLIFIED SQL script (recommended):
```sql
-- Execute in Supabase SQL Editor
database/category_management_simple.sql
```

**Why simplified version?**
- Doesn't require products table to exist
- Creates categories independently
- Safe to run anytime
- Links to products automatically when available

**Alternative** (if products table already exists):
```sql
-- Execute in Supabase SQL Editor
database/category_management_schema.sql
```

---

## 📋 Complete Setup Checklist

### Step 1: Core Database Schema
Run these scripts in order:

#### 1.1 Main Database Schema
```sql
-- File: database/COMPLETE_DATABASE_SCHEMA.sql
-- OR
-- File: database/FINAL_COMPLETE_ECOMMERCE_SCHEMA.sql

-- This creates:
-- - products table
-- - orders table
-- - order_items table
-- - shipments table
-- - user_profiles table
-- - admin_users table
-- - Basic RLS policies
```

**Verification:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('products', 'orders', 'order_items', 'shipments', 'user_profiles', 'admin_users');
```

---

#### 1.2 Fix Order RLS Policies
```sql
-- File: database/fix_order_rls_policies_v2.sql

-- This fixes:
-- - Order insertion policies
-- - Order items policies
-- - Shipment policies
-- - Allows both guest and authenticated orders
```

**Verification:**
```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('orders', 'order_items', 'shipments')
ORDER BY tablename, policyname;
```

---

### Step 2: Feature Modules

#### 2.1 Notifications System
```sql
-- File: database/notifications_schema.sql

-- Creates:
-- - notifications table
-- - RLS policies for notifications
-- - Indexes for performance
```

**Then fix RLS:**
```sql
-- File: database/fix_notifications_rls.sql
```

**Verification:**
```sql
SELECT * FROM notifications LIMIT 1;
SELECT policyname FROM pg_policies WHERE tablename = 'notifications';
```

---

#### 2.2 Cancellation Requests
```sql
-- File: database/cancellation_requests_schema.sql

-- Creates:
-- - cancellation_requests table
-- - Stored procedures (approve/reject)
-- - Triggers for status updates
-- - RLS policies
```

**Verification:**
```sql
SELECT * FROM cancellation_requests LIMIT 1;
SELECT proname FROM pg_proc WHERE proname LIKE '%cancellation%';
```

---

#### 2.3 Category Management
```sql
-- File: database/category_management_schema.sql

-- Creates:
-- - categories table
-- - Auto-slug generation function
-- - Product count functions
-- - categories_with_count view
-- - RLS policies
-- - 8 default categories
```

**Verification:**
```sql
SELECT * FROM categories;
SELECT * FROM categories_with_count;
SELECT proname FROM pg_proc WHERE proname LIKE '%category%';
```

---

#### 2.4 Affiliate Marketing (Optional)
```sql
-- File: database/AFFILIATE_FINAL_WORKING.sql
-- OR
-- File: database/RUN_THIS_FIRST_AFFILIATE.sql

-- Creates:
-- - affiliates table
-- - affiliate_orders table
-- - affiliate_commissions table
-- - affiliate_payouts table
```

---

#### 2.5 Instagram Marketing (Optional)
```sql
-- File: database/instagram_marketing_complete_schema.sql

-- Creates:
-- - instagram_users table
-- - instagram_campaigns table
-- - instagram_assignments table
-- - instagram_coins table
```

---

#### 2.6 Coupon System (Optional)
```sql
-- File: database/RUN_THIS_COUPON_SCHEMA.sql

-- Creates:
-- - coupons table
-- - coupon_usage table
```

---

#### 2.7 Wallet & Loyalty (Optional)
```sql
-- File: database/wallet_loyalty_system_schema.sql

-- Creates:
-- - wallets table
-- - wallet_transactions table
-- - loyalty_points table
```

---

## 🔧 Quick Fix Scripts

### Fix All Current Errors
Run these in order:

```sql
-- 1. Fix Notifications
\i database/fix_notifications_rls.sql

-- 2. Setup Categories
\i database/category_management_schema.sql

-- 3. Verify Setup
SELECT 
    'notifications' as table_name,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'notifications'
UNION ALL
SELECT 
    'categories' as table_name,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'categories';
```

---

## 🔍 Verification Queries

### Check All Tables Exist
```sql
SELECT 
    table_name,
    CASE 
        WHEN table_name IN (
            'products', 'orders', 'order_items', 'shipments',
            'user_profiles', 'admin_users', 'notifications',
            'cancellation_requests', 'categories'
        ) THEN '✓ Required'
        ELSE '○ Optional'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

---

### Check All Views Exist
```sql
SELECT 
    table_name as view_name,
    CASE 
        WHEN table_name = 'categories_with_count' THEN '✓ Required'
        ELSE '○ Optional'
    END as status
FROM information_schema.views 
WHERE table_schema = 'public'
ORDER BY table_name;
```

---

### Check RLS Enabled
```sql
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN (
    'products', 'orders', 'order_items', 'notifications',
    'cancellation_requests', 'categories'
)
ORDER BY tablename;
```

---

### Check Admin User Exists
```sql
-- Check if you're an admin
SELECT 
    au.email,
    au.full_name,
    au.is_active,
    au.created_at
FROM admin_users au
WHERE au.user_id = auth.uid();

-- If no results, create admin user:
INSERT INTO admin_users (user_id, email, full_name, is_active)
VALUES (
    auth.uid(),
    '[YOUR_EMAIL]',
    '[YOUR_NAME]',
    true
);
```

---

## 🚀 Quick Start (Minimal Setup)

For a working system, run these 4 scripts:

```sql
-- 1. Core Schema
\i database/FINAL_COMPLETE_ECOMMERCE_SCHEMA.sql

-- 2. Fix Order Policies
\i database/fix_order_rls_policies_v2.sql

-- 3. Fix Notifications
\i database/fix_notifications_rls.sql

-- 4. Setup Categories
\i database/category_management_schema.sql
```

Then create your admin user:
```sql
INSERT INTO admin_users (user_id, email, full_name, is_active)
VALUES (
    auth.uid(),
    'your-email@example.com',
    'Your Name',
    true
);
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "relation does not exist"
**Cause**: Table not created yet  
**Solution**: Run the appropriate schema file

### Issue 2: "new row violates row-level security"
**Cause**: RLS policy blocking operation  
**Solution**: Run fix_order_rls_policies_v2.sql

### Issue 3: "permission denied for table"
**Cause**: Not authenticated or not admin  
**Solution**: 
1. Check you're logged in
2. Verify admin_users entry exists

### Issue 4: "function does not exist"
**Cause**: Function not created  
**Solution**: Run the schema file that creates the function

### Issue 5: "view does not exist"
**Cause**: View not created  
**Solution**: Run category_management_schema.sql

---

## 📊 Database Health Check

Run this comprehensive check:

```sql
-- Health Check Query
WITH table_check AS (
    SELECT 'products' as name, EXISTS(SELECT 1 FROM products LIMIT 1) as exists
    UNION ALL SELECT 'orders', EXISTS(SELECT 1 FROM orders LIMIT 1)
    UNION ALL SELECT 'order_items', EXISTS(SELECT 1 FROM order_items LIMIT 1)
    UNION ALL SELECT 'notifications', EXISTS(SELECT 1 FROM notifications LIMIT 1)
    UNION ALL SELECT 'categories', EXISTS(SELECT 1 FROM categories LIMIT 1)
    UNION ALL SELECT 'cancellation_requests', EXISTS(SELECT 1 FROM cancellation_requests LIMIT 1)
    UNION ALL SELECT 'admin_users', EXISTS(SELECT 1 FROM admin_users LIMIT 1)
),
policy_check AS (
    SELECT 
        tablename,
        COUNT(*) as policy_count
    FROM pg_policies
    WHERE tablename IN ('products', 'orders', 'notifications', 'categories')
    GROUP BY tablename
),
function_check AS (
    SELECT 
        COUNT(*) as total_functions
    FROM pg_proc
    WHERE proname LIKE '%category%' OR proname LIKE '%cancellation%'
)
SELECT 
    'Tables' as check_type,
    COUNT(*) as total,
    SUM(CASE WHEN exists THEN 1 ELSE 0 END) as passed
FROM table_check
UNION ALL
SELECT 
    'Policies',
    COUNT(*),
    COUNT(*)
FROM policy_check
UNION ALL
SELECT 
    'Functions',
    total_functions,
    total_functions
FROM function_check;
```

---

## 📝 Setup Log Template

Use this to track your setup:

```
□ Core Schema (FINAL_COMPLETE_ECOMMERCE_SCHEMA.sql)
□ Fix Order RLS (fix_order_rls_policies_v2.sql)
□ Notifications Schema (notifications_schema.sql)
□ Fix Notifications RLS (fix_notifications_rls.sql)
□ Cancellation System (cancellation_requests_schema.sql)
□ Category Management (category_management_schema.sql)
□ Create Admin User
□ Verify All Tables
□ Verify All Policies
□ Test Admin Login
□ Test Category Management
□ Test Order Placement
□ Test Notifications
```

---

## 🎯 Priority Order

If you're getting errors, fix them in this order:

1. **Fix Notifications** (fix_notifications_rls.sql)
2. **Setup Categories** (category_management_schema.sql)
3. **Verify Admin User** (INSERT into admin_users)
4. **Test Each Feature**

---

## 📞 Need Help?

### Check Supabase Logs
1. Go to Supabase Dashboard
2. Navigate to Logs → Database
3. Look for error messages

### Check Browser Console
1. Press F12
2. Go to Console tab
3. Look for red errors
4. Check Network tab for failed requests

### Verify Authentication
```sql
-- Check current user
SELECT auth.uid();

-- Should return your user ID, not null
```

---

## ✅ Success Criteria

Your database is ready when:

- [ ] All required tables exist
- [ ] All RLS policies are active
- [ ] Admin user exists
- [ ] No 400/404 errors in console
- [ ] Can create categories
- [ ] Can place orders
- [ ] Notifications work
- [ ] Cancellation system works

---

**Last Updated**: February 12, 2026  
**Version**: 1.0.0
