# Order Cancellation System with Admin Approval

## Overview
Complete order cancellation workflow with admin approval system, real-time notifications, and proper status management.

---

## Features

### User Side
- Submit cancellation requests with reason and comments
- Real-time status updates
- Notification when request is approved/rejected
- View cancellation status in order details
- Amber badge for "Cancellation Requested" status

### Admin Side
- Dedicated cancellation requests page
- Filter by status (Pending/Approved/Rejected/All)
- Review dialog with order details
- Approve/Reject with confirmation
- Real-time updates via Supabase subscriptions
- Statistics dashboard

---

## Database Schema

### Table: `cancellation_requests`
```sql
- id (UUID, Primary Key)
- order_id (UUID, Foreign Key → orders.id)
- user_id (UUID)
- reason (TEXT, NOT NULL)
- comment (TEXT, nullable)
- status (TEXT: 'pending' | 'approved' | 'rejected')
- rejection_reason (TEXT, nullable)
- previous_order_status (TEXT)
- created_at (TIMESTAMP)
- reviewed_at (TIMESTAMP, nullable)
- reviewed_by (UUID, nullable)
```

### Stored Procedures
1. **approve_cancellation_request(p_request_id, p_admin_id)**
   - Updates request status to 'approved'
   - Changes order status to 'cancelled'
   - Records admin ID and timestamp

2. **reject_cancellation_request(p_request_id, p_admin_id, p_rejection_reason)**
   - Updates request status to 'rejected'
   - Reverts order to previous status
   - Stores rejection reason

### Triggers
- **on_cancellation_request_created**: Automatically updates order status to 'cancellation_requested' when request is submitted

---

## File Structure

### Frontend Components

#### User Side
```
src/components/orders/
├── CancelOrderDialog.tsx          # User cancellation request form
├── OrderCard.tsx                  # Shows cancellation status badge
└── OrderDetailModal.tsx           # Displays cancellation details
```

#### Admin Side
```
src/pages/admin/
└── CancellationRequests.tsx       # Main admin page

src/components/admin/
└── CancellationReviewDialog.tsx   # Review & approve/reject dialog
```

### Hooks
```
src/hooks/
└── useUserOrders.ts               # Handles cancellation submission
```

### Services
```
src/lib/
└── notificationService.ts         # Notification methods
```

### Database
```
database/
└── cancellation_requests_schema.sql  # Complete schema setup
```

---

## User Flow

### 1. Submit Cancellation Request
```typescript
// User clicks "Cancel Order" button
// CancelOrderDialog opens with:
- Reason dropdown (7 predefined reasons)
- Optional comment textarea
- Warning about admin approval

// On submit:
1. Insert into cancellation_requests table
2. Trigger updates order status to 'cancellation_requested'
3. Send notification to all admins
4. Send confirmation notification to user
5. Show success toast
```

### 2. View Request Status
```typescript
// In MyOrders page:
- Order card shows amber "Cancellation Requested" badge
- Order detail modal displays:
  - Current status
  - Cancellation reason
  - Comment (if provided)
  - Timestamp
```

### 3. Receive Decision
```typescript
// When admin approves:
- User receives notification
- Order status changes to 'cancelled'
- Refund processing message shown

// When admin rejects:
- User receives notification with reason
- Order status reverts to previous state
- User can view rejection reason
```

---

## Admin Flow

### 1. View Requests
```typescript
// Navigate to /admin/cancellation-requests
// Dashboard shows:
- Statistics cards (Pending/Approved/Rejected/Total)
- Filter tabs
- Real-time request list with:
  - Order number
  - Customer name
  - Order amount
  - Cancellation reason
  - Comment
  - Timestamp
```

### 2. Review Request
```typescript
// Click "Review" button
// CancellationReviewDialog shows:
- Order information
- Customer details
- Cancellation reason
- Additional comments
- Warning about action consequences
```

### 3. Approve Request
```typescript
// Click "Approve" button
1. Confirmation dialog appears
2. On confirm:
   - Call approve_cancellation_request()
   - Update request status to 'approved'
   - Change order status to 'cancelled'
   - Send notification to user
   - Show success toast
   - Close dialog
```

### 4. Reject Request
```typescript
// Click "Reject" button
1. Rejection reason dialog appears
2. Admin enters reason (required)
3. On submit:
   - Call reject_cancellation_request()
   - Update request status to 'rejected'
   - Revert order to previous status
   - Send notification to user with reason
   - Show success toast
   - Close dialog
```

---

## Notification System

### User Notifications
1. **Request Submitted**
   - Title: "Cancellation Request Submitted"
   - Message: "Your cancellation request for order #XXX is under review."
   - Priority: Medium

2. **Request Approved**
   - Title: "Cancellation Approved"
   - Message: "Your cancellation request for order #XXX has been approved. Refund will be processed soon."
   - Priority: High

3. **Request Rejected**
   - Title: "Cancellation Rejected"
   - Message: "Your cancellation request for order #XXX has been rejected. Reason: [reason]"
   - Priority: High

### Admin Notifications
1. **New Request**
   - Title: "Cancellation Request"
   - Message: "Cancellation request for order #XXX. Reason: [reason]"
   - Priority: High
   - Action: "Review Request" → /admin/cancellation-requests

---

## Real-time Updates

### User Side
```typescript
// useUserOrders hook subscribes to:
- orders table changes (filter: user_id)
- Automatically refetches when order status changes
```

### Admin Side
```typescript
// CancellationRequests page subscribes to:
- cancellation_requests table changes
- Automatically refetches on any insert/update/delete
```

---

## Status Flow

```
Order Status Flow:
pending/confirmed/processing
    ↓ (user submits request)
cancellation_requested
    ↓ (admin approves)
cancelled
    OR
    ↓ (admin rejects)
[previous_status] (reverted)
```

---

## API Endpoints

### User Actions
```typescript
// Submit cancellation request
POST /rest/v1/cancellation_requests
Body: {
  order_id: string,
  user_id: string,
  reason: string,
  comment?: string,
  status: 'pending'
}
```

### Admin Actions
```typescript
// Approve request
POST /rest/v1/rpc/approve_cancellation_request
Body: {
  p_request_id: string,
  p_admin_id: string
}

// Reject request
POST /rest/v1/rpc/reject_cancellation_request
Body: {
  p_request_id: string,
  p_admin_id: string,
  p_rejection_reason: string
}
```

---

## Security (RLS Policies)

### cancellation_requests table
1. **Users can view own requests**
   ```sql
   user_id = auth.uid()
   ```

2. **Users can insert own requests**
   ```sql
   user_id = auth.uid() AND
   order belongs to user AND
   order status allows cancellation
   ```

3. **Admins can view all requests**
   ```sql
   EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
   ```

4. **Admins can update requests**
   ```sql
   EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
   ```

---

## Installation

### 1. Run Database Migration
```bash
# Execute in Supabase SQL Editor
database/cancellation_requests_schema.sql
```

### 2. Verify Installation
```sql
-- Check table exists
SELECT * FROM cancellation_requests LIMIT 1;

-- Check functions exist
SELECT proname FROM pg_proc WHERE proname LIKE '%cancellation%';

-- Check policies exist
SELECT policyname FROM pg_policies WHERE tablename = 'cancellation_requests';
```

### 3. Test Workflow
1. Place a test order as user
2. Submit cancellation request
3. Login as admin
4. Navigate to /admin/cancellation-requests
5. Review and approve/reject
6. Verify notifications received
7. Check order status updated

---

## Responsive Design

### Desktop (≥1024px)
- Full-width layout
- Side-by-side stats cards
- Detailed request cards
- Modal dialogs

### Tablet (768-1023px)
- Stacked stats cards (2 columns)
- Compact request cards
- Responsive dialogs

### Mobile (≤767px)
- Single column layout
- Stacked stats cards
- Simplified request cards
- Full-screen dialogs
- Touch-friendly buttons

---

## Error Handling

### User Side
```typescript
try {
  // Submit request
} catch (error) {
  toast.error('Failed to submit cancellation request');
  console.error(error);
}
```

### Admin Side
```typescript
try {
  // Approve/Reject
} catch (error) {
  toast.error('Failed to process request');
  console.error(error);
}
```

---

## Future Enhancements

1. **Refund Processing**
   - Automatic refund initiation on approval
   - Refund status tracking
   - Payment gateway integration

2. **Analytics**
   - Cancellation rate by product
   - Common cancellation reasons
   - Time-to-review metrics

3. **Bulk Actions**
   - Approve/reject multiple requests
   - Export cancellation reports

4. **Auto-approval Rules**
   - Auto-approve based on order status
   - Auto-approve within time window
   - Configurable approval rules

5. **Customer Communication**
   - Email notifications
   - SMS alerts
   - In-app chat support

---

## Troubleshooting

### Request not appearing in admin panel
- Check RLS policies are enabled
- Verify admin_users table has active admin
- Check real-time subscription is active

### Order status not updating
- Verify trigger is created
- Check stored procedure execution
- Review function logs in Supabase

### Notifications not sent
- Verify notification service is imported
- Check admin_users table for active admins
- Review notification table for entries

---

## Testing Checklist

- [ ] User can submit cancellation request
- [ ] Order status changes to 'cancellation_requested'
- [ ] Admin receives notification
- [ ] User receives confirmation notification
- [ ] Request appears in admin panel
- [ ] Admin can filter by status
- [ ] Admin can approve request
- [ ] Order status changes to 'cancelled'
- [ ] User receives approval notification
- [ ] Admin can reject request
- [ ] Order status reverts to previous
- [ ] User receives rejection notification with reason
- [ ] Real-time updates work on both sides
- [ ] Responsive design works on all devices
- [ ] No console errors

---

## Support

For issues or questions:
1. Check Supabase logs for errors
2. Verify database schema is correct
3. Test RLS policies with different users
4. Review browser console for frontend errors
5. Check notification table for delivery status

---

**Status**: ✅ Production Ready
**Last Updated**: February 12, 2026
**Version**: 1.0.0
