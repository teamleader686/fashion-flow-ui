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
      // STEP 1: RESOLVE AFFILIATE
      // ============================================
      // ============================================
      // STEP 1: RESOLVE AFFILIATE (Coupon > Profile > Link)
      // ============================================
      let affiliateId: string | null = null;
      let affiliateData: any = null;
      let attributionSource: 'coupon' | 'profile' | 'link' = 'link';

      // Priority 1: Check if Coupon Code belongs to an affiliate
      if (orderData.coupon_code) {
        const { data: couponAffiliate } = await supabase
          .from('affiliate_coupons')
          .select('affiliate_id')
          .eq('coupon_code', orderData.coupon_code)
          .eq('is_active', true)
          .single();

        if (couponAffiliate) {
          const { data: aff } = await supabase
            .from('affiliates')
            .select('id, commission_type, commission_value')
            .eq('id', couponAffiliate.affiliate_id)
            .eq('status', 'active')
            .single();

          if (aff) {
            affiliateId = aff.id;
            affiliateData = aff;
            attributionSource = 'coupon';
            console.log('[Affiliate] Attributed via Coupon:', orderData.coupon_code);
          }
        }
      }

      // Priority 2: Check user profile for persistent affiliate link (if no coupon affiliate)
      if (!affiliateId) {
        const profileAffiliateId = (profile as any)?.referred_by_affiliate;
        if (profileAffiliateId) {
          const { data: aff } = await supabase
            .from('affiliates')
            .select('id, commission_type, commission_value')
            .eq('id', profileAffiliateId)
            .eq('status', 'active')
            .single();
          if (aff) {
            affiliateId = aff.id;
            affiliateData = aff;
            attributionSource = 'profile';
          }
        }
      }

      // Priority 3: Check localStorage referral code
      if (!affiliateId) {
        const storedReferralCode = localStorage.getItem('affiliate_referral_code');
        if (storedReferralCode) {
          const { data: aff } = await supabase
            .from('affiliates')
            .select('id, commission_type, commission_value')
            .eq('referral_code', storedReferralCode)
            .eq('status', 'active')
            .single();
          if (aff) {
            affiliateId = aff.id;
            affiliateData = aff;
            attributionSource = 'link';
          }
        }
      }

      // ============================================
      // STEP 2: CALCULATE COMMISSION
      // ============================================
      let commissionAmount = 0;
      const refProductId = localStorage.getItem('affiliate_ref_product_id'); // UUID (resolved by tracker)

      if (affiliateData) {
        let commissionableAmount = 0;

        if (refProductId && attributionSource === 'link') {
          // Product-Specific Link: Only commission on matching items
          const matchingItems = orderData.items.filter(item => item.product_id === refProductId);
          commissionableAmount = matchingItems.reduce((sum, item) => sum + item.total_price, 0);

          // If a global coupon was applied, we should legally prorate it, but for simplicity:
          // If it's a product link, we usually give commission on the product price.
          // Let's keep it simple: matching items total.
        } else {
          // General referral or Coupon: Commission on Net Subtotal
          // (Subtotal - Coupon Discount)
          commissionableAmount = Math.max(0, orderData.subtotal - (orderData.coupon_discount || 0));
        }

        if (commissionableAmount > 0) {
          if (affiliateData.commission_type === 'percentage') {
            commissionAmount = Math.round((commissionableAmount * affiliateData.commission_value) / 100 * 100) / 100;
          } else {
            commissionAmount = affiliateData.commission_value;
          }
          console.log('[Affiliate] Commission calculated:', commissionAmount);
        } else {
          console.log('[Affiliate] No commissionable items in order');
        }
      }

      // ============================================
      // STEP 3: CREATE ORDER
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
          coupon_code: orderData.coupon_code,
          payment_method: orderData.payment_method,
          payment_status: orderData.payment_method === 'cod' ? 'pending' : 'paid',
          status: 'pending',
          affiliate_id: affiliateId,
          affiliate_commission_amount: commissionAmount > 0 ? commissionAmount : null,
          affiliate_commission_status: commissionAmount > 0 ? 'pending' : null,
        }])
        .select()
        .single();

      if (orderError) {
        console.error('Supabase Order Insert Error:', orderError);
        throw orderError;
      }

      // ============================================
      // STEP 4: CREATE ORDER ITEMS
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

      if (itemsError) {
        console.error('Supabase Order Items Insert Error:', itemsError);
        throw itemsError;
      }

      // ============================================
      // STEP 5: CREATE SHIPMENT
      // ============================================
      const { error: shipmentError } = await supabase
        .from('shipments')
        .insert([{
          order_id: order.id,
          status: 'pending',
        }]);

      if (shipmentError) console.warn('Shipment creation warning:', shipmentError);

      // ============================================
      // STEP 6: AFFILIATE COMMISSION RECORD
      // Only create if there is actual commission > 0
      // ============================================
      if (affiliateId && affiliateData && commissionAmount > 0) {
        // 6a. Insert into affiliate_commissions
        const { error: commError } = await supabase
          .from('affiliate_commissions')
          .insert({
            affiliate_id: affiliateId,
            order_id: order.id,
            commission_type: affiliateData.commission_type,
            commission_value: affiliateData.commission_value,
            order_amount: orderData.subtotal,
            commission_amount: commissionAmount,
            status: 'pending',
          });

        if (commError) console.error('[Affiliate] Commission record error:', commError);

        // 6b. Insert into affiliate_orders (for admin tracking with product info)
        const { error: aoError } = await supabase
          .from('affiliate_orders')
          .insert({
            affiliate_id: affiliateId,
            order_id: order.id,
            user_id: user?.id || null,
            product_id: refProductId || null,
            order_amount: orderData.subtotal,
            commission_amount: commissionAmount,
            commission_type: affiliateData.commission_type,
            commission_rate: affiliateData.commission_value,
            status: 'pending',
          });

        if (aoError) console.warn('[Affiliate] Affiliate order record warning:', aoError);

        // 6c. Update affiliate wallet balance
        try {
          const { data: currentAffiliate } = await supabase
            .from('affiliates')
            .select('wallet_balance, total_orders, total_sales, total_commission')
            .eq('id', affiliateId)
            .single();

          if (currentAffiliate) {
            await supabase
              .from('affiliates')
              .update({
                wallet_balance: (currentAffiliate.wallet_balance || 0) + commissionAmount,
                total_orders: (currentAffiliate.total_orders || 0) + 1,
                total_sales: (currentAffiliate.total_sales || 0) + orderData.total_amount,
                total_commission: (currentAffiliate.total_commission || 0) + commissionAmount,
              })
              .eq('id', affiliateId);
          }
        } catch (walletErr) {
          console.error('[Affiliate] Wallet update error:', walletErr);
        }

        console.log('[Affiliate] ✅ Commission assigned:', commissionAmount);
      }

      // 6d. Always clear referral data after order (prevent reuse / duplicate commission)
      localStorage.removeItem('affiliate_referral_code');
      localStorage.removeItem('affiliate_referral_time');
      localStorage.removeItem('affiliate_ref_product_id');

      // ============================================
      // STEP 7: DEDUCT LOYALTY COINS
      // ============================================
      if (orderData.loyalty_coins_used > 0 && user?.id) {
        try {
          const { error: walletError } = await supabase.rpc('deduct_loyalty_balance', {
            p_user_id: user.id,
            p_amount: orderData.loyalty_coins_used
          });

          let newBalance = 0;

          if (walletError) {
            // Fallback to direct update
            const { data: currentWallet } = await supabase
              .from('loyalty_wallet')
              .select('available_balance, total_redeemed')
              .eq('user_id', user.id)
              .single();

            if (currentWallet) {
              newBalance = Math.max(0, currentWallet.available_balance - orderData.loyalty_coins_used);
              const newRedeemed = (currentWallet.total_redeemed || 0) + orderData.loyalty_coins_used;

              await supabase
                .from('loyalty_wallet')
                .update({
                  available_balance: newBalance,
                  total_redeemed: newRedeemed,
                  updated_at: new Date().toISOString()
                })
                .eq('user_id', user.id);
            }
          }

          // Log transaction
          await supabase
            .from('loyalty_transactions')
            .insert({
              user_id: user.id,
              order_id: order.id,
              coins: orderData.loyalty_coins_used,
              amount: orderData.loyalty_coins_value,
              type: 'redeem',
              wallet_type: 'loyalty',
              description: `Redeemed for Order #${order.order_number}`,
              balance_after: newBalance,
              status: 'completed'
            });

        } catch (coinError) {
          console.error("Error processing loyalty coins:", coinError);
          toast.error("Order placed, but failed to update coin wallet.");
        }
      }

      toast.success('Order placed successfully!');
      return order.order_number;
    } catch (error: any) {
      console.error('Error placing order:', error);
      toast.error(error.message || 'Failed to place order. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { placeOrder, loading };
};
