import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Order } from '@/lib/supabase';
import { ChevronDown, ChevronUp, Package, Phone, MapPin, CreditCard } from 'lucide-react';
import OrderDetailDrawer from '@/components/admin/orders/OrderDetailDrawer';
import { format } from 'date-fns';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

type OrderCardMobileProps = {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
  onUpdateStatus: (orderId: string, status: Order['status']) => Promise<boolean>;
  onUpdateShipment: (orderId: string, data: any) => Promise<boolean>;
  onUpdateReturn: (returnId: string, status: any, notes?: string) => Promise<boolean>;
};

const OrderCardMobile = ({
  orders,
  onSelectOrder,
  onUpdateStatus,
  onUpdateShipment,
  onUpdateReturn
}: OrderCardMobileProps) => {
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
      <div className="space-y-3">
        {orders.map((order) => (
          <Card key={order.id} className="overflow-hidden">
            <Collapsible
              open={expandedOrders.has(order.id)}
              onOpenChange={() => toggleExpand(order.id)}
            >
              <CardContent className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="font-bold text-lg mb-1">{order.order_number}</div>
                    <div className="text-sm text-gray-600">{order.customer_name}</div>
                  </div>
                  <Badge className={getStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                </div>

                {/* Summary Info */}
                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Package className="h-4 w-4" />
                      <span>{order.order_items?.length || 0} items</span>
                    </div>
                    <div className="font-bold text-lg">
                      ₹{order.total_amount.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {format(new Date(order.created_at), 'MMM dd, yyyy • hh:mm a')}
                  </div>
                </div>

                {/* Expand/Collapse Button */}
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full">
                    {expandedOrders.has(order.id) ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-2" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-2" />
                        Show Details
                      </>
                    )}
                  </Button>
                </CollapsibleTrigger>

                {/* Expanded Content */}
                <CollapsibleContent>
                  <div className="mt-4 pt-4 border-t space-y-3">
                    {/* Contact Info */}
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 text-sm">
                        <Phone className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div>
                          <div className="text-gray-500 text-xs">Phone</div>
                          <div className="font-medium">{order.customer_phone}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div>
                          <div className="text-gray-500 text-xs">Shipping Address</div>
                          <div className="font-medium">
                            {order.shipping_address_line1}
                            <br />
                            {order.shipping_city}, {order.shipping_state} - {order.shipping_zip}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <CreditCard className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div>
                          <div className="text-gray-500 text-xs">Payment Method</div>
                          <div className="font-medium">{order.payment_method.toUpperCase()}</div>
                          <Badge variant="outline" className="mt-1">
                            {order.payment_status}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    {order.order_items && order.order_items.length > 0 && (
                      <div>
                        <div className="text-xs text-gray-500 mb-2">Order Items</div>
                        <div className="space-y-2">
                          {order.order_items.map((item) => (
                            <div key={item.id} className="flex items-center gap-2 text-sm">
                              {item.product_image && (
                                <img
                                  src={item.product_image}
                                  alt={item.product_name}
                                  className="w-10 h-10 object-cover rounded"
                                />
                              )}
                              <div className="flex-1">
                                <div className="font-medium">{item.product_name}</div>
                                <div className="text-xs text-gray-500">
                                  Qty: {item.quantity} × ₹{item.unit_price}
                                </div>
                              </div>
                              <div className="font-medium">
                                ₹{item.total_price.toLocaleString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Shipment Info */}
                    {order.shipment && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-xs text-gray-500 mb-1">Shipment Status</div>
                        <div className="font-medium">{order.shipment.status}</div>
                        {order.shipment.tracking_number && (
                          <div className="text-sm mt-1">
                            Tracking: {order.shipment.tracking_number}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Return Info */}
                    {order.return && (
                      <div className="bg-orange-50 p-3 rounded-lg">
                        <div className="text-xs text-gray-500 mb-1">Return Request</div>
                        <div className="font-medium">{order.return.status}</div>
                        <div className="text-sm mt-1">{order.return.reason}</div>
                      </div>
                    )}

                    {/* Manage Button */}
                    <Button
                      onClick={() => handleManageOrder(order)}
                      className="w-full"
                      size="lg"
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

export default OrderCardMobile;
