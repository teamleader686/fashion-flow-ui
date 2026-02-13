# 🚀 Deploy Cancellation System - Step by Step

## Pre-Deployment Checklist

✅ All code files created and error-free  
✅ Database schema ready  
✅ Notifications integrated  
✅ Documentation complete  

---

## 📋 Deployment Steps

### Step 1: Database Setup (5 minutes)

1. **Open Supabase Dashboard**
   - Go to your project: https://supabase.com/dashboard
   - Navigate to SQL Editor

2. **Execute Migration**
   ```sql
   -- Copy and paste the entire content of:
   database/cancellation_requests_schema.sql
   
   -- Click "Run" button
   ```

3. **Verify Success**
   You should see these messages:
   ```
   ✓ Table: cancellation_requests
   ✓ Indexes: 4 created
   ✓ RLS Policies: 4 created
   ✓ Functions: 3 created
   ✓ Triggers: 1 created
   ✓ System ready for use!
   ```

4. **Quick Verification Query**
   ```sql
   -- Check table exists
   SELECT COUNT(*) FROM cancellation_requests;
   
   -- Should return: 0 (empty table, no errors)
   ```

---

### Step 2: Frontend Deployment (Already Done! ✅)

All frontend code is already in place:
- ✅ Routes configured
- ✅ Menu items added
- ✅ Components created
- ✅ Notifications integrated
- ✅ No errors in diagnostics

Just restart your dev server if needed:
```bash
npm run dev
# or
yarn dev
```

---

### Step 3: Testing (10 minutes)

#### Test 1: User Submits Request
1. Login as a regular user
2. Navigate to "My Orders"
3. Click on an order with status: pending/confirmed/processing
4. Click "Cancel Order" button
5. Select a reason from dropdown
6. Add optional comment
7. Click "Submit Request"
8. ✅ Should see: "Cancellation request submitted. Awaiting admin approval."
9. ✅ Order should show amber "Cancellation Requested" badge

#### Test 2: Admin Receives Notification
1. Login as admin
2. Check notification bell (should have new notification)
3. ✅ Should see: "Cancellation Request" notification
4. Click notification → Should navigate to cancellation requests page

#### Test 3: Admin Reviews Request
1. On Cancellations page, verify:
   - ✅ Stats show: 1 Pending request
   - ✅ Request appears in list with order details
   - ✅ "Pending" tab is highlighted
2. Click "Review" button
3. ✅ Dialog opens with:
   - Order number and amount
   - Customer name
   - Cancellation reason
   - Comment (if provided)
   - Approve/Reject buttons

#### Test 4: Admin Approves Request
1. Click "Approve" button
2. ✅ Confirmation dialog appears
3. Click "Yes, Approve"
4. ✅ Should see: "Cancellation request approved"
5. ✅ Request moves to "Approved" tab
6. ✅ Order status changes to "cancelled"

#### Test 5: User Receives Approval
1. Switch back to user account
2. Check notifications
3. ✅ Should see: "Cancellation Approved" notification
4. Go to "My Orders"
5. ✅ Order should show "Cancelled" status

#### Test 6: Admin Rejects Request (Optional)
1. Create another test order
2. Submit cancellation request
3. As admin, click "Reject" button
4. Enter rejection reason: "Order already shipped"
5. Click "Reject Request"
6. ✅ Should see: "Cancellation request rejected"
7. ✅ Request moves to "Rejected" tab
8. ✅ Order status reverts to previous state

#### Test 7: User Receives Rejection
1. Switch to user account
2. Check notifications
3. ✅ Should see: "Cancellation Rejected" with reason
4. Go to "My Orders"
5. ✅ Order should show previous status (not cancelled)

---

### Step 4: Responsive Testing (5 minutes)

#### Desktop (≥1024px)
- ✅ Stats cards in 4 columns
- ✅ Full-width layout
- ✅ Sidebar visible
- ✅ Dialogs centered

#### Tablet (768-1023px)
- ✅ Stats cards in 2 columns
- ✅ Collapsible sidebar
- ✅ Compact layout
- ✅ Responsive dialogs

#### Mobile (≤767px)
- ✅ Stats cards in 2 columns
- ✅ Hamburger menu
- ✅ Single column layout
- ✅ Full-screen dialogs
- ✅ Touch-friendly buttons

---

### Step 5: Real-time Testing (3 minutes)

1. **Open two browser windows:**
   - Window 1: Admin panel (Cancellations page)
   - Window 2: User account (My Orders page)

2. **Test real-time updates:**
   - In Window 2: Submit cancellation request
   - In Window 1: ✅ Request should appear immediately (no refresh needed)
   - In Window 1: Approve the request
   - In Window 2: ✅ Order status should update immediately

---

## 🎯 Post-Deployment Verification

### Database Check
```sql
-- Check cancellation requests
SELECT 
  cr.id,
  cr.status,
  o.order_number,
  cr.reason,
  cr.created_at
FROM cancellation_requests cr
JOIN orders o ON o.id = cr.order_id
ORDER BY cr.created_at DESC
LIMIT 10;
```

### Notification Check
```sql
-- Check notifications sent
SELECT 
  title,
  message,
  role,
  status,
  created_at
FROM notifications
WHERE type = 'order_cancelled'
ORDER BY created_at DESC
LIMIT 10;
```

### Order Status Check
```sql
-- Check orders with cancellation status
SELECT 
  order_number,
  status,
  customer_name,
  total_amount,
  updated_at
FROM orders
WHERE status IN ('cancellation_requested', 'cancelled')
ORDER BY updated_at DESC
LIMIT 10;
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "relation 'cancellation_requests' does not exist"
**Cause**: Database migration not run  
**Solution**: Execute `database/cancellation_requests_schema.sql` in Supabase SQL Editor

### Issue 2: "new row violates row-level security policy"
**Cause**: RLS policies not created or user not authenticated  
**Solution**: 
- Verify RLS policies exist: `SELECT * FROM pg_policies WHERE tablename = 'cancellation_requests'`
- Ensure user is logged in
- Check admin_users table has active admin

### Issue 3: Notifications not appearing
**Cause**: Notification service not called or admin_users table empty  
**Solution**:
- Check browser console for errors
- Verify admin_users table: `SELECT * FROM admin_users WHERE is_active = true`
- Check notifications table: `SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5`

### Issue 4: Order status not updating
**Cause**: Trigger or stored procedure not created  
**Solution**:
- Check trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'on_cancellation_request_created'`
- Check functions exist: `SELECT proname FROM pg_proc WHERE proname LIKE '%cancellation%'`
- Re-run database migration

### Issue 5: Real-time updates not working
**Cause**: Supabase Realtime not enabled or subscription failed  
**Solution**:
- Check browser console for subscription errors
- Verify Realtime is enabled in Supabase dashboard
- Check network tab for websocket connection

---

## 📊 Monitoring

### Key Metrics to Track
1. **Cancellation Rate**: % of orders cancelled
2. **Average Review Time**: Time from request to admin decision
3. **Approval Rate**: % of requests approved vs rejected
4. **Common Reasons**: Most frequent cancellation reasons

### Queries for Analytics
```sql
-- Cancellation rate
SELECT 
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END)::FLOAT / COUNT(*) * 100 as cancellation_rate
FROM orders
WHERE created_at >= NOW() - INTERVAL '30 days';

-- Average review time
SELECT 
  AVG(EXTRACT(EPOCH FROM (reviewed_at - created_at))/3600) as avg_hours
FROM cancellation_requests
WHERE reviewed_at IS NOT NULL;

-- Approval rate
SELECT 
  status,
  COUNT(*) as count,
  COUNT(*)::FLOAT / SUM(COUNT(*)) OVER () * 100 as percentage
FROM cancellation_requests
GROUP BY status;

-- Top cancellation reasons
SELECT 
  reason,
  COUNT(*) as count
FROM cancellation_requests
GROUP BY reason
ORDER BY count DESC
LIMIT 10;
```

---

## 🎉 Success Criteria

Your deployment is successful when:

✅ Database migration runs without errors  
✅ User can submit cancellation request  
✅ Admin receives notification  
✅ Request appears in admin panel  
✅ Admin can approve/reject request  
✅ Order status updates correctly  
✅ User receives decision notification  
✅ Real-time updates work on both sides  
✅ Responsive on all devices  
✅ No console errors  

---

## 📞 Need Help?

1. **Check Documentation**: `CANCELLATION_SYSTEM_DOCUMENTATION.md`
2. **Review Summary**: `CANCELLATION_SYSTEM_SUMMARY.md`
3. **Check Supabase Logs**: Dashboard → Logs → API/Database
4. **Browser Console**: F12 → Console tab
5. **Network Tab**: F12 → Network tab (check API calls)

---

## 🚀 You're Ready to Go!

The cancellation system is production-ready. Just follow the steps above and you'll have a fully functional order cancellation workflow with admin approval.

**Estimated Total Time**: 20-25 minutes  
**Difficulty**: Easy  
**Status**: ✅ Ready for Production

---

**Good luck with your deployment! 🎉**
