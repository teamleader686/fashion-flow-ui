import { useState } from 'react';
import { Order, Return } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { RotateCcw, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type ReturnManagerProps = {
  order: Order;
  onUpdateReturn: (returnId: string, status: Return['status'], notes?: string) => Promise<boolean>;
};

const ReturnManager = ({ order, onUpdateReturn }: ReturnManagerProps) => {
  const returnData = order.return;
  const [status, setStatus] = useState<Return['status']>(returnData?.status || 'pending');
  const [adminNotes, setAdminNotes] = useState(returnData?.admin_notes || '');
  const [updating, setUpdating] = useState(false);

  if (!returnData) {
    return (
      <div className="pt-4 text-center text-gray-500">
        No return request for this order
      </div>
    );
  }

  const returnStatuses: { value: Return['status']; label: string; description: string }[] = [
    { value: 'pending', label: 'Pending', description: 'Return request received' },
    { value: 'approved', label: 'Approved', description: 'Return approved by admin' },
    { value: 'rejected', label: 'Rejected', description: 'Return request rejected' },
    { value: 'pickup_scheduled', label: 'Pickup Scheduled', description: 'Pickup arranged' },
    { value: 'picked_up', label: 'Picked Up', description: 'Product picked up' },
    { value: 'refund_completed', label: 'Refund Completed', description: 'Refund processed' },
  ];

  const getStatusColor = (status: Return['status']) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      pickup_scheduled: 'bg-blue-100 text-blue-800',
      picked_up: 'bg-purple-100 text-purple-800',
      refund_completed: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleUpdateReturn = async () => {
    if (!returnData.id) return;

    setUpdating(true);
    const success = await onUpdateReturn(returnData.id, status, adminNotes);
    setUpdating(false);

    if (success) {
      toast.success('Return status updated');
    }
  };

  return (
    <div className="space-y-4 pt-4">
      {/* Return Info */}
      <div className="bg-orange-50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <RotateCcw className="h-5 w-5 text-orange-600" />
          <span className="font-medium text-orange-900">Return Request</span>
        </div>
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-orange-700">Current Status:</span>
            <Badge className={`ml-2 ${getStatusColor(returnData.status)}`}>
              {returnData.status.replace('_', ' ')}
            </Badge>
          </div>
          <div>
            <span className="text-orange-700">Reason:</span>
            <div className="mt-1 font-medium">{returnData.reason}</div>
          </div>
          {returnData.refund_amount && (
            <div>
              <span className="text-orange-700">Refund Amount:</span>
              <div className="mt-1 font-medium">₹{returnData.refund_amount.toLocaleString()}</div>
            </div>
          )}
        </div>
      </div>

      {/* Update Status */}
      <div>
        <Label>Update Return Status</Label>
        <Select value={status} onValueChange={(value: Return['status']) => setStatus(value)}>
          <SelectTrigger className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {returnStatuses.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                <div>
                  <div className="font-medium">{s.label}</div>
                  <div className="text-xs text-gray-500">{s.description}</div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Admin Notes */}
      <div>
        <Label>Admin Notes</Label>
        <Textarea
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          placeholder="Add notes about this return..."
          className="mt-2"
          rows={4}
        />
      </div>

      <Button
        onClick={handleUpdateReturn}
        disabled={updating}
        className="w-full"
      >
        {updating ? 'Updating...' : 'Update Return Status'}
      </Button>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          onClick={() => {
            setStatus('approved');
            handleUpdateReturn();
          }}
          disabled={updating || returnData.status === 'approved'}
          className="text-green-600"
        >
          Approve
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setStatus('rejected');
            handleUpdateReturn();
          }}
          disabled={updating || returnData.status === 'rejected'}
          className="text-red-600"
        >
          Reject
        </Button>
      </div>

      <div className="bg-blue-50 p-3 rounded-lg text-sm">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <span className="font-medium text-blue-900">Return Process</span>
        </div>
        <div className="text-blue-800 text-xs space-y-1">
          <div>1. Pending → Review return request</div>
          <div>2. Approved → Schedule pickup</div>
          <div>3. Pickup Scheduled → Arrange courier</div>
          <div>4. Picked Up → Product received</div>
          <div>5. Refund Completed → Process refund</div>
        </div>
      </div>
    </div>
  );
};

export default ReturnManager;
