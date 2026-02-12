import { useState } from 'react';
import { Order } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Eye } from 'lucide-react';
import ShippingEditDrawer from './ShippingEditDrawer';
import ShippingStatusBadge from './ShippingStatusBadge';
import { format } from 'date-fns';

type ShippingTableDesktopProps = {
  orders: Order[];
  onUpdateShipment: (orderId: string, data: any) => Promise<boolean>;
};

const ShippingTableDesktop = ({ orders, onUpdateShipment }: ShippingTableDesktopProps) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleEdit = (order: Order) => {
    setSelectedOrder(order);
    setDrawerOpen(true);
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
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Delivery Address</TableHead>
                  <TableHead>Order Status</TableHead>
                  <TableHead>Shipping Status</TableHead>
                  <TableHead>Courier</TableHead>
                  <TableHead>Tracking ID</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.order_number}</TableCell>
                    <TableCell>{order.customer_name}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{order.customer_phone}</div>
                        {order.customer_email && (
                          <div className="text-gray-500 text-xs">{order.customer_email}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm max-w-xs">
                        <div>{order.shipping_address_line1}</div>
                        <div className="text-gray-500">
                          {order.shipping_city}, {order.shipping_state} {order.shipping_zip}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        order.status === 'delivered' ? 'default' :
                        order.status === 'shipped' ? 'secondary' :
                        'outline'
                      }>
                        {order.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <ShippingStatusBadge status={order.shipment?.status || 'pending'} />
                    </TableCell>
                    <TableCell>
                      {order.shipment?.carrier || (
                        <span className="text-gray-400 text-sm">Not assigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {order.shipment?.tracking_number || (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {format(new Date(order.updated_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(order)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
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

export default ShippingTableDesktop;
