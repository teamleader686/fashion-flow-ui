import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Order, useOrders } from '@/contexts/OrderContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import OrderTimeline from '@/components/orders/OrderTimeline';
import ShippingTracker from '@/components/orders/ShippingTracker';
import { ArrowLeft, Package, MapPin, CreditCard, Phone, Mail } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function OrderDetailsPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { fetchOrderById } = useOrders();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  const loadOrder = async () => {
    if (!orderId) return;

    setLoading(true);
    const data = await fetchOrderById(orderId);
    setOrder(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="container max-w-6xl mx-auto p-4 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-64" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container max-w-6xl mx-auto p-4">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Order not found</p>
            <Button onClick={() => navigate('/my-orders')} className="mt-4">
              Back to Orders
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/my-orders')}
            className="mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>
          <h1 className="text-2xl font-bold">Order #{order.order_number}</h1>
          <p className="text-sm text-muted-foreground">
            Placed on {new Date(order.created_at).toLocaleDateString()}
          </p>
        </div>
        <Badge
          className={
            order.status === 'delivered'
              ? 'bg-green-100 text-green-800'
              : order.status === 'cancelled'
                ? 'bg-red-100 text-red-800'
                : 'bg-blue-100 text-blue-800'
          }
        >
          {order.status.replace('_', ' ').toUpperCase()}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderTimeline order={order} />
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.order_items?.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    {item.product_image && (
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="w-20 h-20 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Quantity: {item.quantity}
                      </p>
                      <p className="text-sm font-medium mt-1">
                        ₹{item.price.toLocaleString('en-IN')} × {item.quantity} = ₹
                        {item.total.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{(order.subtotal || (order.total_amount - (order.shipping_cost || 0))).toLocaleString('en-IN')}</span>
                </div>
                {(order.shipping_cost || order.shipping_charge) !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>
                      {(order.shipping_cost || order.shipping_charge) === 0
                        ? 'FREE'
                        : `₹${(order.shipping_cost || order.shipping_charge)?.toLocaleString('en-IN')}`}
                    </span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Paid</span>
                  <span>₹{order.total_amount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Tracker */}
          {order.shipment && <ShippingTracker shipment={order.shipment} />}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{order.customer_name}</p>
              </div>
              {order.customer_email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm">{order.customer_email}</p>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm">{order.customer_phone}</p>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                {order.shipping_address_line1}
                {order.shipping_address_line2 && `, ${order.shipping_address_line2}`}
                <br />
                {order.shipping_city}, {order.shipping_state} - {order.shipping_zip}
              </p>
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Payment Method</p>
                <p className="font-medium uppercase">{order.payment_method}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payment Status</p>
                <Badge
                  className={
                    order.payment_status === 'paid'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }
                >
                  {order.payment_status.toUpperCase()}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
