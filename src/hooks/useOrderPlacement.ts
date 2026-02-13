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
  total_amount: number;
  coupon_code?: string;
  payment_method: 'cod' | 'online' | 'upi' | 'card' | 'netbanking' | 'wallet';
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
  const { user } = useAuth();

  const placeOrder = async (orderData: OrderData): Promise<string | null> => {
    setLoading(true);
    try {
      // Get stored referral code
      const referralCode = localStorage.getItem('affiliate_referral');
      let affiliateId = null;

      // If referral code exists, get affiliate ID
      if (referralCode) {
        const { data: affiliate } = await supabase
          .from('affiliate_users')
          .select('id, commission_type, commission_value') // status might not be needed or exists? Schema has is_active
          .eq('affiliate_code', referralCode)
          .eq('is_active', true) // 'status' -> 'is_active'
          .single();

        if (affiliate) {
          affiliateId = affiliate.id;
        }
      }

      // 1. Create order
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
          total_amount: orderData.total_amount,
          coupon_code: orderData.coupon_code,
          payment_method: orderData.payment_method,
          payment_status: orderData.payment_method === 'cod' ? 'pending' : 'paid',
          status: 'pending',
          affiliate_id: affiliateId,
          // referral_code removed as it doesn't exist in orders table
        }])
        .select()
        .single();

      if (orderError) {
        console.error('Supabase Order Insert Error:', orderError);
        throw orderError;
      }

      // 2. Create order items
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

      // 3. Create initial shipment record
      const { error: shipmentError } = await supabase
        .from('shipments')
        .insert([{
          order_id: order.id,
          status: 'pending',
        }]);

      if (shipmentError) console.warn('Shipment creation warning:', shipmentError);

      // 4. Track affiliate order and calculate commission
      if (affiliateId) {
        const { data: affiliate } = await supabase
          .from('affiliate_users')
          .select('commission_type, commission_value')
          .eq('id', affiliateId)
          .single();

        if (affiliate) {
          // Calculate commission
          let commissionAmount = 0;
          if (affiliate.commission_type === 'percentage') {
            commissionAmount = (orderData.total_amount * affiliate.commission_value) / 100;
          } else {
            commissionAmount = affiliate.commission_value;
          }

          // Create affiliate order record
          const { data: affiliateOrder, error: affiliateOrderError } = await supabase
            .from('affiliate_orders')
            .insert({
              order_id: order.id,
              affiliate_id: affiliateId,
              // user_id removed as it doesn't exist in affiliate_orders table
              order_amount: orderData.total_amount, // Mapped to order_amount
              commission_amount: commissionAmount,
              status: 'pending', // Mapped from commission_status
              commission_type: affiliate.commission_type,
              commission_rate: affiliate.commission_value,
            })
            .select()
            .single();

          if (!affiliateOrderError && affiliateOrder) {
            // Create commission record
            const { error: commissionError } = await supabase
              .from('affiliate_commissions')
              .insert({
                affiliate_id: affiliateId,
                order_id: order.id,
                // affiliate_order_id removed as it doesn't exist in affiliate_commissions table
                commission_type: affiliate.commission_type,
                commission_rate: affiliate.commission_value, // Mapped to commission_rate based on schema
                order_amount: orderData.total_amount,
                commission_amount: commissionAmount,
                status: 'pending',
              });

            if (commissionError) console.warn('Affiliate commission creation warning:', commissionError);
          }
        }

        // Clear referral code after order is placed
        localStorage.removeItem('affiliate_referral');
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
