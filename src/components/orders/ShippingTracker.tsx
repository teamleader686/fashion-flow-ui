import { Shipment } from '@/contexts/OrderContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck, MapPin, Clock, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

interface ShippingTrackerProps {
  shipment: Shipment;
}

export default function ShippingTracker({ shipment }: ShippingTrackerProps) {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      picked_up: 'bg-blue-100 text-blue-800',
      in_transit: 'bg-purple-100 text-purple-800',
      out_for_delivery: 'bg-orange-100 text-orange-800',
      delivered: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      returned: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pending Pickup',
      picked_up: 'Picked Up',
      in_transit: 'In Transit',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered',
      failed: 'Delivery Failed',
      returned: 'Returned',
    };
    return labels[status] || status;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="w-5 h-5" />
          Shipping Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Carrier & Tracking */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {shipment.carrier && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Courier Partner</p>
              <p className="font-medium">{shipment.carrier}</p>
            </div>
          )}
          {shipment.tracking_number && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Tracking ID</p>
              <p className="font-mono text-sm">{shipment.tracking_number}</p>
            </div>
          )}
        </div>

        {/* Status */}
        <div>
          <p className="text-sm text-muted-foreground mb-2">Current Status</p>
          <Badge className={getStatusColor(shipment.status)}>
            {getStatusLabel(shipment.status)}
          </Badge>
        </div>

        {/* Track Online Button */}
        {shipment.tracking_url && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.open(shipment.tracking_url, '_blank')}
          >
            Track Online
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        )}

        {/* Tracking Events */}
        {shipment.tracking_events && shipment.tracking_events.length > 0 && (
          <div className="mt-6">
            <p className="font-medium mb-3">Tracking History</p>
            <div className="space-y-3">
              {shipment.tracking_events
                .sort((a, b) => new Date(b.event_time).getTime() - new Date(a.event_time).getTime())
                .map((event) => (
                  <div
                    key={event.id}
                    className="flex gap-3 p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{event.status}</p>
                      {event.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {event.description}
                        </p>
                      )}
                      {event.location && (
                        <p className="text-xs text-muted-foreground mt-1">
                          📍 {event.location}
                        </p>
                      )}
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {format(new Date(event.event_time), 'MMM dd, yyyy - hh:mm a')}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
