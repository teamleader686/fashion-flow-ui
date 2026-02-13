import { Order } from '@/contexts/OrderContext';
import { Check, Package, Truck, Home, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface OrderTimelineProps {
  order: Order;
}

const statusSteps = [
  { key: 'pending', label: 'Order Placed', icon: Package },
  { key: 'confirmed', label: 'Confirmed', icon: Check },
  { key: 'processing', label: 'Processing', icon: Clock },
  { key: 'packed', label: 'Packed', icon: Package },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: Home },
];

export default function OrderTimeline({ order }: OrderTimelineProps) {
  const currentStatusIndex = statusSteps.findIndex(step => step.key === order.status);
  
  const getStepStatus = (index: number) => {
    if (order.status === 'cancelled' || order.status === 'returned') {
      return 'cancelled';
    }
    if (index < currentStatusIndex) return 'completed';
    if (index === currentStatusIndex) return 'current';
    return 'pending';
  };

  const getTimestamp = (stepKey: string) => {
    switch (stepKey) {
      case 'pending':
        return order.created_at;
      case 'confirmed':
        return order.confirmed_at;
      case 'packed':
        return order.packed_at;
      case 'shipped':
        return order.shipped_at;
      case 'delivered':
        return order.delivered_at;
      default:
        return null;
    }
  };

  if (order.status === 'cancelled') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 font-medium">Order Cancelled</p>
        <p className="text-sm text-red-600 mt-1">
          This order has been cancelled
        </p>
      </div>
    );
  }

  if (order.status === 'returned') {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-gray-800 font-medium">Order Returned</p>
        <p className="text-sm text-gray-600 mt-1">
          This order has been returned
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {statusSteps.map((step, index) => {
        const status = getStepStatus(index);
        const Icon = step.icon;
        const timestamp = getTimestamp(step.key);
        
        return (
          <div key={step.key} className="flex gap-4">
            {/* Icon */}
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  ${status === 'completed' ? 'bg-green-500 text-white' : ''}
                  ${status === 'current' ? 'bg-blue-500 text-white animate-pulse' : ''}
                  ${status === 'pending' ? 'bg-gray-200 text-gray-400' : ''}
                `}
              >
                <Icon className="w-5 h-5" />
              </div>
              {index < statusSteps.length - 1 && (
                <div
                  className={`
                    w-0.5 h-12 mt-2
                    ${status === 'completed' ? 'bg-green-500' : 'bg-gray-200'}
                  `}
                />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-8">
              <p
                className={`
                  font-medium
                  ${status === 'completed' ? 'text-green-700' : ''}
                  ${status === 'current' ? 'text-blue-700' : ''}
                  ${status === 'pending' ? 'text-gray-400' : ''}
                `}
              >
                {step.label}
              </p>
              {timestamp && (
                <p className="text-sm text-muted-foreground mt-1">
                  {format(new Date(timestamp), 'MMM dd, yyyy - hh:mm a')}
                </p>
              )}
              {status === 'current' && (
                <p className="text-sm text-blue-600 mt-1">In Progress</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
