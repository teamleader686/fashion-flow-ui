import { useState } from 'react';
import { Order } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, ChevronDown, ChevronUp } from 'lucide-react';
import ShippingEditDrawer from './ShippingEditDrawer';
import ShippingStatusBadge from './ShippingStatusBadge';
import { format } from 'date-fns';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

type ShippingTableTabletProps = {
  orders: Order[];
  onUpdateShipment: (orderId: string, data: any) => Promise<boolean>;
};

const ShippingTableTablet = ({ orders, onUpdateShipment }: ShippingTableTabletProps) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const handleEdit = (order: Order) => {
    setSelectedOrder(order);
    setDrawerOpen(true);
  };

  const toggleRow = (orderId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedRows(newExpanded);
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
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Shipping Status</TableHead>
                  <TableHead>Courier</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <Collapsible key={order.id} asChild>
                    <>
                      <TableRow>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleRow(order.id)}
                              >
                                {expandedRows.has(order.id) ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </CollapsibleTrigger>
                            <div>
                              <div className="font-medium">{order.order_number}</div>
                              <div className="text-xs text-gray-500">
                                {format(new Date(order.created_at), 'MMM dd, yyyy')}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{order.customer_name}</div>
                            <div className="text-gray-500 text-xs">{order.customer_phone}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <ShippingStatusBadge status={order.shipment?.status || 'pending'} />
                        </TableCell>
                        <TableCell>
                          {order.shipment?.carrier || (
                            <span className="text-gray-400 text-sm">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(order)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={5} className="p-0">
                          <CollapsibleContent>
                            <div className="p-4 bg-gray-50 space-y-3">
                              <div>
                                <div className="text-xs font-medium text-gray-500 mb-1">Delivery Address</div>
                                <div className="text-sm">
                                  {order.shipping_address_line1}, {order.shipping_city}, {order.shipping_state} {order.shipping_zip}
                                </div>
                              </div>
                              {order.shipment?.tracking_number && (
                                <div>
                                  <div className="text-xs font-medium text-gray-500 mb-1">Tracking Number</div>
                                  <div className="text-sm font-mono">{order.shipment.tracking_number}</div>
                                </div>
                              )}
                              <div>
                                <div className="text-xs font-medium text-gray-500 mb-1">Order Status</div>
                                <Badge variant="outline">
                                  {order.status.replace('_', ' ').toUpperCase()}
                                </Badge>
                              </div>
                            </div>
                          </CollapsibleContent>
                        </TableCell>
                      </TableRow>
                    </>
                  </Collapsible>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

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

export default ShippingTableTablet;
