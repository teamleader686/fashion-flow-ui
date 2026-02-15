import { useState } from 'react';
import { Order } from '@/lib/supabase';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { Package, Truck, RotateCcw, User, MapPin, CreditCard } from 'lucide-react';
import StatusManager from '@/components/admin/orders/StatusManager';
import ShippingManager from '@/components/admin/orders/ShippingManager';
import ReturnManager from '@/components/admin/orders/ReturnManager';
import CloudImage from '@/components/ui/CloudImage';

type OrderDetailDrawerProps = {
  order: Order;
  open: boolean;
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: Order['status'], note?: string) => Promise<boolean>;
  onUpdateShipment: (orderId: string, data: any) => Promise<boolean>;
  onUpdateReturn: (returnId: string, status: any, notes?: string) => Promise<boolean>;
};

const OrderDetailDrawer = ({
  order,
  open,
  onClose,
  onUpdateStatus,
  onUpdateShipment,
  onUpdateReturn
}: OrderDetailDrawerProps) => {
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

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Order {order.order_number}</span>
            <Badge className={getStatusColor(order.status)}>
              {order.status}
            </Badge>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Customer Info */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <User className="h-5 w-5 text-gray-400" />
              <h3 className="font-semibold">Customer Information</h3>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div>
                <div className="text-sm text-gray-500">Name</div>
                <div className="font-medium">{order.customer_name}</div>
              </div>
              {order.customer_email && (
                <div>
                  <div className="text-sm text-gray-500">Email</div>
                  <div className="font-medium">{order.customer_email}</div>
                </div>
              )}
              <div>
                <div className="text-sm text-gray-500">Phone</div>
                <div className="font-medium">{order.customer_phone}</div>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-5 w-5 text-gray-400" />
              <h3 className="font-semibold">Shipping Address</h3>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="font-medium">
                {order.shipping_address_line1}
              </div>
              <div>
                {order.shipping_city}, {order.shipping_state} - {order.shipping_zip}
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-5 w-5 text-gray-400" />
              <h3 className="font-semibold">Order Items</h3>
            </div>
            <div className="space-y-3">
              {order.order_items?.map((item) => (
                <div key={item.id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                  {item.product_image && (
                    <CloudImage
                      src={item.product_image}
                      alt={item.product_name}
                      className="w-16 h-16 rounded shrink-0"
                      imageClassName="w-full h-full object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{item.product_name}</div>
                    {(item.size || item.color) && (
                      <div className="text-sm text-gray-500">
                        {item.size && `Size: ${item.size}`}
                        {item.size && item.color && ' • '}
                        {item.color && `Color: ${item.color}`}
                      </div>
                    )}
                    <div className="text-sm text-gray-500">
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

          {/* Order Summary */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="h-5 w-5 text-gray-400" />
              <h3 className="font-semibold">Order Summary</h3>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span>₹{order.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span>₹{order.shipping_cost.toLocaleString()}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-₹{order.discount_amount.toLocaleString()}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>₹{order.total_amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Payment Method</span>
                <Badge variant="outline">{order.payment_method.toUpperCase()}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Payment Status</span>
                <Badge variant="outline">{order.payment_status}</Badge>
              </div>
            </div>
          </div>

          {/* Management Tabs */}
          <Tabs defaultValue="status" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="status">Status</TabsTrigger>
              <TabsTrigger value="shipping">
                <Truck className="h-4 w-4 mr-1" />
                Shipping
              </TabsTrigger>
              {order.return && (
                <TabsTrigger value="return">
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Return
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="status">
              <StatusManager
                order={order}
                onUpdateStatus={onUpdateStatus}
              />
            </TabsContent>

            <TabsContent value="shipping">
              <ShippingManager
                order={order}
                onUpdateShipment={onUpdateShipment}
              />
            </TabsContent>

            {order.return && (
              <TabsContent value="return">
                <ReturnManager
                  order={order}
                  onUpdateReturn={onUpdateReturn}
                />
              </TabsContent>
            )}
          </Tabs>

          {/* Order Timeline */}
          <div>
            <h3 className="font-semibold mb-3">Order Timeline</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Order Placed</span>
                <span>{format(new Date(order.created_at), 'MMM dd, yyyy hh:mm a')}</span>
              </div>
              {order.delivered_at && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivered</span>
                  <span>{format(new Date(order.delivered_at), 'MMM dd, yyyy hh:mm a')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default OrderDetailDrawer;
