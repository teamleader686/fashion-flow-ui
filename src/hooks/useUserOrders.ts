import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Order } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { notificationService } from '@/lib/notificationService';

export function useUserOrders() {
  const { user } = useAuth();
  const { pathname } = useLocation();
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
          shipment:shipments (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Supabase fetch error:', fetchError);
        throw fetchError;
      }

      // Transform data securely
      const transformedOrders = (data || []).map((order) => {
        // Handle array or object for shipments relation depending on Supabase version
        let shipmentDetail = null;
        if (order.shipment) {
          shipmentDetail = Array.isArray(order.shipment) ? order.shipment[0] : order.shipment;
        } else if ((order as any).shipments) {
          shipmentDetail = Array.isArray((order as any).shipments) ? (order as any).shipments[0] : (order as any).shipments;
        }

        return {
          ...order,
          shipment: shipmentDetail || null,
        };
      }) as Order[];

      setOrders(transformedOrders);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let mounted = true;

    if (user && mounted) {
      fetchOrders();
    }

    if (!user) return;

    let channel: any;
    try {
      // Subscribe to real-time updates securely
      channel = supabase
        .channel(`user_orders_${user.id}_${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            if (mounted) fetchOrders();
          }
        )
        .subscribe((status, err) => {
          if (err) console.error("Realtime subscription error in useUserOrders:", err);
        });
    } catch (e) {
      console.error("Failed to setup real-time subscription", e);
    }

    return () => {
      mounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user, fetchOrders]);

  const cancelOrder = async (orderId: string, reason: string, comment: string): Promise<boolean> => {
    try {
      // 1. Check for existing pending request
      const { data: existingRequest } = await supabase
        .from('cancellation_requests')
        .select('id')
        .eq('order_id', orderId)
        .eq('status', 'pending')
        .maybeSingle();

      if (existingRequest) {
        toast.error('A cancellation request is already pending for this order');
        return false;
      }

      // 2. Get order details for notification
      const { data: orderData } = await supabase
        .from('orders')
        .select('order_number')
        .eq('id', orderId)
        .single();

      // 3. Create cancellation request
      console.log('Submitting cancellation request:', {
        order_id: orderId,
        user_id: user?.id,
        reason,
        status: 'pending'
      });

      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('cancellation_requests')
        .insert({
          order_id: orderId,
          user_id: user.id,
          reason,
          comment: comment || null,
          status: 'pending',
        });

      if (error) {
        console.error('Supabase insertion error:', error);
        throw error;
      }

      // 4. Send notifications
      if (orderData && user) {
        try {
          await notificationService.notifyCancellationRequested(
            orderId,
            orderData.order_number,
            user.id,
            reason
          );
        } catch (notifyErr) {
          console.error('Notification error (ignoring):', notifyErr);
        }
      }

      toast.success('Cancellation request submitted. Awaiting admin approval.');
      await fetchOrders();
      return true;
    } catch (err: any) {
      console.error('Error submitting cancellation request:', err);
      toast.error(err.message || 'Failed to submit cancellation request');
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
