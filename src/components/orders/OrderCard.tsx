import { Order } from '@/lib/supabase';
import CloudImage from '@/components/ui/CloudImage';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Package,
  Calendar,
  CreditCard,
  ChevronRight,
  Truck,
} from 'lucide-react';
import { format } from 'date-fns';

interface OrderCardProps {
  order: Order;
  onViewDetails: (order: Order) => void;
}

export default function OrderCard({ order, onViewDetails }: OrderCardProps) {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-800 border-gray-200', // placed
      confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
      processing: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      packed: 'bg-orange-100 text-orange-800 border-orange-200',
      shipped: 'bg-purple-100 text-purple-800 border-purple-200',
      out_for_delivery: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      delivered: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      returned: 'bg-slate-100 text-slate-800 border-slate-200',
      cancellation_requested: 'bg-amber-100 text-amber-800 border-amber-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pending',
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

  const itemCount = order.order_items?.length || 0;
  const firstItem = order.order_items?.[0];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold text-sm sm:text-base">
                Order #{order.order_number}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>
                {format(new Date(order.created_at), 'MMM dd, yyyy')}
              </span>
            </div>
          </div>
          <Badge className={getStatusColor(order.status)}>
            {getStatusLabel(order.status)}
          </Badge>
        </div>

        {/* Order Items Preview */}
        <div className="flex items-center gap-3 mb-4 pb-4 border-b">
          {firstItem?.product_image && (
            <CloudImage
              src={firstItem.product_image}
              alt={firstItem.product_name}
              className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0"
              imageClassName="object-cover rounded"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm sm:text-base truncate">
              {firstItem?.product_name || 'Product'}
            </p>
            {itemCount > 1 && (
              <p className="text-xs sm:text-sm text-muted-foreground">
                +{itemCount - 1} more item{itemCount > 2 ? 's' : ''}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Qty: {firstItem?.quantity || 0}
            </p>
          </div>
        </div>

        {/* Order Info */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Total Amount</p>
            <p className="font-semibold text-sm sm:text-base">
              ₹{order.total_amount?.toLocaleString('en-IN')}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Payment</p>
            <div className="flex items-center gap-1">
              <CreditCard className="h-3 w-3" />
              <p className="font-medium text-xs sm:text-sm uppercase">
                {order.payment_method}
              </p>
            </div>
          </div>
        </div>

        {/* Shipping Info */}
        {(order.shipment || order.tracking_id) && (
          <div className="bg-muted/50 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <Truck className="h-4 w-4 text-primary" />
              <p className="text-xs font-medium">Shipping Status</p>
            </div>
            <p className="text-sm">
              {(order.shipping_partner || order.shipment?.carrier) && (
                <span className="font-medium">{order.shipping_partner || order.shipment?.carrier}</span>
              )}
              {(order.tracking_id || order.shipment?.tracking_number) && (
                <span className="text-muted-foreground ml-2">
                  #{order.tracking_id || order.shipment?.tracking_number}
                </span>
              )}
            </p>
          </div>
        )}

        {/* Action Button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => onViewDetails(order)}
        >
          View Details
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}
