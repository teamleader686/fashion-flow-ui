import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Order } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { notificationService } from '@/lib/notificationService';

export function useUserOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*),
          shipments (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Transform data
      const transformedOrders = (data || []).map((order) => ({
        ...order,
        shipment: order.shipments?.[0] || null,
      })) as Order[];

      setOrders(transformedOrders);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Failed to fetch orders');
      toast.error('Failed to load orders');
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 300);
    }
  }, [user]);

  useEffect(() => {
    fetchOrders();

    if (!user) return;

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`user_orders_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          console.log('Order updated, refreshing...');
          fetchOrders();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shipments',
        },
        () => {
          console.log('Shipment updated, refreshing...');
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user, fetchOrders]);

  const cancelOrder = async (orderId: string, reason: string, comment: string): Promise<boolean> => {
    try {
      // Get order details for notification
      const { data: orderData } = await supabase
        .from('orders')
        .select('order_number')
        .eq('id', orderId)
        .single();

      // Create cancellation request
      const { error } = await supabase
        .from('cancellation_requests')
        .insert({
          order_id: orderId,
          user_id: user?.id,
          reason,
          comment,
          status: 'pending',
        });

      if (error) throw error;

      // Send notifications
      if (orderData && user) {
        await notificationService.notifyCancellationRequested(
          orderId,
          orderData.order_number,
          user.id,
          reason
        );
      }

      toast.success('Cancellation request submitted. Awaiting admin approval.');
      await fetchOrders();
      return true;
    } catch (err: any) {
      console.error('Error submitting cancellation request:', err);
      toast.error('Failed to submit cancellation request');
      return false;
    }
  };

  const requestReturn = async (
    orderId: string,
    reason: string
  ): Promise<boolean> => {
    try {
      // 1. Create return record
      const { error: returnError } = await supabase
        .from('returns')
        .insert({
          order_id: orderId,
          reason: reason,
          status: 'pending'
        });

      if (returnError) throw returnError;

      // 2. Update order status
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'returned',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast.success('Return request submitted successfully');
      await fetchOrders();
      return true;
    } catch (err: any) {
      console.error('Error requesting return:', err);
      toast.error('Failed to submit return request');
      return false;
    }
  };

  const confirmDelivery = async (orderId: string): Promise<boolean> => {
    try {
      const { data: orderDetails } = await supabase
        .from('orders')
        .select('user_id, total_coins_to_earn, order_number')
        .eq('id', orderId)
        .single();

      if (!orderDetails) throw new Error('Order not found');

      // Update order status
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'delivered',
          order_status: 'delivered',
          delivered_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast.success('Thank you for confirming the delivery!');

      await fetchOrders();
      return true;
    } catch (err: any) {
      console.error('Error confirming delivery:', err);
      toast.error('Failed to confirm delivery');
      return false;
    }
  };

  return {
    orders,
    loading,
    error,
    refetch: fetchOrders,
    cancelOrder,
    requestReturn,
    confirmDelivery,
  };
}
