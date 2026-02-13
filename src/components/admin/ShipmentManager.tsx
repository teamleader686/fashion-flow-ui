import { useState } from 'react';
import { Order, Shipment, useOrders } from '@/contexts/OrderContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Truck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ShipmentManagerProps {
  order: Order;
}

const courierOptions = [
  'Delhivery',
  'BlueDart',
  'DTDC',
  'India Post',
  'FedEx',
  'DHL',
  'Ecom Express',
  'Xpressbees',
  'Shadowfax',
  'Other',
];

const shipmentStatusOptions = [
  { value: 'pending', label: 'Pending Pickup' },
  { value: 'picked_up', label: 'Picked Up' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'failed', label: 'Delivery Failed' },
  { value: 'returned', label: 'Returned' },
];

export default function ShipmentManager({ order }: ShipmentManagerProps) {
  const { createShipment, updateShipment, addTrackingEvent } = useOrders();
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);

  // Shipment form state
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [shipmentStatus, setShipmentStatus] = useState<Shipment['status']>('pending');

  // Tracking event form state
  const [eventStatus, setEventStatus] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDescription, setEventDescription] = useState('');

  const handleCreateShipment = async () => {
    if (!carrier || !trackingNumber) return;

    try {
      setLoading(true);
      await createShipment(order.id, {
        carrier,
        tracking_number: trackingNumber,
        tracking_url: trackingUrl || undefined,
        status: shipmentStatus,
      });
      setDialogOpen(false);
      // Reset form
      setCarrier('');
      setTrackingNumber('');
      setTrackingUrl('');
      setShipmentStatus('pending');
    } catch (error) {
      console.error('Failed to create shipment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateShipment = async () => {
    if (!order.shipment) return;

    try {
      setLoading(true);
      await updateShipment(order.shipment.id, {
        carrier: carrier || order.shipment.carrier,
        tracking_number: trackingNumber || order.shipment.tracking_number,
        tracking_url: trackingUrl || order.shipment.tracking_url,
        status: shipmentStatus,
      });
      setDialogOpen(false);
    } catch (error) {
      console.error('Failed to update shipment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTrackingEvent = async () => {
    if (!order.shipment || !eventStatus) return;

    try {
      setLoading(true);
      await addTrackingEvent(order.shipment.id, {
        status: eventStatus,
        location: eventLocation || undefined,
        description: eventDescription || undefined,
        event_time: new Date().toISOString(),
      });
      setEventDialogOpen(false);
      // Reset form
      setEventStatus('');
      setEventLocation('');
      setEventDescription('');
    } catch (error) {
      console.error('Failed to add tracking event:', error);
    } finally {
      setLoading(false);
    }
  };

  // Pre-fill form if shipment exists
  const openEditDialog = () => {
    if (order.shipment) {
      setCarrier(order.shipment.carrier || '');
      setTrackingNumber(order.shipment.tracking_number || '');
      setTrackingUrl(order.shipment.tracking_url || '');
      setShipmentStatus(order.shipment.status);
    }
    setDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Shipment Management
          </span>
          {!order.shipment ? (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Shipment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Shipment</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Courier Partner *</Label>
                    <Select value={carrier} onValueChange={setCarrier}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select courier" />
                      </SelectTrigger>
                      <SelectContent>
                        {courierOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Tracking Number *</Label>
                    <Input
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="Enter tracking number"
                    />
                  </div>
                  <div>
                    <Label>Tracking URL (Optional)</Label>
                    <Input
                      value={trackingUrl}
                      onChange={(e) => setTrackingUrl(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <Label>Initial Status</Label>
                    <Select value={shipmentStatus} onValueChange={(v) => setShipmentStatus(v as Shipment['status'])}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {shipmentStatusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCreateShipment} disabled={loading || !carrier || !trackingNumber} className="w-full">
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Create Shipment
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <Button size="sm" variant="outline" onClick={openEditDialog}>
              Edit Shipment
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {order.shipment ? (
          <div className="space-y-4">
            {/* Shipment Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Courier</p>
                <p className="font-medium">{order.shipment.carrier}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tracking ID</p>
                <p className="font-mono text-sm">{order.shipment.tracking_number}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium capitalize">{order.shipment.status.replace('_', ' ')}</p>
              </div>
            </div>

            {/* Add Tracking Event */}
            <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Tracking Event
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Tracking Event</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Status *</Label>
                    <Input
                      value={eventStatus}
                      onChange={(e) => setEventStatus(e.target.value)}
                      placeholder="e.g., Package arrived at facility"
                    />
                  </div>
                  <div>
                    <Label>Location</Label>
                    <Input
                      value={eventLocation}
                      onChange={(e) => setEventLocation(e.target.value)}
                      placeholder="e.g., Mumbai, Maharashtra"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={eventDescription}
                      onChange={(e) => setEventDescription(e.target.value)}
                      placeholder="Additional details..."
                      rows={3}
                    />
                  </div>
                  <Button onClick={handleAddTrackingEvent} disabled={loading || !eventStatus} className="w-full">
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Add Event
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Update Shipment Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Update Shipment</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Courier Partner</Label>
                    <Select value={carrier} onValueChange={setCarrier}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {courierOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Tracking Number</Label>
                    <Input
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Tracking URL</Label>
                    <Input
                      value={trackingUrl}
                      onChange={(e) => setTrackingUrl(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={shipmentStatus} onValueChange={(v) => setShipmentStatus(v as Shipment['status'])}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {shipmentStatusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleUpdateShipment} disabled={loading} className="w-full">
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Update Shipment
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No shipment created yet. Click "Create Shipment" to add shipping details.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
