import { useState, useEffect } from 'react';
import { supabase, Order } from '@/lib/supabase';
import { toast } from 'sonner';

export const useShippingRealtime = () => {
  const [shippingOrders, setShippingOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch shipping orders (orders that need shipping or are being shipped)
  const fetchShippingOrders = async () => {
    try {
      setLoading(true);
      
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .in('status', ['confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch related data separately to avoid join errors
      const ordersWithRelations = await Promise.all(
        (orders || []).map(async (order) => {
          // Fetch order items
          const { data: items } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id);

          // Fetch shipment
          const { data: shipments } = await supabase
            .from('shipments')
            .select('*')
            .eq('order_id', order.id)
            .limit(1);

          // Fetch user profile if user_id exists
          let userProfile = null;
          if (order.user_id) {
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('full_name, email, phone')
              .eq('user_id', order.user_id)
              .single();
            userProfile = profile;
          }

          return {
            ...order,
            order_items: items || [],
            shipment: shipments?.[0] || null,
            user_profile: userProfile
          };
        })
      );

      setShippingOrders(ordersWithRelations);
    } catch (error: any) {
      console.error('Error fetching shipping orders:', error);
      toast.error('Failed to load shipping orders');
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to realtime updates
  useEffect(() => {
    fetchShippingOrders();

    // Subscribe to orders table changes
    const ordersSubscription = supabase
      .channel('shipping_orders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('Order change detected:', payload);
          fetchShippingOrders();
        }
      )
      .subscribe();

    // Subscribe to shipments table changes
    const shipmentsSubscription = supabase
      .channel('shipments_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shipments'
        },
        (payload) => {
          console.log('Shipment change detected:', payload);
          fetchShippingOrders();
        }
      )
      .subscribe();

    return () => {
      ordersSubscription.unsubscribe();
      shipmentsSubscription.unsubscribe();
    };
  }, []);

  // Update shipment information
  const updateShipment = async (orderId: string, shipmentData: any): Promise<boolean> => {
    try {
      // Check if shipment exists
      const { data: existingShipment } = await supabase
        .from('shipments')
        .select('id')
        .eq('order_id', orderId)
        .single();

      if (existingShipment) {
        // Update existing shipment
        const { error } = await supabase
          .from('shipments')
          .update({
            carrier: shipmentData.carrier,
            tracking_number: shipmentData.tracking_number,
            tracking_url: shipmentData.tracking_url,
            status: shipmentData.status,
            shipped_at: shipmentData.status === 'picked_up' || shipmentData.status === 'in_transit' 
              ? new Date().toISOString() 
              : (existingShipment as any).shipped_at,
            delivered_at: shipmentData.status === 'delivered' 
              ? new Date().toISOString() 
              : null
          })
          .eq('id', existingShipment.id);

        if (error) throw error;
      } else {
        // Create new shipment
        const { error } = await supabase
          .from('shipments')
          .insert({
            order_id: orderId,
            carrier: shipmentData.carrier,
            tracking_number: shipmentData.tracking_number,
            tracking_url: shipmentData.tracking_url,
            status: shipmentData.status,
            shipped_at: shipmentData.status === 'picked_up' || shipmentData.status === 'in_transit'
              ? new Date().toISOString()
              : null
          });

        if (error) throw error;
      }

      // Update order status based on shipment status
      let orderStatus = 'processing';
      if (shipmentData.status === 'picked_up' || shipmentData.status === 'in_transit') {
        orderStatus = 'shipped';
      } else if (shipmentData.status === 'out_for_delivery') {
        orderStatus = 'out_for_delivery';
      } else if (shipmentData.status === 'delivered') {
        orderStatus = 'delivered';
      }

      const { error: orderError } = await supabase
        .from('orders')
        .update({
          status: orderStatus,
          shipped_at: shipmentData.status === 'picked_up' || shipmentData.status === 'in_transit'
            ? new Date().toISOString()
            : undefined,
          delivered_at: shipmentData.status === 'delivered'
            ? new Date().toISOString()
            : undefined
        })
        .eq('id', orderId);

      if (orderError) throw orderError;

      toast.success('Shipment updated successfully');
      return true;
    } catch (error: any) {
      console.error('Error updating shipment:', error);
      toast.error(error.message || 'Failed to update shipment');
      return false;
    }
  };

  return {
    shippingOrders,
    loading,
    refetch: fetchShippingOrders,
    updateShipment
  };
};
