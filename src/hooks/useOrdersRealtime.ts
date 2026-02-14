import { useState, useEffect } from 'react';
import { supabase, Order, Shipment, Return } from '@/lib/supabase';
import { toast } from 'sonner';

export const useOrdersRealtime = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      // Fetch orders with related data
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch related data separately to avoid relationship issues
      const ordersWithRelations = await Promise.all(
        (ordersData || []).map(async (order) => {
          // Fetch order items
          const { data: items } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id);

          // Fetch shipments
          const { data: shipments } = await supabase
            .from('shipments')
            .select('*')
            .eq('order_id', order.id);

          // Fetch returns
          const { data: returns } = await supabase
            .from('returns')
            .select('*')
            .eq('order_id', order.id);

          // Fetch user profile
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('full_name, email, phone')
            .eq('user_id', order.user_id)
            .single();

          return {
            ...order,
            order_items: items || [],
            shipments: shipments || [],
            returns: returns || [],
            user_profiles: profile
          };
        })
      );

      setOrders(ordersWithRelations);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.message);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Setup realtime subscription
    const subscription = supabase
      .channel('orders_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('Order change detected:', payload);
          fetchOrders();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shipments' },
        (payload) => {
          console.log('Shipment change detected:', payload);
          fetchOrders();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'returns' },
        (payload) => {
          console.log('Return change detected:', payload);
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      if (status === 'delivered' || status === 'cancelled') {
        const { data: orderDetails } = await supabase
          .from('orders')
          .select('user_id, total_coins_to_earn, loyalty_coins_used, order_number')
          .eq('id', orderId)
          .single();

        if (orderDetails?.user_id) {
          // Handle Delivery Reward
          if (status === 'delivered' && orderDetails.total_coins_to_earn > 0) {
            const { data: existingTx } = await supabase
              .from('loyalty_transactions')
              .select('id')
              .eq('order_id', orderId)
              .eq('type', 'earn')
              .maybeSingle();

            if (!existingTx) {
              let newBalance = 0;
              // Award coins
              const { error: rpcError } = await supabase.rpc('add_loyalty_balance', {
                p_user_id: orderDetails.user_id,
                p_amount: orderDetails.total_coins_to_earn
              });

              if (rpcError) {
                const { data: wallet } = await supabase
                  .from('loyalty_wallet')
                  .select('available_balance, total_earned')
                  .eq('user_id', orderDetails.user_id)
                  .single();

                if (wallet) {
                  newBalance = (wallet.available_balance || 0) + orderDetails.total_coins_to_earn;
                  const newTotalEarned = (wallet.total_earned || 0) + orderDetails.total_coins_to_earn;

                  await supabase
                    .from('loyalty_wallet')
                    .update({
                      available_balance: newBalance,
                      total_earned: newTotalEarned,
                      updated_at: new Date().toISOString()
                    })
                    .eq('user_id', orderDetails.user_id);
                }
              }

              await supabase.from('loyalty_transactions').insert({
                user_id: orderDetails.user_id,
                order_id: orderId,
                coins: orderDetails.total_coins_to_earn,
                amount: 0,
                type: 'earn',
                wallet_type: 'loyalty',
                description: `Earned from Order #${orderDetails.order_number}`,
                balance_after: newBalance,
                status: 'completed'
              });

              toast.success(`Awarded ${orderDetails.total_coins_to_earn} loyalty coins to user!`);
            }
          }

          // Handle Cancellation Refund
          if (status === 'cancelled' && orderDetails.loyalty_coins_used && orderDetails.loyalty_coins_used > 0) {
            const { data: existingTx } = await supabase
              .from('loyalty_transactions')
              .select('id')
              .eq('order_id', orderId)
              .eq('type', 'refund')
              .maybeSingle();

            if (!existingTx) {
              const { data: wallet } = await supabase
                .from('loyalty_wallet')
                .select('available_balance')
                .eq('user_id', orderDetails.user_id)
                .single();

              if (wallet) {
                const newBalance = (wallet.available_balance || 0) + orderDetails.loyalty_coins_used;

                await supabase
                  .from('loyalty_wallet')
                  .update({
                    available_balance: newBalance,
                    updated_at: new Date().toISOString()
                  })
                  .eq('user_id', orderDetails.user_id);

                await supabase.from('loyalty_transactions').insert({
                  user_id: orderDetails.user_id,
                  order_id: orderId,
                  type: 'refund',
                  coins: orderDetails.loyalty_coins_used,
                  amount: 0,
                  wallet_type: 'loyalty',
                  description: `Refund for Cancelled Order #${orderDetails.order_number}`,
                  balance_after: newBalance,
                  status: 'completed'
                });

                toast.success(`Refunded ${orderDetails.loyalty_coins_used} coins to wallet.`);
              }
            }
          }
        }
      }

      const { error } = await supabase
        .from('orders')
        .update({
          status,
          updated_at: new Date().toISOString(),
          ...(status === 'delivered' && { delivered_at: new Date().toISOString() })
        })
        .eq('id', orderId);

      if (error) throw error;
      toast.success('Order status updated');
      return true;
    } catch (err: any) {
      console.error('Error updating order status:', err);
      toast.error('Failed to update order status');
      return false;
    }
  };

  const updateShipment = async (
    orderId: string,
    shipmentData: {
      carrier?: string;
      tracking_number?: string;
      tracking_url?: string;
      status?: Shipment['status'];
    }
  ) => {
    try {
      // Check if shipment exists
      const { data: existing } = await supabase
        .from('shipments')
        .select('id')
        .eq('order_id', orderId)
        .single();

      if (existing) {
        // Update existing shipment
        const { error } = await supabase
          .from('shipments')
          .update({
            ...shipmentData,
            ...(shipmentData.status === 'picked_up' && { shipped_at: new Date().toISOString() }),
            ...(shipmentData.status === 'delivered' && { delivered_at: new Date().toISOString() })
          })
          .eq('order_id', orderId);

        if (error) throw error;
      } else {
        // Create new shipment
        const { error } = await supabase
          .from('shipments')
          .insert([{
            order_id: orderId,
            ...shipmentData,
            status: shipmentData.status || 'pending'
          }]);

        if (error) throw error;
      }

      toast.success('Shipment updated');
      return true;
    } catch (err: any) {
      console.error('Error updating shipment:', err);
      toast.error('Failed to update shipment');
      return false;
    }
  };

  const updateReturn = async (
    returnId: string,
    status: Return['status'],
    adminNotes?: string
  ) => {
    try {
      const { error } = await supabase
        .from('returns')
        .update({
          status,
          admin_notes: adminNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', returnId);

      if (error) throw error;
      toast.success('Return status updated');
      return true;
    } catch (err: any) {
      console.error('Error updating return:', err);
      toast.error('Failed to update return');
      return false;
    }
  };

  return {
    orders,
    loading,
    error,
    refetch: fetchOrders,
    updateOrderStatus,
    updateShipment,
    updateReturn
  };
};
