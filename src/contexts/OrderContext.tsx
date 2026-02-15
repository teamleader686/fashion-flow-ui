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
  const updateOrderStatus = useCallback(async (orderId: string, status: Order['status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;

      toast.success('Order status updated successfully');
      await fetchOrders();
    } catch (error: any) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
      throw error;
    }
  }, [fetchOrders]);

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

      toast.success('Shipment created successfully');
      await fetchOrders();
    } catch (error: any) {
      console.error('Error creating shipment:', error);
      toast.error('Failed to create shipment');
      throw error;
    }
  }, [fetchOrders]);

  // Update shipment (Admin only)
  const updateShipment = useCallback(async (shipmentId: string, shipmentData: Partial<Shipment>) => {
    try {
      const { error } = await supabase
        .from('shipments')
        .update(shipmentData)
        .eq('id', shipmentId);

      if (error) throw error;

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
    if (!user) return;

    // Subscribe to orders changes
    const ordersChannel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: isAdmin ? undefined : `user_id=eq.${user.id}`,
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    // Subscribe to shipments changes
    const shipmentsChannel = supabase
      .channel('shipments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shipments',
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    // Subscribe to tracking events changes
    const trackingChannel = supabase
      .channel('tracking-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shipment_tracking_events',
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      ordersChannel.unsubscribe();
      shipmentsChannel.unsubscribe();
      trackingChannel.unsubscribe();
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
