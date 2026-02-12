import { useState, useEffect } from 'react';
import { Order, Shipment } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Truck } from 'lucide-react';

type ShippingEditDrawerProps = {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateShipment: (orderId: string, data: any) => Promise<boolean>;
};

const carriers = [
  'Delhivery',
  'BlueDart',
  'DTDC',
  'Ecom Express',
  'Shadowfax',
  'Xpressbees',
  'India Post',
  'Professional Courier',
  'Other',
];

const ShippingEditDrawer = ({ order, open, onOpenChange, onUpdateShipment }: ShippingEditDrawerProps) => {
  const [formData, setFormData] = useState({
    carrier: order.shipment?.carrier || '',
    tracking_number: order.shipment?.tracking_number || '',
    tracking_url: order.shipment?.tracking_url || '',
    status: order.shipment?.status || 'pending',
    shipping_notes: order.shipment?.shipping_notes || '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFormData({
      carrier: order.shipment?.carrier || '',
      tracking_number: order.shipment?.tracking_number || '',
      tracking_url: order.shipment?.tracking_url || '',
      status: order.shipment?.status || 'pending',
      shipping_notes: order.shipment?.shipping_notes || '',
    });
  }, [order]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onUpdateShipment(order.id, formData);
    setSaving(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Manage Shipping - {order.order_number}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {/* Customer Info */}
          <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
            <p className="font-medium">{order.customer_name}</p>
            <p className="text-muted-foreground">{order.customer_phone}</p>
            <p className="text-muted-foreground">
              {order.shipping_address_line1}, {order.shipping_city}, {order.shipping_state} {order.shipping_zip}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Courier / Carrier</Label>
            <Select
              value={formData.carrier}
              onValueChange={(value) => setFormData({ ...formData, carrier: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select courier" />
              </SelectTrigger>
              <SelectContent>
                {carriers.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tracking Number</Label>
            <Input
              value={formData.tracking_number}
              onChange={(e) => setFormData({ ...formData, tracking_number: e.target.value })}
              placeholder="Enter tracking number"
            />
          </div>

          <div className="space-y-2">
            <Label>Tracking URL</Label>
            <Input
              value={formData.tracking_url}
              onChange={(e) => setFormData({ ...formData, tracking_url: e.target.value })}
              placeholder="https://track.example.com/..."
            />
          </div>

          <div className="space-y-2">
            <Label>Shipping Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value as Shipment['status'] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Not Assigned</SelectItem>
                <SelectItem value="picked_up">Picked Up</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="failed">Failed Delivery</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.shipping_notes}
              onChange={(e) => setFormData({ ...formData, shipping_notes: e.target.value })}
              placeholder="Add shipping notes..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? 'Saving...' : 'Update Shipping'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default ShippingEditDrawer;
