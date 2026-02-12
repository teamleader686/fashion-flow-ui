import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type ShippingStatusBadgeProps = {
  status: string;
};

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: 'Not Assigned', className: 'bg-orange-100 text-orange-800 border-orange-200' },
  picked_up: { label: 'Picked Up', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  in_transit: { label: 'In Transit', className: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  out_for_delivery: { label: 'Out for Delivery', className: 'bg-purple-100 text-purple-800 border-purple-200' },
  delivered: { label: 'Delivered', className: 'bg-green-100 text-green-800 border-green-200' },
  failed: { label: 'Failed', className: 'bg-red-100 text-red-800 border-red-200' },
  returned: { label: 'Returned', className: 'bg-gray-100 text-gray-800 border-gray-200' },
};

const ShippingStatusBadge = ({ status }: ShippingStatusBadgeProps) => {
  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' };

  return (
    <Badge variant="outline" className={cn('text-xs font-medium', config.className)}>
      {config.label}
    </Badge>
  );
};

export default ShippingStatusBadge;
