# 🔧 Fix 400 Errors - Quick Guide

## ❌ Current Errors

```
400 Bad Request:
- /rest/v1/offers
- /rest/v1/loyalty_transactions  
- /rest/v1/coupons
```

**Reason:** Ye tables database mein exist nahi karte

---

## ✅ Quick Fix (2 Minutes)

### Step 1: Open Supabase SQL Editor
```
1. Supabase Dashboard kholo
2. Left sidebar mein "SQL Editor" pe click karo
3. "New query" button click karo
```

### Step 2: Run SQL Script
```
1. File kholo: database/create_missing_tables_for_store_management.sql
2. Pura content copy karo
3. SQL Editor mein paste karo
4. "RUN" button click karo
```

### Step 3: Verify
```
Script ke end mein verification queries hain
Results mein 4 tables dikhne chahiye:
- coupons
- offers
- loyalty_transactions
- affiliate_commissions
```

### Step 4: Refresh Page
```
1. Browser mein Store Management page pe jao
2. Refresh karo (Ctrl+R or Cmd+R)
3. Errors gone! ✅
```

---

## 📋 What Gets Created

### 1. Coupons Table
```
✅ Discount codes management
✅ Usage limits
✅ Validity dates
✅ Sample data (3 coupons)
```

### 2. Offers Table
```
✅ Promotional offers
✅ Discount percentages
✅ Validity periods
✅ Sample data (3 offers)
```

### 3. Loyalty Transactions Table
```
✅ Coins earned/redeemed tracking
✅ Transaction history
✅ User-specific data
```

### 4. Affiliate Commissions Table
```
✅ Commission tracking
✅ Payment status
✅ Affiliate earnings
```

---

## 🎯 After Running Script

### Store Management Page Will Show:
```
✅ Active Coupons: 3
✅ Active Offers: 3
✅ Loyalty Transactions: 0 (initially)
✅ Affiliate Commissions: 0 (initially)
```

### No More Errors:
```
✅ Page loads successfully
✅ All stats display correctly
✅ Tables show data
✅ CRUD operations work
```

---

## 🗄️ Tables Created

### Coupons
```sql
- id (UUID)
- code (VARCHAR) - Unique coupon code
- discount_type (percentage/fixed)
- discount_value (DECIMAL)
- usage_limit (INTEGER)
- is_active (BOOLEAN)
- valid_until (TIMESTAMP)
```

### Offers
```sql
- id (UUID)
- title (VARCHAR)
- discount_percentage (INTEGER)
- offer_type (percentage/fixed/bogo/free_shipping)
- is_active (BOOLEAN)
- valid_until (TIMESTAMP)
```

### Loyalty Transactions
```sql
- id (UUID)
- user_id (UUID)
- transaction_type (earned/redeemed/expired/refunded)
- coins_amount (INTEGER)
- order_id (UUID)
- created_at (TIMESTAMP)
```

### Affiliate Commissions
```sql
- id (UUID)
- affiliate_id (UUID)
- order_id (UUID)
- commission_amount (DECIMAL)
- status (pending/approved/paid/cancelled)
- created_at (TIMESTAMP)
```

---

## 🔐 Security Features

### RLS Policies Created:
```
✅ Public can view active coupons/offers
✅ Users can view own loyalty transactions
✅ Affiliates can view own commissions
✅ Admins can manage everything
```

### Indexes Created:
```
✅ Fast queries on active status
✅ Fast queries on validity dates
✅ Fast queries on user_id
✅ Optimized performance
```

---

## 📊 Sample Data Included

### 3 Sample Coupons:
```
1. WELCOME10 - 10% off for new users
2. SAVE50 - ₹50 off on orders above ₹500
3. FLASH20 - 20% flash sale discount
```

### 3 Sample Offers:
```
1. Summer Sale - 30% off
2. Buy 1 Get 1 - BOGO offer
3. Free Shipping - On orders above ₹999
```

---

## 🧪 Testing After Setup

### 1. Check Store Management
```
1. Go to /admin/store
2. Stats should show:
   - Active Coupons: 3
   - Active Offers: 3
3. No console errors
```

### 2. Check Marketing Tab
```
1. Click "Marketing" tab
2. Coupons table should show 3 coupons
3. Offers table should show 3 offers
4. All data should display correctly
```

### 3. Test CRUD Operations
```
1. Try adding new coupon
2. Try editing existing offer
3. Try deleting a coupon
4. All should work smoothly
```

---

## 🔍 Verification Queries

### Check Tables Exist:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'coupons', 
  'offers', 
  'loyalty_transactions', 
  'affiliate_commissions'
);
```

### Check Data Count:
```sql
SELECT 'Coupons' as table_name, COUNT(*) as count 
FROM public.coupons
UNION ALL
SELECT 'Offers', COUNT(*) FROM public.offers;
```

### Check Sample Coupons:
```sql
SELECT code, discount_type, discount_value, is_active 
FROM public.coupons;
```

---

## 💡 Tips

### If Script Fails:
```
1. Check if affiliate_users table exists
   (Required for affiliate_commissions)
2. Check if orders table exists
   (Required for foreign keys)
3. Run in smaller chunks if needed
4. Check error messages in SQL Editor
```

### If Still Getting Errors:
```
1. Clear browser cache
2. Logout and login again
3. Check browser console
4. Verify tables in Supabase dashboard
```

---

## 🎊 Success Checklist

After running script, verify:
- [ ] No 400 errors in console
- [ ] Store Management page loads
- [ ] Stats show correct numbers
- [ ] Marketing tab shows coupons
- [ ] Marketing tab shows offers
- [ ] CRUD operations work
- [ ] Real-time updates work

---

## 📞 Quick Support

### Still Having Issues?

1. **Check SQL Editor Output**
   - Look for error messages
   - Verify all tables created

2. **Check Browser Console**
   - F12 → Console tab
   - Look for remaining errors

3. **Check Supabase Dashboard**
   - Table Editor
   - Verify tables exist
   - Check sample data

4. **Refresh Everything**
   - Clear cache
   - Logout/Login
   - Refresh page

---

## 🚀 Ready!

Ab bas SQL script run karo aur sab kaam karega! 

**Steps:**
1. SQL Editor kholo
2. Script paste karo
3. RUN karo
4. Page refresh karo
5. Done! ✅

**Happy Managing! 🎉✨**
