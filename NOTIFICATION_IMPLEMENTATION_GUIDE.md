# 🚀 Notification System - Quick Implementation Guide

## Step-by-Step Setup

### 1️⃣ Database Setup

Run the SQL schema in your Supabase dashboard:

```bash
# Navigate to Supabase Dashboard > SQL Editor
# Copy and paste the contents of: database/notifications_schema.sql
# Click "Run" to execute
```

This will create:
- ✅ `notifications` table
- ✅ `notification_preferences` table
- ✅ Indexes for performance
- ✅ RLS policies
- ✅ Helper functions

### 2️⃣ Update Supabase Types (Optional)

Add to `src/lib/supabase.ts`:

```typescript
export type { Notification } from '@/types/notifications';
```

### 3️⃣ Test the System

#### Create a Test Notification

```typescript
import { notificationService } from '@/lib/notificationService';

// Test order notification
await notificationService.notifyOrderPlaced(
  'test-order-id',
  'user-id',
  'ORD-12345'
);
```

#### View Notifications

Navigate to:
- User: `/notifications`
- Admin: `/admin/notifications`

### 4️⃣ Integration Points

#### A. Order Module

In your order creation/update logic:

```typescript
// After order is created
await notificationService.notifyOrderPlaced(
  order.id,
  order.user_id,
  order.order_number
);

// When status changes
await notificationService.notifyOrderStatusChange(
  order.id,
  order.user_id,
  order.order_number,
  'shipped' // or 'delivered', 'cancelled', etc.
);

// When order is cancelled by user
await notificationService.notifyOrderCancelled(
  order.id,
  order.order_number
);

// When return request is submitted
await notificationService.notifyReturnRequest(
  order.id,
  order.order_number
);

// When return is approved/rejected
await notificationService.notifyReturnStatus(
  order.id,
  order.user_id,
  order.order_number,
  true // or false for rejected
);

// When refund is completed
await notificationService.notifyRefundCompleted(
  order.id,
  order.user_id,
  order.order_number,
  refundAmount
);
```

#### B. Shipping Module

In your shipping/tracking logic:

```typescript
// When courier is assigned
await notificationService.notifyCourierAssigned(
  order.id,
  order.user_id,
  order.order_number,
  'Blue Dart' // courier name
);

// When tracking number is generated
await notificationService.notifyTrackingGenerated(
  order.id,
  order.user_id,
  order.order_number,
  'BD123456789'
);

// When shipping status changes
await notificationService.notifyShippingStatus(
  order.id,
  order.user_id,
  order.order_number,
  'in_transit' // or 'picked_up', 'out_for_delivery', 'delivered'
);

// When delivery fails (admin notification)
await notificationService.notifyDeliveryFailed(
  order.id,
  order.order_number,
  'Customer not available'
);
```

#### C. Instagram Marketing Module

In your Instagram campaign logic:

```typescript
// When campaign is created
await notificationService.notifyCampaignCreated(
  campaign.id,
  campaign.title
);

// When story is assigned to user
await notificationService.notifyStoryAssigned(
  instagramUser.id,
  campaign.title,
  assignment.id
);

// When coins are earned
await notificationService.notifyCoinsEarned(
  instagramUser.id,
  50, // coins amount
  'Story completed successfully'
);
```

#### D. Affiliate Module

In your affiliate logic:

```typescript
// When commission is earned
await notificationService.notifyCommissionEarned(
  affiliate.id,
  commission.amount,
  order.id
);

// When commission is approved/rejected
await notificationService.notifyCommissionStatus(
  affiliate.id,
  commission.amount,
  true // or false for rejected
);

// When payout is processed
await notificationService.notifyPayoutProcessed(
  affiliate.id,
  payout.amount
);

// When new affiliate registers (admin notification)
await notificationService.notifyAffiliateRegistered(
  affiliate.id,
  affiliate.name
);

// When payout is requested (admin notification)
await notificationService.notifyPayoutRequest(
  affiliate.id,
  affiliate.name,
  payout.amount
);
```

---

## 🎨 UI Components Usage

### Add Notification Bell to Header

```typescript
import NotificationBell from '@/components/notifications/NotificationBell';

// In your header component
<NotificationBell role="admin" />
// or
<NotificationBell role="user" />
```

### Create Custom Notification Display

```typescript
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';

function MyNotifications() {
  const { user } = useAuth();
  const { notifications, stats, markAsRead } = useNotifications({
    userId: user?.id || '',
    role: 'user',
    autoRefresh: true,
  });

  return (
    <div>
      <h2>You have {stats.unread} unread notifications</h2>
      {notifications.map(notification => (
        <div key={notification.id} onClick={() => markAsRead(notification.id)}>
          <h3>{notification.title}</h3>
          <p>{notification.message}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## 🧪 Testing

### 1. Manual Testing

```typescript
// In browser console or test file
import { notificationService } from '@/lib/notificationService';

// Get current user ID from Supabase
const userId = 'your-user-id';

// Create test notification
await notificationService.createNotification({
  userId: userId,
  role: 'user',
  module: 'order',
  type: 'order_placed',
  title: 'Test Notification',
  message: 'This is a test notification',
  priority: 'high',
  actionUrl: '/account',
  actionLabel: 'View Account',
});
```

### 2. Check Database

```sql
-- View all notifications
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10;

-- Check unread count
SELECT COUNT(*) FROM notifications WHERE status = 'unread';

-- View by module
SELECT module, COUNT(*) FROM notifications GROUP BY module;
```

### 3. Test Real-time Updates

1. Open two browser windows
2. Login as same user in both
3. Create notification in one window
4. Watch it appear in real-time in the other window

---

## 🔧 Customization

### Change Notification Colors

Edit `src/components/notifications/NotificationItem.tsx`:

```typescript
const getPriorityColor = () => {
  switch (notification.priority) {
    case 'urgent':
      return 'bg-red-100 border-red-200'; // Change colors here
    case 'high':
      return 'bg-orange-100 border-orange-200';
    // ... etc
  }
};
```

### Add New Notification Type

1. Add type to `src/types/notifications.ts`:
```typescript
export type OrderNotificationType =
  | 'order_placed'
  | 'your_new_type'; // Add here
```

2. Add service method in `src/lib/notificationService.ts`:
```typescript
async notifyYourNewType(orderId: string, userId: string) {
  await this.createNotification({
    userId,
    role: 'user',
    module: 'order',
    type: 'your_new_type',
    title: 'Your Title',
    message: 'Your message',
    priority: 'medium',
  });
}
```

3. Use it in your code:
```typescript
await notificationService.notifyYourNewType(orderId, userId);
```

---

## 📊 Monitoring

### Check Notification Stats

```typescript
const { stats } = useNotifications({
  userId: user.id,
  role: 'user',
});

console.log('Total:', stats.total);
console.log('Unread:', stats.unread);
console.log('By Module:', stats.byModule);
console.log('By Priority:', stats.byPriority);
```

### Database Queries

```sql
-- Most active users
SELECT user_id, COUNT(*) as notification_count
FROM notifications
GROUP BY user_id
ORDER BY notification_count DESC
LIMIT 10;

-- Notifications by day
SELECT DATE(created_at) as date, COUNT(*) as count
FROM notifications
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Unread notifications by module
SELECT module, COUNT(*) as unread_count
FROM notifications
WHERE status = 'unread'
GROUP BY module;
```

---

## 🚨 Troubleshooting

### Issue: Notifications not appearing

**Solution:**
1. Check if notification was created in database
2. Verify user_id matches logged-in user
3. Check RLS policies are enabled
4. Verify Supabase connection

### Issue: Real-time not working

**Solution:**
1. Check Supabase Realtime is enabled in project settings
2. Verify channel subscription in browser console
3. Check network tab for websocket connection
4. Try refreshing the page

### Issue: Badge count wrong

**Solution:**
1. Call `refetch()` to refresh data
2. Check if multiple notifications have same ID
3. Verify status field is 'unread'

### Issue: Permission denied

**Solution:**
1. Check RLS policies in Supabase
2. Verify user is authenticated
3. Check user_id matches auth.uid()
4. For admin, verify admin_users table entry

---

## 📝 Checklist

### Initial Setup
- [ ] Run database schema SQL
- [ ] Verify tables created
- [ ] Check RLS policies enabled
- [ ] Test notification creation

### Integration
- [ ] Add notification bell to header
- [ ] Integrate with order module
- [ ] Integrate with shipping module
- [ ] Integrate with Instagram module
- [ ] Integrate with affiliate module

### Testing
- [ ] Create test notifications
- [ ] Verify real-time updates
- [ ] Test mark as read
- [ ] Test delete
- [ ] Test filters
- [ ] Test on mobile
- [ ] Test on tablet
- [ ] Test on desktop

### Production
- [ ] Review RLS policies
- [ ] Set up monitoring
- [ ] Configure cleanup job
- [ ] Document for team
- [ ] Train users

---

## 🎉 You're Done!

Your notification system is now ready to use. Start integrating it into your modules and enjoy real-time notifications!

For detailed documentation, see: `NOTIFICATION_SYSTEM_DOCUMENTATION.md`
