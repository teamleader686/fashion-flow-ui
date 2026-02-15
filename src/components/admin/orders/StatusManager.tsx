import { useState } from 'react';
import { Order } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

type StatusManagerProps = {
  order: Order;
  onUpdateStatus: (orderId: string, status: Order['status'], note?: string) => Promise<boolean>;
};

const StatusManager = ({ order, onUpdateStatus }: StatusManagerProps) => {
  const [selectedStatus, setSelectedStatus] = useState<Order['status']>(order.status);
  const [note, setNote] = useState('');
  const [updating, setUpdating] = useState(false);

  const statusOptions: { value: Order['status']; label: string; description: string }[] = [
    { value: 'pending', label: 'Order Placed', description: 'Order received, awaiting confirmation' },
    { value: 'confirmed', label: 'Confirmed', description: 'Order confirmed, ready for processing' },
    { value: 'processing', label: 'Processing', description: 'Order is being prepared' },
    { value: 'packed', label: 'Packed', description: 'Order packed, ready for shipment' },
    { value: 'shipped', label: 'Shipped', description: 'Order shipped to customer' },
    { value: 'out_for_delivery', label: 'Out for Delivery', description: 'Order is out for delivery' },
    { value: 'delivered', label: 'Delivered', description: 'Order delivered to customer' },
    { value: 'cancelled', label: 'Cancelled', description: 'Order cancelled' },
  ];

  const handleUpdateStatus = async () => {
    if (selectedStatus === order.status && !note) {
      toast.info('Status is already set to this value');
      return;
    }

    setUpdating(true);
    const success = await onUpdateStatus(order.id, selectedStatus, note);
    setUpdating(false);

    if (success) {
      toast.success(`Order status updated to ${selectedStatus}`);
      setNote('');
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
          <SelectTrigger className="mt-2 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div>
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-gray-500 font-normal">{option.description}</div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status-note">Status Note (Optional)</Label>
        <textarea
          id="status-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a remark about this status change..."
          className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <Button
        onClick={handleUpdateStatus}
        disabled={updating || (selectedStatus === order.status && !note)}
        className="w-full bg-primary hover:bg-primary/90"
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
