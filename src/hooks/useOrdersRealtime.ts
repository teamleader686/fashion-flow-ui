import { useState, useEffect, useCallback, useRef } from 'react';
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
  const abortRef = useRef<AbortController | null>(null);

  const fetchOrders = useCallback(async () => {
    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    try {
      setLoading(true);
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items(id, order_id, product_name, product_image, quantity, unit_price, total_price, size, color, created_at),
          shipments(id, carrier, tracking_number, tracking_url, status, shipped_at, delivered_at, order_id, created_at),
          returns(id, order_id, reason, status, refund_amount, admin_notes, created_at, updated_at)
        `, { count: 'exact' });

      if (status !== 'all') {
        query = query.eq('status', status);
      }

      if (search) {
        const s = `%${search.toLowerCase()}%`;
        query = query.or(`order_number.ilike.${s},customer_name.ilike.${s},customer_email.ilike.${s},customer_phone.ilike.${s}`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error: ordersError, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (ordersError) throw ordersError;

      if (data && data.length > 0) {
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

          setOrders(data.map(order => ({
            ...order,
            user_profiles: profileMap[order.user_id] || null
          })));
        } else {
          setOrders(data);
        }
      } else {
        setOrders([]);
      }

      setTotalCount(count || 0);
      setError(null);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('Error fetching orders:', err);
      setError(err.message);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, status, search]);

  useEffect(() => {
    let mounted = true;
    if (mounted) fetchOrders();

    let subscription: any;
    try {
      subscription = supabase
        .channel(`orders_changes_admin_${Date.now()}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
          if (mounted) fetchOrders();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'shipments' }, () => {
          if (mounted) fetchOrders();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'returns' }, () => {
          if (mounted) fetchOrders();
        })
        .subscribe((status, err) => {
          if (err) console.error("Realtime subscription error in admin orders:", err);
        });
    } catch (e) {
      console.error("Failed to setup real-time subscription for admin orders", e);
    }

    return () => {
      mounted = false;
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [fetchOrders]);

  const updateOrderStatus = useCallback(async (orderId: string, status: Order['status'], note?: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status,
          order_status: status,
          updated_at: new Date().toISOString(),
          ...(status === 'delivered' && { delivered_at: new Date().toISOString() })
        })
        .eq('id', orderId);

      if (error) throw error;

      // Fire-and-forget history insert (non-blocking)
      supabase.from('order_status_history').insert({
        order_id: orderId,
        status,
        notes: note || `Order status updated to ${status}`
      });

      toast.success('Order status updated');
      return true;
    } catch (err: any) {
      console.error('Error updating order status:', err);
      toast.error('Failed to update order status');
      return false;
    }
  }, []);

  const updateShipment = useCallback(async (
    orderId: string,
    shipmentData: {
      carrier?: string;
      tracking_number?: string;
      tracking_url?: string;
      status?: Shipment['status'];
    }
  ) => {
    try {
      const { data: existing } = await supabase
        .from('shipments')
        .select('id')
        .eq('order_id', orderId)
        .single();

      if (existing) {
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
        const { error } = await supabase
          .from('shipments')
          .insert([{ order_id: orderId, ...shipmentData, status: shipmentData.status || 'pending' }]);

        if (error) throw error;
      }

      // Fire-and-forget orders update
      supabase.from('orders').update({
        tracking_id: shipmentData.tracking_number,
        shipping_partner: shipmentData.carrier,
        ...(shipmentData.status === 'picked_up' && { shipped_at: new Date().toISOString() })
      }).eq('id', orderId);

      toast.success('Shipment updated');
      return true;
    } catch (err: any) {
      console.error('Error updating shipment:', err);
      toast.error('Failed to update shipment');
      return false;
    }
  }, []);

  const updateReturn = useCallback(async (
    returnId: string,
    status: Return['status'],
    adminNotes?: string
  ) => {
    try {
      const { error } = await supabase
        .from('returns')
        .update({ status, admin_notes: adminNotes, updated_at: new Date().toISOString() })
        .eq('id', returnId);

      if (error) throw error;
      toast.success('Return status updated');
      return true;
    } catch (err: any) {
      console.error('Error updating return:', err);
      toast.error('Failed to update return');
      return false;
    }
  }, []);

  return { orders, totalCount, loading, error, refetch: fetchOrders, updateOrderStatus, updateShipment, updateReturn };
};
