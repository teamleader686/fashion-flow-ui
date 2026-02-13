# Loyalty Coins System - Complete Implementation Guide

## ✅ Current Status

### Database: ✅ READY
- `wallets` table exists with `loyalty_balance`
- `loyalty_transactions` table exists
- `products` table has `earn_loyalty_coins` column
- `orders` table has `coins_used`, `coins_earned`, `coins_credited` columns
- Functions exist: `credit_loyalty_coins()`, `redeem_loyalty_coins()`

### Admin Side: ✅ IMPLEMENTED
- LoyaltyTab component exists
- Can configure loyalty coins per product
- Saves to `product_loyalty_config` table

### User Side: ⚠️ NEEDS UPDATE
- Need to display coins on product cards
- Need to add coins section in checkout
- Need to implement order processing logic

---

## 🎯 What's Working vs What's Needed

### ✅ Already Working:

1. **Admin can set loyalty coins** (via LoyaltyTab)
2. **Database structure is ready**
3. **Wallet system exists**
4. **Transaction tracking exists**

### ⚠️ Needs Implementation:

1. **Display coins on product listing**
2. **Display coins on product detail**
3. **Show coins in checkout**
4. **Apply coins for discount**
5. **Credit coins after order**

---

## 📋 Implementation Plan

### Phase 1: Display Coins on Products ⏳

#### File: `src/components/ProductCard.tsx`

Add coin badge to product cards:

```typescript
// Add this to ProductCard component
{product.loyalty_config?.[0]?.is_enabled && (
  <div className="flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
    <Coins className="h-3 w-3" />
    <span>Earn {product.loyalty_config[0].coins_earned_per_purchase} coins</span>
  </div>
)}
```

#### File: `src/pages/ProductDetail.tsx`

Add coins info section:

```typescript
{product.loyalty_config?.[0]?.is_enabled && (
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
    <div className="flex items-center gap-2 mb-2">
      <Coins className="h-5 w-5 text-yellow-600" />
      <h3 className="font-semibold text-yellow-900">Loyalty Rewards</h3>
    </div>
    <p className="text-sm text-yellow-800">
      Earn {product.loyalty_config[0].coins_earned_per_purchase} loyalty coins when you purchase this product!
    </p>
    <p className="text-xs text-yellow-700 mt-1">
      Use coins to get discounts on future purchases
    </p>
  </div>
)}
```

---

### Phase 2: Checkout Integration ⏳

#### File: `src/pages/Checkout.tsx`

Add coins section:

```typescript
// 1. Fetch user's wallet balance
const [userCoins, setUserCoins] = useState(0);
const [coinsToUse, setCoinsToUse] = useState(0);

useEffect(() => {
  fetchUserCoins();
}, []);

const fetchUserCoins = async () => {
  const { data } = await supabase
    .from('wallets')
    .select('loyalty_balance')
    .eq('user_id', user.id)
    .single();
  
  setUserCoins(data?.loyalty_balance || 0);
};

// 2. Calculate discount
const coinsDiscount = coinsToUse; // 1 coin = ₹1

// 3. Update total
const finalTotal = subtotal - coinsDiscount;

// 4. UI Component
<Card>
  <CardHeader>
    <CardTitle>Loyalty Coins</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-3">
      <div className="flex justify-between">
        <span>Available Coins:</span>
        <span className="font-semibold">{userCoins} coins</span>
      </div>
      
      {userCoins > 0 && (
        <>
          <Input
            type="number"
            max={Math.min(userCoins, subtotal)}
            value={coinsToUse}
            onChange={(e) => setCoinsToUse(parseInt(e.target.value) || 0)}
            placeholder="Enter coins to use"
          />
          <Button onClick={() => setCoinsToUse(Math.min(userCoins, subtotal))}>
            Use Maximum Coins
          </Button>
          {coinsToUse > 0 && (
            <p className="text-sm text-green-600">
              You'll save ₹{coinsDiscount}
            </p>
          )}
        </>
      )}
      
      <div className="bg-blue-50 p-3 rounded">
        <p className="text-sm text-blue-800">
          You'll earn {totalCoinsToEarn} coins from this order!
        </p>
      </div>
    </div>
  </CardContent>
</Card>
```

---

### Phase 3: Order Processing ⏳

#### File: Order processing logic

```typescript
// After successful order creation
const processLoyaltyCoins = async (orderId: string, userId: string) => {
  // 1. Deduct used coins
  if (coinsToUse > 0) {
    await supabase.rpc('redeem_loyalty_coins', {
      p_user_id: userId,
      p_order_id: orderId,
      p_coins: coinsToUse,
      p_description: `Redeemed for order #${orderId.slice(0, 8)}`
    });
  }
  
  // 2. Calculate coins to earn
  const coinsToEarn = cartItems.reduce((total, item) => {
    const productCoins = item.product.loyalty_config?.[0]?.coins_earned_per_purchase || 0;
    return total + (productCoins * item.quantity);
  }, 0);
  
  // 3. Credit earned coins
  if (coinsToEarn > 0) {
    await supabase.rpc('credit_loyalty_coins', {
      p_user_id: userId,
      p_order_id: orderId,
      p_coins: coinsToEarn,
      p_description: `Earned from order #${orderId.slice(0, 8)}`
    });
  }
  
  // 4. Update order record
  await supabase
    .from('orders')
    .update({
      coins_used: coinsToUse,
      coins_earned: coinsToEarn,
      coins_credited: true
    })
    .eq('id', orderId);
};
```

---

## 🎨 UI Components to Create

### 1. CoinBadge Component

```typescript
// src/components/ui/coin-badge.tsx
import { Coins } from 'lucide-react';

interface CoinBadgeProps {
  coins: number;
  variant?: 'earn' | 'redeem';
}

export function CoinBadge({ coins, variant = 'earn' }: CoinBadgeProps) {
  return (
    <div className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
      <Coins className="h-3 w-3" />
      <span>
        {variant === 'earn' ? 'Earn' : 'Use'} {coins} coins
      </span>
    </div>
  );
}
```

### 2. CoinsSection Component

```typescript
// src/components/checkout/CoinsSection.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Coins } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface CoinsSectionProps {
  userId: string;
  subtotal: number;
  onCoinsChange: (coins: number) => void;
}

export function CoinsSection({ userId, subtotal, onCoinsChange }: CoinsSectionProps) {
  const [userCoins, setUserCoins] = useState(0);
  const [coinsToUse, setCoinsToUse] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserCoins();
  }, [userId]);

  const fetchUserCoins = async () => {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('loyalty_balance')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setUserCoins(data?.loyalty_balance || 0);
    } catch (error) {
      console.error('Error fetching coins:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCoinsChange = (value: number) => {
    const maxCoins = Math.min(userCoins, Math.floor(subtotal));
    const validCoins = Math.max(0, Math.min(value, maxCoins));
    setCoinsToUse(validCoins);
    onCoinsChange(validCoins);
  };

  const applyMaxCoins = () => {
    const maxCoins = Math.min(userCoins, Math.floor(subtotal));
    handleCoinsChange(maxCoins);
  };

  if (loading) {
    return <div>Loading coins...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-yellow-500" />
          <CardTitle>Loyalty Coins</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Available Coins:</span>
          <span className="font-semibold text-lg">{userCoins}</span>
        </div>

        {userCoins > 0 && (
          <>
            <div className="space-y-2">
              <Input
                type="number"
                min="0"
                max={Math.min(userCoins, Math.floor(subtotal))}
                value={coinsToUse}
                onChange={(e) => handleCoinsChange(parseInt(e.target.value) || 0)}
                placeholder="Enter coins to use"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={applyMaxCoins}
                className="w-full"
              >
                Use Maximum Coins
              </Button>
            </div>

            {coinsToUse > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800 font-medium">
                  You'll save ₹{coinsToUse} with {coinsToUse} coins!
                </p>
              </div>
            )}
          </>
        )}

        {userCoins === 0 && (
          <p className="text-sm text-gray-500">
            You don't have any coins yet. Start earning by making purchases!
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## 🔧 Database Functions (Already Exist)

### Credit Coins
```sql
SELECT credit_loyalty_coins(
  p_user_id := 'user-uuid',
  p_order_id := 'order-uuid',
  p_coins := 50,
  p_description := 'Earned from purchase'
);
```

### Redeem Coins
```sql
SELECT redeem_loyalty_coins(
  p_user_id := 'user-uuid',
  p_order_id := 'order-uuid',
  p_coins := 100,
  p_description := 'Redeemed for discount'
);
```

### Get Balance
```sql
SELECT get_wallet_balance('user-uuid');
```

---

## 📊 Complete Flow Diagram

```
ADMIN FLOW:
1. Admin creates product
2. Goes to Loyalty tab
3. Enables loyalty coins
4. Sets coins_earned_per_purchase = 50
5. Saves product
   ↓
   Product now has loyalty config

USER FLOW:
1. User views product
   → Sees "Earn 50 coins" badge
2. Adds to cart
3. Goes to checkout
   → Sees available coins: 200
   → Sees will earn: 50 coins
4. Applies 100 coins
   → Gets ₹100 discount
5. Completes order
   ↓
   System processes:
   - Deducts 100 coins (redeem)
   - Credits 50 coins (earn)
   - Updates wallet: 200 - 100 + 50 = 150
   - Creates transactions
   - Sends notification
```

---

## ✅ Testing Checklist

### Admin Side
- [ ] Can enable loyalty coins
- [ ] Can set coins to earn
- [ ] Saves to database
- [ ] Shows in product list

### User Side - Display
- [ ] Coins badge on product cards
- [ ] Coins info on product detail
- [ ] Shows correct coin amount

### User Side - Checkout
- [ ] Shows available coins
- [ ] Can enter coins to use
- [ ] Calculates discount correctly
- [ ] Shows coins to earn
- [ ] Updates total

### User Side - Order
- [ ] Deducts used coins
- [ ] Credits earned coins
- [ ] Creates transactions
- [ ] Updates wallet balance
- [ ] Sends notification

---

## 🚀 Quick Implementation Steps

1. **Add CoinBadge to ProductCard** (5 min)
2. **Add coins info to ProductDetail** (5 min)
3. **Create CoinsSection component** (15 min)
4. **Add CoinsSection to Checkout** (10 min)
5. **Implement order processing** (15 min)
6. **Test end-to-end** (10 min)

**Total Time**: ~1 hour

---

**Status**: Database ✅ | Admin ✅ | User Display ⏳ | Checkout ⏳ | Processing ⏳

**Next**: Implement user-side display and checkout integration
