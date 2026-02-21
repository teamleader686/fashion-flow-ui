import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase, Order, OrderItem, Shipment, TrackingEvent } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

// Types
export type { Order, OrderItem, Shipment, TrackingEvent };

interface OrderContextType {
  orders: Order[];
  loading: boolean;
  fetchOrders: () => Promise<void>;
  fetchOrderById: (orderId: string) => Promise<Order | null>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  createShipment: (orderId: string, shipmentData: Partial<Shipment>) => Promise<void>;
  updateShipment: (shipmentId: string, shipmentData: Partial<Shipment>) => Promise<void>;
  addTrackingEvent: (shipmentId: string, eventData: Partial<TrackingEvent>) => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
  const { user, isAdmin } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch orders based on user role
  const fetchOrders = useCallback(async () => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (*),
          shipment:shipments (
            *,
            tracking_events:shipment_tracking_events (*)
          )
        `)
        .order('created_at', { ascending: false });

      // If not admin, filter by user_id
      if (!isAdmin) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data to match our Order type
      const transformedOrders = (data || []).map((order: any) => ({
        ...order,
        shipment: Array.isArray(order.shipment) ? order.shipment[0] : order.shipment,
      }));

      setOrders(transformedOrders);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin]);

  // Fetch single order by ID
  const fetchOrderById = useCallback(async (orderId: string): Promise<Order | null> => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*),
          shipment:shipments (
            *,
            tracking_events:shipment_tracking_events (
              *
            )
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;

      return {
        ...data,
        shipment: Array.isArray(data.shipment) ? data.shipment[0] : data.shipment,
      };
    } catch (error: any) {
      console.error('Error fetching order:', error);
      toast.error('Failed to load order details');
      return null;
    }
  }, []);

  // Update order status (Admin only)
  const updateOrderStatus = useCallback(async (orderId: string, status: Order['status'], note?: string) => {
    try {
      const now = new Date().toISOString();
      const updates: any = {
        status,
        updated_at: now
      };

      // Set timestamps based on status
      if (status === 'confirmed') updates.confirmed_at = now;
      if (status === 'packed') updates.packed_at = now;
      if (status === 'shipped') updates.shipped_at = now;
      if (status === 'delivered') {
        updates.delivered_at = now;
        updates.payment_status = 'paid'; // Auto mark as paid on delivery (COD)
      }
      if (status === 'cancelled') updates.cancelled_at = now;

      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId);

      if (error) throw error;

      // Record in history
      await supabase.from('order_status_history').insert([{
        order_id: orderId,
        status,
        notes: note || `Order status updated to ${status}`,
        changed_by: user?.id
      }]);

      toast.success(`Order ${status} successfully`);
      await fetchOrders();
    } catch (error: any) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
      throw error;
    }
  }, [user, fetchOrders]);

  // Create shipment (Admin only)
  const createShipment = useCallback(async (orderId: string, shipmentData: Partial<Shipment>) => {
    try {
      const { error } = await supabase
        .from('shipments')
        .insert({
          order_id: orderId,
          ...shipmentData,
        });

      if (error) throw error;

      // Also update orders table for sync
      await supabase.from('orders').update({
        tracking_id: shipmentData.tracking_number,
        shipping_partner: shipmentData.carrier,
        status: 'shipped',
        shipped_at: new Date().toISOString()
      }).eq('id', orderId);

      toast.success('Shipment created successfully');
      await fetchOrders();
    } catch (error: any) {
      console.error('Error creating shipment:', error);
      toast.error('Failed to create shipment');
      throw error;
    }
  }, [fetchOrders]);

  // Update shipment (Admin only)
  const updateShipment = useCallback(async (orderId: string, shipmentData: Partial<Shipment>) => {
    try {
      // Find current shipment first to get ID if not provided
      const { data: currentShipment } = await supabase
        .from('shipments')
        .select('id')
        .eq('order_id', orderId)
        .maybeSingle();

      if (currentShipment) {
        const { error } = await supabase
          .from('shipments')
          .update(shipmentData)
          .eq('id', currentShipment.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('shipments')
          .insert({ order_id: orderId, ...shipmentData });
        if (error) throw error;
      }

      // Sync to orders table
      const orderUpdates: any = {
        tracking_id: shipmentData.tracking_number,
        shipping_partner: shipmentData.carrier,
        updated_at: new Date().toISOString()
      };

      if (shipmentData.status === 'delivered') {
        orderUpdates.status = 'delivered';
        orderUpdates.delivered_at = new Date().toISOString();
        orderUpdates.payment_status = 'paid';
      }

      await supabase.from('orders')
        .update(orderUpdates)
        .eq('id', orderId);

      toast.success('Shipment updated successfully');
      await fetchOrders();
    } catch (error: any) {
      console.error('Error updating shipment:', error);
      toast.error('Failed to update shipment');
      throw error;
    }
  }, [fetchOrders]);

  // Add tracking event (Admin only)
  const addTrackingEvent = useCallback(async (shipmentId: string, eventData: Partial<TrackingEvent>) => {
    try {
      const { error } = await supabase
        .from('shipment_tracking_events')
        .insert({
          shipment_id: shipmentId,
          ...eventData,
        });

      if (error) throw error;

      toast.success('Tracking event added');
      await fetchOrders();
    } catch (error: any) {
      console.error('Error adding tracking event:', error);
      toast.error('Failed to add tracking event');
      throw error;
    }
  }, [fetchOrders]);

  // Initial fetch
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Setup real-time subscriptions
  useEffect(() => {
    let mounted = true;
    if (!user) return;

    let ordersChannel: any;
    let shipmentsChannel: any;
    let trackingChannel: any;

    try {
      // Subscribe to orders changes
      ordersChannel = supabase
        .channel(`orders_changes_${user.id}_${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: isAdmin ? undefined : `user_id=eq.${user.id}`,
          },
          () => {
            if (mounted) fetchOrders();
          }
        )
        .subscribe((status, err) => {
          if (err) console.error("Realtime subscription error in order context:", err);
        });

      // Subscribe to shipments changes
      shipmentsChannel = supabase
        .channel(`shipments_changes_${user.id}_${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'shipments',
          },
          () => {
            if (mounted) fetchOrders();
          }
        )
        .subscribe((status, err) => {
          if (err) console.error("Realtime subscription error in shipments context:", err);
        });

      // Subscribe to tracking events changes
      trackingChannel = supabase
        .channel(`tracking_changes_${user.id}_${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'shipment_tracking_events',
          },
          () => {
            if (mounted) fetchOrders();
          }
        )
        .subscribe((status, err) => {
          if (err) console.error("Realtime subscription error in tracking context:", err);
        });
    } catch (e) {
      console.error("Failed to setup real-time subscriptions for OrderContext", e);
    }

    return () => {
      mounted = false;
      if (ordersChannel) supabase.removeChannel(ordersChannel);
      if (shipmentsChannel) supabase.removeChannel(shipmentsChannel);
      if (trackingChannel) supabase.removeChannel(trackingChannel);
    };
  }, [user, isAdmin, fetchOrders]);

  return (
    <OrderContext.Provider
      value={{
        orders,
        loading,
        fetchOrders,
        fetchOrderById,
        updateOrderStatus,
        createShipment,
        updateShipment,
        addTrackingEvent,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within OrderProvider');
  }
  return context;
}
