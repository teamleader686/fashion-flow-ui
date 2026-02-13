import { Order } from '@/lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Package,
  MapPin,
  CreditCard,
  Truck,
  Calendar,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  RotateCcw,
} from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import CancelOrderDialog from './CancelOrderDialog';
import ReturnRequestDialog from './ReturnRequestDialog';
import OrderTimeline from './OrderTimeline';

interface OrderDetailModalProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  onCancelOrder: (orderId: string, reason: string, comment: string) => Promise<boolean>;
  onRequestReturn: (orderId: string, reason: string) => Promise<boolean>;
}

export default function OrderDetailModal({
  order,
  open,
  onClose,
  onCancelOrder,
  onRequestReturn,
}: OrderDetailModalProps) {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!order) return null;

  const canCancel = ['pending', 'confirmed', 'processing'].includes(
    order.status
  );
  const canReturn = order.status === 'delivered';
  const isCancellationRequested = order.status === 'cancellation_requested';

  const handleCancelOrder = async (reason: string, comment: string) => {
    setLoading(true);
    const success = await onCancelOrder(order.id, reason, comment);
    setLoading(false);
    if (success) {
      setCancelDialogOpen(false);
      onClose();
    }
  };

  const handleRequestReturn = async (reason: string) => {
    const success = await onRequestReturn(order.id, reason);
    if (success) {
      setReturnDialogOpen(false);
      onClose();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0">
          <DialogHeader className="p-4 sm:p-6 pb-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg sm:text-xl">
                Order Details
              </DialogTitle>
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
            <p className="text-sm text-muted-foreground">
              Order #{order.order_number} • Placed on{' '}
              {format(new Date(order.created_at), 'MMM dd, yyyy')}
            </p>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-120px)]">
            <div className="p-4 sm:p-6 space-y-6">
              {/* Order Timeline */}
              <OrderTimeline order={order} />

              <Separator />

              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Order Items
                </h3>
                <div className="space-y-3">
                  {order.order_items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-3 p-3 bg-muted/50 rounded-lg"
                    >
                      {item.product_image && (
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm sm:text-base">
                          {item.product_name}
                        </p>
                        {(item.size || item.color) && (
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {item.size && `Size: ${item.size}`}
                            {item.size && item.color && ' • '}
                            {item.color && `Color: ${item.color}`}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Qty: {item.quantity}
                          </p>
                          <p className="font-semibold text-sm sm:text-base">
                            ₹{item.total_price?.toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Delivery Address */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Delivery Address
                </h3>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <p className="font-medium">{order.customer_name}</p>
                  {order.customer_phone && (
                    <p className="text-sm flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      {order.customer_phone}
                    </p>
                  )}
                  {order.customer_email && (
                    <p className="text-sm flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      {order.customer_email}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mt-2">
                    {order.shipping_address_line1}
                    {order.shipping_address_line2 &&
                      `, ${order.shipping_address_line2}`}
                    <br />
                    {order.shipping_city}, {order.shipping_state}{' '}
                    {order.shipping_zip}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Shipping Info */}
              {order.shipment && (
                <>
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      Shipping Information
                    </h3>
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                      {order.shipment.carrier && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            Courier
                          </span>
                          <span className="text-sm font-medium">
                            {order.shipment.carrier}
                          </span>
                        </div>
                      )}
                      {order.shipment.tracking_number && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            Tracking ID
                          </span>
                          <span className="text-sm font-mono">
                            {order.shipment.tracking_number}
                          </span>
                        </div>
                      )}
                      {order.shipment.shipped_at && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            Shipped On
                          </span>
                          <span className="text-sm">
                            {format(
                              new Date(order.shipment.shipped_at),
                              'MMM dd, yyyy'
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Payment Summary */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Payment Summary
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{order.subtotal?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>
                      ₹{order.shipping_cost?.toLocaleString('en-IN')}
                    </span>
                  </div>
                  {order.discount_amount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>
                        -₹{order.discount_amount?.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold text-base">
                    <span>Total</span>
                    <span>₹{order.total_amount?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Payment Method
                    </span>
                    <span className="uppercase font-medium">
                      {order.payment_method}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {(canCancel || canReturn || isCancellationRequested) && (
                <>
                  <Separator />
                  {isCancellationRequested && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-amber-800 mb-1">
                        Cancellation Requested
                      </p>
                      <p className="text-xs text-amber-600">
                        Your cancellation request is pending admin approval.
                        You'll be notified once it's reviewed.
                      </p>
                    </div>
                  )}
                  {!isCancellationRequested && (
                    <div className="flex flex-col sm:flex-row gap-3">
                      {canCancel && (
                        <Button
                          variant="destructive"
                          className="flex-1"
                          onClick={() => setCancelDialogOpen(true)}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Request Cancellation
                        </Button>
                      )}
                      {canReturn && (
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => setReturnDialogOpen(true)}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Request Return
                        </Button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <CancelOrderDialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        onConfirm={handleCancelOrder}
        orderNumber={order.order_number}
        loading={loading}
      />

      <ReturnRequestDialog
        open={returnDialogOpen}
        onClose={() => setReturnDialogOpen(false)}
        onSubmit={handleRequestReturn}
        orderNumber={order.order_number}
      />
    </>
  );
}
