import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StoreStats } from '@/hooks/useStoreData';
import {
  Package,
  Users,
  ShoppingCart,
  DollarSign,
  Clock,
  Truck,
  CheckCircle,
  Coins,
  TrendingUp,
  Tag,
  Gift,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface StatsCardsProps {
  stats: StoreStats;
  loading: boolean;
}

const statCards = [
  {
    title: 'Total Products',
    key: 'totalProducts' as keyof StoreStats,
    icon: Package,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    title: 'Total Users',
    key: 'totalUsers' as keyof StoreStats,
    icon: Users,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  {
    title: 'Total Orders',
    key: 'totalOrders' as keyof StoreStats,
    icon: ShoppingCart,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  {
    title: 'Total Revenue',
    key: 'totalRevenue' as keyof StoreStats,
    icon: DollarSign,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    format: (value: number) => `₹${value.toLocaleString('en-IN')}`,
  },
  {
    title: 'Pending Orders',
    key: 'pendingOrders' as keyof StoreStats,
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
  },
  {
    title: 'Shipped Orders',
    key: 'shippedOrders' as keyof StoreStats,
    icon: Truck,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
  },
  {
    title: 'Delivered Orders',
    key: 'deliveredOrders' as keyof StoreStats,
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  {
    title: 'Loyalty Coins Issued',
    key: 'totalLoyaltyCoins' as keyof StoreStats,
    icon: Coins,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
  {
    title: 'Affiliate Commissions',
    key: 'totalAffiliateCommissions' as keyof StoreStats,
    icon: TrendingUp,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    format: (value: number) => `₹${value.toLocaleString('en-IN')}`,
  },
  {
    title: 'Active Coupons',
    key: 'activeCoupons' as keyof StoreStats,
    icon: Tag,
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
  },
  {
    title: 'Active Offers',
    key: 'activeOffers' as keyof StoreStats,
    icon: Gift,
    color: 'text-rose-600',
    bgColor: 'bg-rose-100',
  },
];

export default function StatsCards({ stats, loading }: StatsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 11 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {statCards.map((card) => {
        const Icon = card.icon;
        const value = stats[card.key];
        const displayValue = card.format ? card.format(value as number) : value;

        return (
          <Card key={card.key} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayValue}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
