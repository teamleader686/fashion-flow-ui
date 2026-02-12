import { useState } from 'react';
import { Order } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, MapPin, Phone, Truck, Edit } from 'lucide-react';
import ShippingEditDrawer from './ShippingEditDrawer';
import ShippingStatusBadge from './ShippingStatusBadge';
import { format } from 'date-fns';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

type ShippingCardMobileProps = {
  orders: Order[];
  onUpdateShipment: (orderId: string, data: any) => Promise<boolean>;
};

const ShippingCardMobile = ({ orders, onUpdateShipment }: ShippingCardMobileProps) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const handleEdit = (order: Order) => {
    setSelectedOrder(order);
    setDrawerOpen(true);
  };

  const toggleCard = (orderId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedCards(newExpanded);
  };

  const handleUpdateShipment = async (orderId: string, data: any) => {
    const success = await onUpdateShipment(orderId, data);
    if (success) {
      setDrawerOpen(false);
    }
    return success;
  };

  return (
    <>
      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id} className="overflow-hidden">
            <CardContent className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="h-4 w-4 text-gray-500" />
                    <span className="font-semibold">{order.order_number}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {format(new Date(order.created_at), 'MMM dd, yyyy')}
                  </div>
                </div>
                <ShippingStatusBadge status={order.shipment?.status || 'pending'} />
              </div>

              {/* Customer Info */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{order.customer_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="h-3 w-3" />
                  <span>{order.customer_phone}</span>
                </div>
              </div>

              {/* Shipping Info */}
              {order.shipment?.carrier && (
                <div className="bg-blue-50 p-3 rounded-lg mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-900 text-sm">
                      {order.shipment.carrier}
                    </span>
                  </div>
                  {order.shipment.tracking_number && (
                    <div className="text-xs text-blue-700 font-mono">
                      {order.shipment.tracking_number}
                    </div>
                  )}
                </div>
              )}

              {/* Expandable Section */}
              <Collapsible open={expandedCards.has(order.id)}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mb-2"
                    onClick={() => toggleCard(order.id)}
                  >
                    {expandedCards.has(order.id) ? 'Show Less' : 'Show More'}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-3 pt-2 border-t">
                    {/* Delivery Address */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="h-3 w-3 text-gray-500" />
                        <span className="text-xs font-medium text-gray-500">Delivery Address</span>
                      </div>
                      <div className="text-sm pl-5">
                        {order.shipping_address_line1}
                        <br />
                        {order.shipping_city}, {order.shipping_state} {order.shipping_zip}
                      </div>
                    </div>

                    {/* Order Status */}
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-1">Order Status</div>
                      <Badge variant="outline" className="text-xs">
                        {order.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>

                    {/* Order Amount */}
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-1">Order Amount</div>
                      <div className="text-sm font-semibold">₹{order.total_amount.toFixed(2)}</div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Action Button */}
              <Button
                onClick={() => handleEdit(order)}
                className="w-full mt-3"
                size="lg"
              >
                <Edit className="h-4 w-4 mr-2" />
                Manage Shipping
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedOrder && (
        <ShippingEditDrawer
          order={selectedOrder}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          onUpdateShipment={handleUpdateShipment}
        />
      )}
    </>
  );
};

export default ShippingCardMobile;
