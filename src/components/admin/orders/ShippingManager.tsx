import { useState } from 'react';
import { Order, Shipment } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Truck, Package } from 'lucide-react';

type ShippingManagerProps = {
  order: Order;
  onUpdateShipment: (orderId: string, data: any) => Promise<boolean>;
};

const ShippingManager = ({ order, onUpdateShipment }: ShippingManagerProps) => {
  const [carrier, setCarrier] = useState(order.shipment?.carrier || '');
  const [trackingNumber, setTrackingNumber] = useState(order.shipment?.tracking_number || '');
  const [trackingUrl, setTrackingUrl] = useState(order.shipment?.tracking_url || '');
  const [status, setStatus] = useState<Shipment['status']>(order.shipment?.status || 'pending');
  const [updating, setUpdating] = useState(false);

  const carriers = [
    'Delhivery',
    'Blue Dart',
    'DTDC',
    'India Post',
    'FedEx',
    'DHL',
    'Ecom Express',
    'Xpressbees',
    'Other'
  ];

  const shipmentStatuses: { value: Shipment['status']; label: string }[] = [
    { value: 'pending', label: 'Pending' },
    { value: 'picked_up', label: 'Picked Up' },
    { value: 'in_transit', label: 'In Transit' },
    { value: 'out_for_delivery', label: 'Out for Delivery' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'failed', label: 'Failed' },
    { value: 'returned', label: 'Returned' },
  ];

  const handleUpdateShipment = async () => {
    if (!carrier || !trackingNumber) {
      toast.error('Please enter carrier and tracking number');
      return;
    }

    setUpdating(true);
    const success = await onUpdateShipment(order.id, {
      carrier,
      tracking_number: trackingNumber,
      tracking_url: trackingUrl,
      status
    });
    setUpdating(false);

    if (success) {
      toast.success('Shipment information updated');
    }
  };

  return (
    <div className="space-y-4 pt-4">
      {/* Current Shipment Info */}
      {order.shipment && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Truck className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-900">Current Shipment</span>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-700">Carrier:</span>
              <span className="font-medium">{order.shipment.carrier}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Tracking:</span>
              <span className="font-medium">{order.shipment.tracking_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Status:</span>
              <span className="font-medium capitalize">{order.shipment.status.replace('_', ' ')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Carrier Selection */}
      <div>
        <Label>Courier/Carrier</Label>
        <Select value={carrier} onValueChange={setCarrier}>
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="Select carrier" />
          </SelectTrigger>
          <SelectContent>
            {carriers.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tracking Number */}
      <div>
        <Label>Tracking Number</Label>
        <Input
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value)}
          placeholder="Enter tracking number"
          className="mt-2"
        />
      </div>

      {/* Tracking URL */}
      <div>
        <Label>Tracking URL (Optional)</Label>
        <Input
          value={trackingUrl}
          onChange={(e) => setTrackingUrl(e.target.value)}
          placeholder="https://track.carrier.com/..."
          className="mt-2"
        />
      </div>

      {/* Shipment Status */}
      <div>
        <Label>Shipment Status</Label>
        <Select value={status} onValueChange={(value: Shipment['status']) => setStatus(value)}>
          <SelectTrigger className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {shipmentStatuses.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        onClick={handleUpdateShipment}
        disabled={updating}
        className="w-full"
      >
        {updating ? 'Updating...' : 'Update Shipment'}
      </Button>

      <div className="bg-gray-50 p-3 rounded-lg text-sm">
        <div className="flex items-center gap-2 mb-2">
          <Package className="h-4 w-4 text-gray-600" />
          <span className="font-medium">Shipment Flow</span>
        </div>
        <div className="text-gray-600 text-xs space-y-1">
          <div>1. Pending → Awaiting pickup</div>
          <div>2. Picked Up → Collected by courier</div>
          <div>3. In Transit → On the way</div>
          <div>4. Out for Delivery → Final delivery</div>
          <div>5. Delivered → Completed</div>
        </div>
      </div>
    </div>
  );
};

export default ShippingManager;
