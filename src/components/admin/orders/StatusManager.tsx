import { useState } from 'react';
import { Order } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

type StatusManagerProps = {
  order: Order;
  onUpdateStatus: (orderId: string, status: Order['status']) => Promise<boolean>;
};

const StatusManager = ({ order, onUpdateStatus }: StatusManagerProps) => {
  const [selectedStatus, setSelectedStatus] = useState<Order['status']>(order.status);
  const [updating, setUpdating] = useState(false);

  const statusOptions: { value: Order['status']; label: string; description: string }[] = [
    { value: 'pending', label: 'Pending', description: 'Order received, awaiting confirmation' },
    { value: 'confirmed', label: 'Confirmed', description: 'Order confirmed, ready for processing' },
    { value: 'processing', label: 'Processing', description: 'Order is being prepared' },
    { value: 'packed', label: 'Packed', description: 'Order packed, ready for shipment' },
    { value: 'shipped', label: 'Shipped', description: 'Order shipped to customer' },
    { value: 'out_for_delivery', label: 'Out for Delivery', description: 'Order is out for delivery' },
    { value: 'delivered', label: 'Delivered', description: 'Order delivered to customer' },
    { value: 'cancelled', label: 'Cancelled', description: 'Order cancelled' },
  ];

  const handleUpdateStatus = async () => {
    if (selectedStatus === order.status) {
      toast.info('Status is already set to this value');
      return;
    }

    setUpdating(true);
    const success = await onUpdateStatus(order.id, selectedStatus);
    setUpdating(false);

    if (success) {
      toast.success(`Order status updated to ${selectedStatus}`);
    }
  };

  return (
    <div className="space-y-4 pt-4">
      <div>
        <Label>Current Status</Label>
        <div className="mt-2 p-3 bg-gray-50 rounded-lg">
          <div className="font-medium capitalize">{order.status.replace('_', ' ')}</div>
        </div>
      </div>

      <div>
        <Label>Update Status</Label>
        <Select value={selectedStatus} onValueChange={(value: Order['status']) => setSelectedStatus(value)}>
          <SelectTrigger className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div>
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-gray-500">{option.description}</div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        onClick={handleUpdateStatus}
        disabled={updating || selectedStatus === order.status}
        className="w-full"
      >
        {updating ? 'Updating...' : 'Update Status'}
      </Button>

      <div className="bg-blue-50 p-3 rounded-lg text-sm">
        <div className="font-medium text-blue-900 mb-1">Status Update Flow</div>
        <div className="text-blue-800 text-xs space-y-1">
          <div>• Pending → Confirmed → Processing</div>
          <div>• Processing → Packed → Shipped</div>
          <div>• Shipped → Out for Delivery → Delivered</div>
          <div>• Any status can be changed to Cancelled</div>
        </div>
      </div>
    </div>
  );
};

export default StatusManager;
