import { useState, useEffect } from 'react';
import { supabase, Order, Shipment, Return } from '@/lib/supabase';
import { toast } from 'sonner';

export const useOrdersRealtime = (options: {
  page?: number,
  pageSize?: number,
  status?: string,
  search?: string
} = {}) => {
  const { page = 1, pageSize = 10, status = 'all', search = '' } = options;
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items(*),
          shipments(*),
          returns(*)
        `, { count: 'exact' });

      // Apply Filters
      if (status !== 'all') {
        query = query.eq('status', status);
      }

      if (search) {
        const s = `%${search.toLowerCase()}%`;
        query = query.or(`order_number.ilike.${s},customer_name.ilike.${s},customer_email.ilike.${s},customer_phone.ilike.${s}`);
      }

      // Pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error: ordersError, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (ordersError) throw ordersError;

      if (data && data.length > 0) {
        // Fetch profiles separately to avoid FK issues
        const userIds = Array.from(new Set(data.map(o => o.user_id).filter(Boolean)));

        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('user_profiles')
            .select('user_id, full_name, email, phone')
            .in('user_id', userIds);

          const profileMap = (profiles || []).reduce((acc: any, p) => {
            acc[p.user_id] = p;
            return acc;
          }, {});

          const ordersWithProfiles = data.map(order => ({
            ...order,
            user_profiles: profileMap[order.user_id] || null
          }));

          setOrders(ordersWithProfiles);
        } else {
          setOrders(data);
        }
      } else {
        setOrders([]);
      }

      setTotalCount(count || 0);
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
      .channel('orders_changes_admin')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => fetchOrders()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shipments' },
        () => fetchOrders()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'returns' },
        () => fetchOrders()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [page, pageSize, status, search]);

  const updateOrderStatus = async (orderId: string, status: Order['status'], note?: string) => {
    try {
      // Update Order Status
      const { error } = await supabase
        .from('orders')
        .update({
          status,
          order_status: status, // Update both for compatibility
          updated_at: new Date().toISOString(),
          ...(status === 'delivered' && { delivered_at: new Date().toISOString() })
        })
        .eq('id', orderId);

      if (error) throw error;

      // Insert Status History
      await supabase.from('order_status_history').insert({
        order_id: orderId,
        status: status,
        note: note || `Order status updated to ${status}`
      });

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

      // Update orders table with tracking info too
      await supabase
        .from('orders')
        .update({
          tracking_id: shipmentData.tracking_number,
          shipping_partner: shipmentData.carrier,
          ...(shipmentData.status === 'picked_up' && { shipped_at: new Date().toISOString() })
        })
        .eq('id', orderId);

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
    totalCount,
    loading,
    error,
    refetch: fetchOrders,
    updateOrderStatus,
    updateShipment,
    updateReturn
  };
};
