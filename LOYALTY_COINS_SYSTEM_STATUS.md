# Loyalty Coins System - Current Status & Implementation Guide

## 📊 Current Implementation Status

### ✅ Database Schema (COMPLETE)

**Tables Exist:**
1. ✅ `wallets` - User wallet with loyalty_balance
2. ✅ `wallet_transactions` - All wallet transactions
3. ✅ `loyalty_transactions` - Loyalty coin transactions
4. ✅ `products` - Has `earn_loyalty_coins` column
5. ✅ `orders` - Has `coins_used`, `coins_earned`, `coins_credited` columns

**Functions Exist:**
1. ✅ `credit_loyalty_coins()` - Add coins to user
2. ✅ `redeem_loyalty_coins()` - Deduct coins from user
3. ✅ `get_wallet_balance()` - Get user balance
4. ✅ Auto-create wallet on user signup

**File**: `database/wallet_loyalty_system_schema.sql`

---

## 🔍 What Needs to be Checked/Updated

### 1. Admin Side - Product Form

**Location**: `src/pages/admin/ProductForm.tsx`

**Check if exists:**
- [ ] Loyalty tab in product form
- [ ] Field to set `earn_loyalty_coins`
- [ ] Enable/disable loyalty toggle

**Component**: `src/components/admin/product-form/LoyaltyTab.tsx`

---

### 2. User Side - Product Display

**Locations to check:**
- `src/pages/Products.tsx` - Product listing
- `src/pages/ProductDetail.tsx` - Product detail
- `src/components/ProductCard.tsx` - Product card

**Should display:**
- [ ] "Earn X coins" badge on product cards
- [ ] Loyalty coins info on product detail
- [ ] Coin icon with value

---

### 3. User Side - Checkout Flow

**Location**: `src/pages/Checkout.tsx`

**Should have:**
- [ ] Display user's available coins
- [ ] Option to apply coins for discount
- [ ] Show coins to be earned
- [ ] Update total when coins applied

---

### 4. User Side - Order Completion

**Location**: Order processing logic

**Should do:**
- [ ] Credit coins after successful order
- [ ] Create loyalty transaction
- [ ] Update wallet balance
- [ ] Send notification

---

## 📋 Implementation Checklist

### Phase 1: Verify Database (DONE ✅)
- [x] Tables exist
- [x] Functions exist
- [x] Triggers exist
- [x] RLS policies exist

### Phase 2: Admin Side
- [ ] Check LoyaltyTab component
- [ ] Verify loyalty coins field in form
- [ ] Test saving loyalty coins value
- [ ] Verify it saves to database

### Phase 3: User Side - Display
- [ ] Add coins badge to ProductCard
- [ ] Add coins info to ProductDetail
- [ ] Add coins display to Products page
- [ ] Style with coin icon

### Phase 4: User Side - Checkout
- [ ] Display available coins
- [ ] Add "Apply Coins" button
- [ ] Calculate discount
- [ ] Update order total
- [ ] Save coins_used to order

### Phase 5: User Side - Order Processing
- [ ] Credit coins after order
- [ ] Create loyalty transaction
- [ ] Update wallet balance
- [ ] Send notification

---

## 🔧 Quick Verification Commands

### Check if tables exist:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('wallets', 'loyalty_transactions', 'wallet_transactions');
```

### Check if product has loyalty column:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'products' AND column_name = 'earn_loyalty_coins';
```

### Check if orders have coin columns:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name IN ('coins_used', 'coins_earned', 'coins_credited');
```

### Check if functions exist:
```sql
SELECT proname FROM pg_proc 
WHERE proname IN ('credit_loyalty_coins', 'redeem_loyalty_coins', 'get_wallet_balance');
```

---

## 📝 Next Steps

### Step 1: Verify Current Implementation
Run the SQL commands above to confirm database is ready.

### Step 2: Check Frontend Components
1. Open `src/components/admin/product-form/LoyaltyTab.tsx`
2. Check if it has loyalty coins field
3. Test in admin panel

### Step 3: Check Product Display
1. Open `src/components/ProductCard.tsx`
2. Check if coins are displayed
3. Test on products page

### Step 4: Check Checkout
1. Open `src/pages/Checkout.tsx`
2. Check if coins can be applied
3. Test checkout flow

### Step 5: Test End-to-End
1. Set loyalty coins on product (admin)
2. View product (user)
3. Add to cart
4. Apply coins at checkout
5. Complete order
6. Verify coins credited

---

## 🎯 Expected Flow

### Admin Flow:
```
1. Admin creates/edits product
2. Goes to "Loyalty" tab
3. Enables loyalty coins
4. Sets earn_loyalty_coins = 50
5. Saves product
6. Product now shows "Earn 50 coins"
```

### User Flow:
```
1. User views product
2. Sees "Earn 50 coins on purchase"
3. Adds to cart
4. Goes to checkout
5. Sees: "You have 200 coins available"
6. Clicks "Apply 100 coins"
7. Gets ₹100 discount (if 1 coin = ₹1)
8. Completes order
9. Earns 50 new coins
10. Total coins: 200 - 100 + 50 = 150
```

---

## 🔍 Files to Check

### Database
- ✅ `database/wallet_loyalty_system_schema.sql`

### Admin Components
- `src/pages/admin/ProductForm.tsx`
- `src/components/admin/product-form/LoyaltyTab.tsx`

### User Components
- `src/components/ProductCard.tsx`
- `src/pages/Products.tsx`
- `src/pages/ProductDetail.tsx`
- `src/pages/Checkout.tsx`

### Hooks
- `src/hooks/useWallet.ts` (if exists)
- `src/hooks/useLoyalty.ts` (if exists)

---

## 💡 Implementation Tips

### 1. Coin Display Component
Create reusable component:
```typescript
<CoinBadge coins={50} />
// Shows: 🪙 Earn 50 coins
```

### 2. Checkout Coins Section
```typescript
<div>
  <p>Available Coins: {userCoins}</p>
  <Button onClick={applyCoins}>Apply Coins</Button>
  <p>Discount: ₹{coinsDiscount}</p>
</div>
```

### 3. Order Processing
```typescript
// After successful order
await creditLoyaltyCoins({
  user_id,
  order_id,
  coins: product.earn_loyalty_coins,
  type: 'earn'
});
```

---

## ⚠️ Important Notes

1. **Coin Value**: Define 1 coin = ₹X (e.g., 1 coin = ₹1)
2. **Max Redemption**: Set max coins per order (e.g., 50% of order value)
3. **Expiry**: Coins can have expiry date (optional)
4. **Minimum Order**: Set minimum order value to use coins
5. **Exclusions**: Some products may not allow coin redemption

---

## 🎨 UI/UX Guidelines

### Product Card
```
┌─────────────────┐
│  Product Image  │
│                 │
├─────────────────┤
│ Product Name    │
│ ₹1,000          │
│ 🪙 Earn 50 coins│ ← Add this
└─────────────────┘
```

### Checkout
```
Order Summary
─────────────
Subtotal:     ₹1,000
Coins Applied: -₹100  ← Show discount
─────────────
Total:        ₹900

Available Coins: 200
[Apply 100 Coins] ← Button

You'll earn: 50 coins ← Show earnings
```

---

## 🚀 Quick Start

### If Database Not Set Up:
```bash
# Run in Supabase SQL Editor
database/wallet_loyalty_system_schema.sql
```

### If Frontend Not Implemented:
1. Check LoyaltyTab component
2. Add coins display to ProductCard
3. Add coins section to Checkout
4. Implement order processing logic

---

**Status**: Database ✅ | Frontend ⏳ (Need to verify)

**Next**: Check frontend components and update as needed.
