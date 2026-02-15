import { Order, OrderStatusHistory } from '@/lib/supabase';
import { Check, Package, Truck, Home, Clock, Info } from 'lucide-react';
import { format } from 'date-fns';

interface OrderTimelineProps {
  order: Order;
  history?: OrderStatusHistory[];
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

export default function OrderTimeline({ order, history = [] }: OrderTimelineProps) {
  const currentStatusIndex = statusSteps.findIndex(step => step.key === order.status);

  const getStepStatus = (index: number) => {
    if (order.status === 'cancelled' || order.status === 'returned') {
      return 'cancelled';
    }
    if (index < currentStatusIndex) return 'completed';
    if (index === currentStatusIndex) return 'current';
    return 'pending';
  };

  const getStepInfo = (stepKey: string) => {
    // Try to find in history first
    const historyItem = [...history].reverse().find(h => h.status === stepKey);
    if (historyItem) {
      return {
        timestamp: historyItem.created_at,
        note: historyItem.note
      };
    }

    // Fallback to order fields
    let timestamp = null;
    switch (stepKey) {
      case 'pending': timestamp = order.created_at; break;
      case 'confirmed': timestamp = (order as any).confirmed_at; break;
      case 'packed': timestamp = (order as any).packed_at; break;
      case 'shipped': timestamp = order.shipped_at; break;
      case 'delivered': timestamp = order.delivered_at; break;
    }
    return { timestamp, note: null };
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
        const info = getStepInfo(step.key);

        return (
          <div key={step.key} className="flex gap-4">
            {/* Icon */}
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center border-2
                  ${status === 'completed' ? 'bg-green-500 border-green-500 text-white' : ''}
                  ${status === 'current' ? 'bg-blue-50 border-blue-500 text-blue-600 animate-pulse' : ''}
                  ${status === 'pending' ? 'bg-gray-50 border-gray-200 text-gray-300' : ''}
                `}
              >
                <Icon className="w-5 h-5" />
              </div>
              {index < statusSteps.length - 1 && (
                <div
                  className={`
                    w-0.5 h-full min-h-[40px] my-1
                    ${status === 'completed' ? 'bg-green-500' : 'bg-gray-200'}
                  `}
                />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <p
                  className={`
                    font-bold text-sm sm:text-base
                    ${status === 'completed' ? 'text-green-700' : ''}
                    ${status === 'current' ? 'text-blue-700' : ''}
                    ${status === 'pending' ? 'text-gray-400' : ''}
                  `}
                >
                  {step.label}
                </p>
                {info.timestamp && (
                  <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">
                    {format(new Date(info.timestamp), 'MMM dd, hh:mm a')}
                  </p>
                )}
              </div>

              {info.note && (
                <div className="mt-2 p-2 bg-muted/50 rounded-lg border border-transparent hover:border-muted-foreground/10 transition-colors">
                  <div className="flex gap-2">
                    <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground leading-relaxed italic">
                      {info.note}
                    </p>
                  </div>
                </div>
              )}

              {status === 'current' && !info.note && (
                <p className="text-[10px] text-blue-600 mt-1 font-medium bg-blue-50 w-fit px-2 py-0.5 rounded-full">
                  Processing...
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
