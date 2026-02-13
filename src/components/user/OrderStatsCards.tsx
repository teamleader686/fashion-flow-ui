import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserOrderStats } from '@/hooks/useUserOrderStats';
import {
  ShoppingCart,
  Clock,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  DollarSign,
  RefreshCcw,
  Activity,
  Coins,
  TrendingDown,
  Wallet,
  Navigation,
  Home,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface OrderStatsCardsProps {
  stats: UserOrderStats;
  loading: boolean;
}

export default function OrderStatsCards({ stats, loading }: OrderStatsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  const statCards = [
    // Order Statistics
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      description: 'All time',
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      description: 'Awaiting confirmation',
    },
    {
      title: 'Processing',
      value: stats.processingOrders,
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      description: 'Being prepared',
    },
    {
      title: 'Shipped',
      value: stats.shippedOrders,
      icon: Truck,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100',
      description: 'On the way',
    },
    {
      title: 'Delivered',
      value: stats.deliveredOrders,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: 'Successfully delivered',
    },
    {
      title: 'Cancelled',
      value: stats.cancelledOrders,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      description: 'Cancelled orders',
    },

    // Spending Summary
    {
      title: 'Total Spent',
      value: `₹${stats.totalAmountSpent.toLocaleString('en-IN')}`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      description: 'Lifetime spending',
    },
    {
      title: 'Refunded',
      value: `₹${stats.totalAmountRefunded.toLocaleString('en-IN')}`,
      icon: RefreshCcw,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      description: 'Total refunds',
    },
    {
      title: 'Active Orders Value',
      value: `₹${stats.totalActiveOrdersValue.toLocaleString('en-IN')}`,
      icon: Activity,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      description: 'Pending orders value',
    },

    // Loyalty Summary
    {
      title: 'Coins Earned',
      value: stats.totalCoinsEarned,
      icon: Coins,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
      description: 'Total earned',
    },
    {
      title: 'Coins Redeemed',
      value: stats.totalCoinsRedeemed,
      icon: TrendingDown,
      color: 'text-rose-600',
      bgColor: 'bg-rose-100',
      description: 'Total redeemed',
    },
    {
      title: 'Wallet Balance',
      value: stats.currentWalletBalance,
      icon: Wallet,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: 'Available coins',
    },

    // Shipping Summary
    {
      title: 'In Transit',
      value: stats.ordersInTransit,
      icon: Navigation,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      description: 'On the way',
    },
    {
      title: 'Out for Delivery',
      value: stats.ordersOutForDelivery,
      icon: Truck,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      description: 'Arriving today',
    },
    {
      title: 'Delivered',
      value: stats.ordersDelivered,
      icon: Home,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: 'Completed deliveries',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {statCards.map((card, index) => {
        const Icon = card.icon;

        return (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
