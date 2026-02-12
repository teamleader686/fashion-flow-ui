import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Order } from '@/lib/supabase';
import { ChevronDown, ChevronUp, Package } from 'lucide-react';
import OrderDetailDrawer from '@/components/admin/orders/OrderDetailDrawer';
import { format } from 'date-fns';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

type OrderTableTabletProps = {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
  onUpdateStatus: (orderId: string, status: Order['status']) => Promise<boolean>;
  onUpdateShipment: (orderId: string, data: any) => Promise<boolean>;
  onUpdateReturn: (returnId: string, status: any, notes?: string) => Promise<boolean>;
};

const OrderTableTablet = ({
  orders,
  onSelectOrder,
  onUpdateStatus,
  onUpdateShipment,
  onUpdateReturn
}: OrderTableTabletProps) => {
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleExpand = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const getStatusColor = (status: Order['status']) => {
    const colors = {
      pending: 'bg-orange-100 text-orange-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      packed: 'bg-indigo-100 text-indigo-800',
      shipped: 'bg-cyan-100 text-cyan-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleManageOrder = (order: Order) => {
    setSelectedOrder(order);
    setDrawerOpen(true);
    onSelectOrder(order);
  };

  return (
    <>
      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id}>
            <Collapsible
              open={expandedOrders.has(order.id)}
              onOpenChange={() => toggleExpand(order.id)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold">{order.order_number}</span>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>{order.customer_name}</div>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        {order.order_items?.length || 0} items
                        <span className="mx-2">•</span>
                        <span className="font-medium">₹{order.total_amount.toLocaleString()}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(order.created_at), 'MMM dd, yyyy hh:mm a')}
                      </div>
                    </div>
                  </div>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm">
                      {expandedOrders.has(order.id) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </div>

                <CollapsibleContent>
                  <div className="mt-4 pt-4 border-t space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Phone:</span>
                        <div className="font-medium">{order.customer_phone}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Payment:</span>
                        <div className="font-medium">{order.payment_method.toUpperCase()}</div>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 text-sm">Shipping:</span>
                      <div className="text-sm">
                        {order.shipping_address_line1}, {order.shipping_city}, {order.shipping_state}
                      </div>
                    </div>
                    <Button
                      onClick={() => handleManageOrder(order)}
                      className="w-full"
                      size="sm"
                    >
                      Manage Order
                    </Button>
                  </div>
                </CollapsibleContent>
              </CardContent>
            </Collapsible>
          </Card>
        ))}
      </div>

      {selectedOrder && (
        <OrderDetailDrawer
          order={selectedOrder}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onUpdateStatus={onUpdateStatus}
          onUpdateShipment={onUpdateShipment}
          onUpdateReturn={onUpdateReturn}
        />
      )}
    </>
  );
};

export default OrderTableTablet;
