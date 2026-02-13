import { useState } from 'react';
import { Order, useOrders } from '@/contexts/OrderContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface OrderStatusManagerProps {
  order: Order;
}

const statusOptions = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
  { value: 'processing', label: 'Processing', color: 'bg-purple-100 text-purple-800' },
  { value: 'packed', label: 'Packed', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'shipped', label: 'Shipped', color: 'bg-cyan-100 text-cyan-800' },
  { value: 'out_for_delivery', label: 'Out for Delivery', color: 'bg-orange-100 text-orange-800' },
  { value: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
  { value: 'returned', label: 'Returned', color: 'bg-gray-100 text-gray-800' },
];

export default function OrderStatusManager({ order }: OrderStatusManagerProps) {
  const { updateOrderStatus } = useOrders();
  const [selectedStatus, setSelectedStatus] = useState(order.status);
  const [updating, setUpdating] = useState(false);

  const handleUpdateStatus = async () => {
    if (selectedStatus === order.status) return;

    try {
      setUpdating(true);
      await updateOrderStatus(order.id, selectedStatus as Order['status']);
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setUpdating(false);
    }
  };

  const currentStatusOption = statusOptions.find(opt => opt.value === order.status);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Status Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div>
          <p className="text-sm text-muted-foreground mb-2">Current Status</p>
          <Badge className={currentStatusOption?.color}>
            {currentStatusOption?.label}
          </Badge>
        </div>

        {/* Update Status */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Update Status</p>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Update Button */}
        <Button
          onClick={handleUpdateStatus}
          disabled={selectedStatus === order.status || updating}
          className="w-full"
        >
          {updating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Update Status
        </Button>

        {/* Status Timeline Info */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm space-y-1">
          <p className="font-medium">Status Timeline:</p>
          {order.created_at && (
            <p className="text-muted-foreground">
              Created: {new Date(order.created_at).toLocaleString()}
            </p>
          )}
          {order.confirmed_at && (
            <p className="text-muted-foreground">
              Confirmed: {new Date(order.confirmed_at).toLocaleString()}
            </p>
          )}
          {order.packed_at && (
            <p className="text-muted-foreground">
              Packed: {new Date(order.packed_at).toLocaleString()}
            </p>
          )}
          {order.shipped_at && (
            <p className="text-muted-foreground">
              Shipped: {new Date(order.shipped_at).toLocaleString()}
            </p>
          )}
          {order.delivered_at && (
            <p className="text-muted-foreground">
              Delivered: {new Date(order.delivered_at).toLocaleString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
