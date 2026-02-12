import { useState, useEffect } from 'react';
import { supabase, Order } from '@/lib/supabase';
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
            ...(shipmentData.status === 'shipped' && { shipped_at: new Date().toISOString() }),
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
