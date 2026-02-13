import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface UserOrderStats {
  // Order Statistics
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;

  // Spending Summary
  totalAmountSpent: number;
  totalAmountRefunded: number;
  totalActiveOrdersValue: number;

  // Loyalty Coins
  totalCoinsEarned: number;
  totalCoinsRedeemed: number;
  currentWalletBalance: number;

  // Shipping Summary
  ordersInTransit: number;
  ordersOutForDelivery: number;
  ordersDelivered: number;
}

export const useUserOrderStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserOrderStats>({
    totalOrders: 0,
    pendingOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    totalAmountSpent: 0,
    totalAmountRefunded: 0,
    totalActiveOrdersValue: 0,
    totalCoinsEarned: 0,
    totalCoinsRedeemed: 0,
    currentWalletBalance: 0,
    ordersInTransit: 0,
    ordersOutForDelivery: 0,
    ordersDelivered: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch all user stats in parallel
      const [
        // Order counts by status
        totalOrdersResult,
        pendingOrdersResult,
        processingOrdersResult,
        shippedOrdersResult,
        deliveredOrdersResult,
        cancelledOrdersResult,

        // Spending data
        allOrdersResult,
        refundedOrdersResult,
        activeOrdersResult,

        // Loyalty data
        userProfileResult,
        coinsEarnedResult,
        coinsRedeemedResult,

        // Shipping data
        inTransitResult,
        outForDeliveryResult,
        deliveredShipmentsResult,
      ] = await Promise.all([
        // Order counts
        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),

        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'pending'),

        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'processing'),

        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'shipped'),

        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'delivered'),

        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'cancelled'),

        // Spending data
        supabase
          .from('orders')
          .select('total_amount, payment_status')
          .eq('user_id', user.id)
          .eq('payment_status', 'paid'),

        supabase
          .from('orders')
          .select('total_amount')
          .eq('user_id', user.id)
          .in('payment_status', ['refunded', 'partially_refunded']),

        supabase
          .from('orders')
          .select('total_amount')
          .eq('user_id', user.id)
          .in('status', ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery']),

        // Loyalty data
        supabase
          .from('user_profiles')
          .select('loyalty_coins_balance')
          .eq('user_id', user.id)
          .single(),

        supabase
          .from('loyalty_transactions')
          .select('coins_amount')
          .eq('user_id', user.id)
          .eq('transaction_type', 'earned'),

        supabase
          .from('loyalty_transactions')
          .select('coins_amount')
          .eq('user_id', user.id)
          .eq('transaction_type', 'redeemed'),

        // Shipping data
        supabase
          .from('shipments')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'in_transit')
          .eq('user_id', user.id),

        supabase
          .from('shipments')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'out_for_delivery'),

        supabase
          .from('shipments')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'delivered'),
      ]);

      // Calculate spending totals
      const totalAmountSpent = allOrdersResult.data?.reduce(
        (sum, order) => sum + (order.total_amount || 0),
        0
      ) || 0;

      const totalAmountRefunded = refundedOrdersResult.data?.reduce(
        (sum, order) => sum + (order.total_amount || 0),
        0
      ) || 0;

      const totalActiveOrdersValue = activeOrdersResult.data?.reduce(
        (sum, order) => sum + (order.total_amount || 0),
        0
      ) || 0;

      // Calculate loyalty totals
      const totalCoinsEarned = coinsEarnedResult.data?.reduce(
        (sum, tx) => sum + (tx.coins_amount || 0),
        0
      ) || 0;

      const totalCoinsRedeemed = coinsRedeemedResult.data?.reduce(
        (sum, tx) => sum + Math.abs(tx.coins_amount || 0),
        0
      ) || 0;

      const currentWalletBalance = userProfileResult.data?.loyalty_coins_balance || 0;

      setStats({
        // Order counts
        totalOrders: totalOrdersResult.count || 0,
        pendingOrders: pendingOrdersResult.count || 0,
        processingOrders: processingOrdersResult.count || 0,
        shippedOrders: shippedOrdersResult.count || 0,
        deliveredOrders: deliveredOrdersResult.count || 0,
        cancelledOrders: cancelledOrdersResult.count || 0,

        // Spending
        totalAmountSpent,
        totalAmountRefunded,
        totalActiveOrdersValue,

        // Loyalty
        totalCoinsEarned,
        totalCoinsRedeemed,
        currentWalletBalance,

        // Shipping
        ordersInTransit: inTransitResult.count || 0,
        ordersOutForDelivery: outForDeliveryResult.count || 0,
        ordersDelivered: deliveredShipmentsResult.count || 0,
      });

      setError(null);
    } catch (err: any) {
      console.error('Error fetching user order stats:', err);
      setError(err.message);
      toast.error('Failed to load order statistics');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStats();

    if (!user) return;

    // Setup real-time subscriptions
    const ordersChannel = supabase
      .channel('user_orders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    const loyaltyChannel = supabase
      .channel('user_loyalty_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'loyalty_transactions',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      ordersChannel.unsubscribe();
      loyaltyChannel.unsubscribe();
    };
  }, [fetchStats, user]);

  return { stats, loading, error, refetch: fetchStats };
};
