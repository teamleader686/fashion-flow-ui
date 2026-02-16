import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface OrderData {
  customer_name: string;
  customer_email?: string;
  customer_phone: string;
  shipping_address_line1: string;
  shipping_address_line2?: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip: string;
  shipping_country?: string;
  subtotal: number;
  shipping_cost: number;
  discount_amount: number;
  coupon_discount: number;
  wallet_amount_used: number;
  loyalty_coins_used: number;
  loyalty_coins_value: number;
  total_coins_to_earn: number;
  total_amount: number;
  shipping_charge: number;
  coupon_code?: string;
  applied_coupons?: Array<{
    id: string;
    code: string;
    discount: number;
    is_affiliate_coupon: boolean;
    affiliate_user_id: string | null;
    commission_amount: number;
  }>;
  payment_method: 'cod';
  items: Array<{
    product_id: string;
    product_name: string;
    product_image?: string;
    sku?: string;
    size?: string;
    color?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}

export const useOrderPlacement = () => {
  const [loading, setLoading] = useState(false);
  const { user, profile } = useAuth();

  const placeOrder = async (orderData: OrderData): Promise<string | null> => {
    setLoading(true);
    try {
      // ============================================
      // STEP 1: RESOLVE AFFILIATE FOR TRACKING
      // ============================================
      let finalAffiliateId: string | null = null;

      // If an affiliate coupon is applied, it takes HIGHEST priority
      const affiliateCoupon = orderData.applied_coupons?.find(c => c.is_affiliate_coupon && c.affiliate_user_id);

      if (affiliateCoupon) {
        finalAffiliateId = affiliateCoupon.affiliate_user_id;
        console.log('[Order] Attribution via Affiliate Coupon:', affiliateCoupon.code);
      } else {
        // Fallback to profile referral
        const profileAffiliateId = (profile as any)?.referred_by_affiliate;
        if (profileAffiliateId) {
          finalAffiliateId = profileAffiliateId;
          console.log('[Order] Attribution via Profile Referral');
        } else {
          // Fallback to tracking link
          const storedReferralCode = localStorage.getItem('affiliate_referral_code');
          if (storedReferralCode) {
            const { data: aff } = await supabase
              .from('affiliates')
              .select('id')
              .eq('referral_code', storedReferralCode)
              .eq('status', 'active')
              .single();
            if (aff) {
              finalAffiliateId = aff.id;
              console.log('[Order] Attribution via Link Referral');
            }
          }
        }
      }

      // ============================================
      // STEP 2: CREATE ORDER
      // ============================================
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: user?.id || null,
          customer_name: orderData.customer_name,
          customer_email: orderData.customer_email,
          customer_phone: orderData.customer_phone,
          shipping_address_line1: orderData.shipping_address_line1,
          shipping_address_line2: orderData.shipping_address_line2,
          shipping_city: orderData.shipping_city,
          shipping_state: orderData.shipping_state,
          shipping_zip: orderData.shipping_zip,
          shipping_country: orderData.shipping_country || 'India',
          subtotal: orderData.subtotal,
          shipping_cost: orderData.shipping_cost,
          discount_amount: orderData.discount_amount,
          coupon_discount: orderData.coupon_discount,
          wallet_amount_used: orderData.wallet_amount_used,
          loyalty_coins_used: orderData.loyalty_coins_used,
          loyalty_coins_value: orderData.loyalty_coins_value,
          total_coins_to_earn: orderData.total_coins_to_earn,
          total_amount: orderData.total_amount,
          shipping_charge: orderData.shipping_charge,
          coupon_code: orderData.applied_coupons?.[0]?.code || orderData.coupon_code, // Main coupon for display
          payment_method: orderData.payment_method,
          payment_status: orderData.payment_method === 'cod' ? 'pending' : 'paid',
          status: 'placed', // Changed from 'pending' to 'placed' as per new flow
          affiliate_id: finalAffiliateId,
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // ============================================
      // STEP 2.5: RECORD ORDER STATUS HISTORY (INITIAL)
      // ============================================
      await supabase.from('order_status_history').insert([{
        order_id: order.id,
        status: 'placed',
        notes: 'Order placed successfully (COD)'
      }]);

      // ============================================
      // STEP 3: CREATE ORDER ITEMS
      // ============================================
      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_image: item.product_image,
        sku: item.sku,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // ============================================
      // STEP 4: RECORD COUPON USAGES & COMMISSIONS
      // ============================================
      if (orderData.applied_coupons && orderData.applied_coupons.length > 0) {
        for (const coupon of orderData.applied_coupons) {
          await supabase.rpc('apply_coupon_v2', {
            p_coupon_id: coupon.id,
            p_user_id: user?.id || null,
            p_order_id: order.id,
            p_discount_amount: coupon.discount,
            p_commission_amount: coupon.commission_amount || 0,
            p_affiliate_id: coupon.affiliate_user_id
          });
        }
      }

      // ============================================
      // STEP 5: CREATE SHIPMENT
      // ============================================
      await supabase.from('shipments').insert([{ order_id: order.id, status: 'pending' }]);

      // ============================================
      // STEP 6: DEDUCT LOYALTY COINS
      // ============================================
      if (orderData.loyalty_coins_used > 0 && user?.id) {
        try {
          await supabase.rpc('deduct_loyalty_balance', {
            p_user_id: user.id,
            p_amount: orderData.loyalty_coins_used
          });

          // Log transaction
          await supabase.from('loyalty_transactions').insert({
            user_id: user.id,
            order_id: order.id,
            coins: orderData.loyalty_coins_used,
            amount: orderData.loyalty_coins_value,
            type: 'redeem',
            wallet_type: 'loyalty',
            description: `Redeemed for Order #${order.order_number}`,
            status: 'completed'
          });
        } catch (coinError) {
          console.error("Coin deduction error:", coinError);
        }
      }

      // Cleanup referral tracking
      localStorage.removeItem('affiliate_referral_code');
      localStorage.removeItem('affiliate_referral_time');
      localStorage.removeItem('affiliate_ref_product_id');

      toast.success('Order placed successfully!');
      return order.order_number;
    } catch (error: any) {
      console.error('Error placing order:', error);
      toast.error(error.message || 'Failed to place order.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { placeOrder, loading };
};
