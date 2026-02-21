import { Order, OrderStatusHistory } from '@/lib/supabase';
import CloudImage from '@/components/ui/CloudImage';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  Info,
} from 'lucide-react';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import CancelOrderDialog from './CancelOrderDialog';
import ReturnRequestDialog from './ReturnRequestDialog';
import OrderTimeline from './OrderTimeline';
import EditOrderModal from './EditOrderModal';

interface OrderDetailModalProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  onCancelOrder: (orderId: string, reason: string, comment: string) => Promise<boolean>;
  onRequestReturn: (orderId: string, reason: string) => Promise<boolean>;
  onConfirmDelivery: (orderId: string) => Promise<boolean>;
}

export default function OrderDetailModal({
  order,
  open,
  onClose,
  onCancelOrder,
  onRequestReturn,
  onConfirmDelivery,
}: OrderDetailModalProps) {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [history, setHistory] = useState<OrderStatusHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      if (order && open) {
        setLoadingHistory(true);
        const { data, error } = await supabase
          .from('order_status_history')
          .select('*')
          .eq('order_id', order.id)
          .order('created_at', { ascending: true });

        if (!error && data) {
          setHistory(data);
        }
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, [order?.id, open]);

  const handleConfirmDelivery = async () => {
    if (!order) return;
    setLoading(true);
    const success = await onConfirmDelivery(order.id);
    setLoading(false);
    if (success) {
      onClose();
    }
  };

  if (!order) return null;

  const canConfirm = ['shipped', 'out_for_delivery'].includes(order.status);
  const canCancel = ['placed', 'confirmed', 'processing', 'pending'].includes(order.status) &&
    (!order.cancellation_status || order.cancellation_status === 'none');
  const canReturn = order.status === 'delivered';
  const canEdit = ['placed', 'confirmed', 'processing', 'packed', 'pending'].includes(order.status) &&
    (!order.cancellation_status || order.cancellation_status === 'none');
  const isCancellationRequested = order.cancellation_status === 'requested' || order.status === 'cancellation_requested';

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'processing': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'packed': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'shipped': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'out_for_delivery': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'returned': return 'bg-slate-100 text-slate-800 border-slate-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Order Placed',
      confirmed: 'Confirmed',
      processing: 'Processing',
      packed: 'Packed',
      shipped: 'Shipped',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
      returned: 'Returned',
      cancellation_requested: 'Cancellation Requested',
    };
    return labels[status] || status;
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
              <Badge className={getStatusColor(order.status)}>
                {getStatusLabel(order.status).toUpperCase()}
              </Badge>
            </div>
            <DialogDescription className="text-sm text-muted-foreground">
              Order #{order.order_number} • Placed on{' '}
              {format(new Date(order.created_at), 'MMM dd, yyyy')}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-120px)]">
            <div className="p-4 sm:p-6 space-y-6">
              {/* Order Timeline */}
              <OrderTimeline order={order as any} history={history} />

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
                        <CloudImage
                          src={item.product_image}
                          alt={item.product_name}
                          className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0"
                          imageClassName="object-cover rounded"
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
                    {(order as any).shipping_address_line2 &&
                      `, ${(order as any).shipping_address_line2}`}
                    <br />
                    {order.shipping_city}, {order.shipping_state}{' '}
                    {order.shipping_zip}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Shipping Info */}
              {(order.shipment || order.tracking_id) && (
                <>
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      Shipping Information
                    </h3>
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                      {(order.shipping_partner || order.shipment?.carrier) && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            Courier
                          </span>
                          <span className="text-sm font-medium">
                            {order.shipping_partner || order.shipment?.carrier}
                          </span>
                        </div>
                      )}
                      {(order.tracking_id || order.shipment?.tracking_number) && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            Tracking ID
                          </span>
                          <span className="text-sm font-mono font-bold text-primary">
                            {order.tracking_id || order.shipment?.tracking_number}
                          </span>
                        </div>
                      )}
                      {(order.shipped_at || order.shipment?.shipped_at) && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            Shipped On
                          </span>
                          <span className="text-sm">
                            {format(
                              new Date(order.shipped_at || order.shipment!.shipped_at!),
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
                    <span>₹{(order.subtotal || (order.total_amount - (order.shipping_cost || order.shipping_charge || 0) + (order.discount_amount || 0))).toLocaleString('en-IN')}</span>
                  </div>
                  {(order.shipping_cost !== undefined || order.shipping_charge !== undefined) && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>
                        {(order.shipping_cost || order.shipping_charge) === 0
                          ? 'FREE'
                          : `₹${(order.shipping_cost || order.shipping_charge)?.toLocaleString('en-IN')}`}
                      </span>
                    </div>
                  )}
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
              {(canCancel || canReturn || isCancellationRequested || canConfirm || canEdit) && (
                <>
                  <Separator />
                  {order.cancellation_status === 'requested' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                      <p className="text-sm font-medium text-amber-800">
                        Cancellation Requested
                      </p>
                      <p className="text-xs text-amber-600 mt-1">
                        Your cancellation request is pending admin approval.
                      </p>
                    </div>
                  )}
                  {order.cancellation_status === 'approved' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <p className="text-sm font-medium text-green-800">
                        Cancellation Approved
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        Your cancellation request has been approved. Refund processed.
                      </p>
                    </div>
                  )}
                  {order.cancellation_status === 'rejected' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                      <p className="text-sm font-medium text-red-800">
                        Cancellation Rejected
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        Your cancellation request was rejected by admin.
                      </p>
                    </div>
                  )}
                  <div className="flex flex-col gap-3">
                    {canConfirm && (
                      <Button
                        variant="default"
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-6 rounded-xl shadow-lg hover:shadow-green-100 transition-all flex items-center justify-center gap-2"
                        onClick={handleConfirmDelivery}
                        disabled={loading}
                      >
                        <CheckCircle className="h-5 w-5" />
                        {loading ? 'Confirming...' : 'I have received my order'}
                      </Button>
                    )}

                    {!isCancellationRequested && (
                      <div className="flex flex-col sm:flex-row gap-3">
                        {canEdit && (
                          <Button
                            variant="outline"
                            className="flex-1 rounded-xl h-12"
                            onClick={() => setEditDialogOpen(true)}
                            disabled={loading}
                          >
                            Edit Order
                          </Button>
                        )}
                        {canCancel && (
                          <Button
                            variant="destructive"
                            className="flex-1 rounded-xl h-12"
                            onClick={() => setCancelDialogOpen(true)}
                            disabled={loading}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Request Cancellation
                          </Button>
                        )}
                        {canReturn && (
                          <Button
                            variant="outline"
                            className="flex-1 rounded-xl h-12"
                            onClick={() => setReturnDialogOpen(true)}
                            disabled={loading}
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Request Return
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
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

      <EditOrderModal
        order={order}
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onUpdate={() => {
          setEditDialogOpen(false);
          onClose(); // Close the detail modal or we can just let realtime handle it
        }}
      />
    </>
  );
}
