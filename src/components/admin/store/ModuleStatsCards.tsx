import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ModuleStats } from '@/hooks/useModuleStats';
import {
  Package,
  FolderTree,
  Users,
  Instagram,
  UserCheck,
  Truck,
  XCircle,
  Tag,
  Gift,
  Wallet,
  Coins,
  TrendingDown,
  CheckCircle,
  Clock,
  Ban,
  Calendar,
  Activity,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface ModuleStatsCardsProps {
  stats: ModuleStats;
  loading: boolean;
}

interface StatModule {
  title: string;
  icon: any;
  color: string;
  bgColor: string;
  items: {
    label: string;
    value: number;
    icon?: any;
    color?: string;
  }[];
}

export default function ModuleStatsCards({ stats, loading }: ModuleStatsCardsProps) {
  const modules: StatModule[] = [
    {
      title: 'Product Management',
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      items: [
        { label: 'Total Products', value: stats.totalProducts, icon: Package },
        { label: 'Active', value: stats.activeProducts, icon: CheckCircle, color: 'text-green-600' },
        { label: 'Inactive', value: stats.inactiveProducts, icon: Ban, color: 'text-gray-500' },
      ],
    },
    {
      title: 'Category Management',
      icon: FolderTree,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      items: [
        { label: 'Total Categories', value: stats.totalCategories, icon: FolderTree },
        { label: 'Active', value: stats.activeCategories, icon: CheckCircle, color: 'text-green-600' },
      ],
    },
    {
      title: 'Affiliate Management',
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      items: [
        { label: 'Total Affiliates', value: stats.totalAffiliates, icon: Users },
        { label: 'Active', value: stats.activeAffiliates, icon: CheckCircle, color: 'text-green-600' },
        { label: 'Pending', value: stats.pendingAffiliates, icon: Clock, color: 'text-yellow-600' },
      ],
    },
    {
      title: 'Instagram Campaigns',
      icon: Instagram,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
      items: [
        { label: 'Total Campaigns', value: stats.totalCampaigns, icon: Instagram },
        { label: 'Active', value: stats.activeCampaigns, icon: Activity, color: 'text-green-600' },
        { label: 'Completed', value: stats.completedCampaigns, icon: CheckCircle, color: 'text-blue-600' },
      ],
    },
    {
      title: 'Customer Data',
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      items: [
        { label: 'Total Customers', value: stats.totalCustomers, icon: UserCheck },
        { label: 'Active', value: stats.activeCustomers, icon: CheckCircle, color: 'text-green-600' },
      ],
    },
    {
      title: 'Shipping Management',
      icon: Truck,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100',
      items: [
        { label: 'Total Shipments', value: stats.totalShipments, icon: Truck },
        { label: 'Pending', value: stats.pendingShipments, icon: Clock, color: 'text-yellow-600' },
        { label: 'Delivered', value: stats.deliveredShipments, icon: CheckCircle, color: 'text-green-600' },
      ],
    },
    {
      title: 'Cancellation Management',
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      items: [
        { label: 'Total Requests', value: stats.totalCancellations, icon: XCircle },
        { label: 'Approved', value: stats.approvedCancellations, icon: CheckCircle, color: 'text-green-600' },
        { label: 'Rejected', value: stats.rejectedCancellations, icon: Ban, color: 'text-red-600' },
      ],
    },
    {
      title: 'Coupon Management',
      icon: Tag,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
      items: [
        { label: 'Total Coupons', value: stats.totalCoupons, icon: Tag },
        { label: 'Active', value: stats.activeCoupons, icon: CheckCircle, color: 'text-green-600' },
        { label: 'Expired', value: stats.expiredCoupons, icon: Calendar, color: 'text-gray-500' },
      ],
    },
    {
      title: 'Offer Management',
      icon: Gift,
      color: 'text-rose-600',
      bgColor: 'bg-rose-100',
      items: [
        { label: 'Total Offers', value: stats.totalOffers, icon: Gift },
        { label: 'Active', value: stats.activeOffers, icon: CheckCircle, color: 'text-green-600' },
        { label: 'Expired', value: stats.expiredOffers, icon: Calendar, color: 'text-gray-500' },
      ],
    },
    {
      title: 'Wallet / Loyalty',
      icon: Wallet,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      items: [
        { label: 'Users with Wallet', value: stats.totalWalletUsers, icon: Wallet },
        { label: 'Coins Issued', value: stats.totalLoyaltyCoinsIssued, icon: Coins, color: 'text-amber-600' },
        { label: 'Coins Redeemed', value: stats.totalCoinsRedeemed, icon: TrendingDown, color: 'text-blue-600' },
      ],
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {modules.map((module, index) => {
        const Icon = module.icon;

        return (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">
                  {module.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${module.bgColor}`}>
                  <Icon className={`h-5 w-5 ${module.color}`} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {module.items.map((item, itemIndex) => {
                const ItemIcon = item.icon;
                return (
                  <div
                    key={itemIndex}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      {ItemIcon && (
                        <ItemIcon
                          className={`h-4 w-4 ${item.color || 'text-muted-foreground'}`}
                        />
                      )}
                      <span className="text-sm text-muted-foreground">
                        {item.label}
                      </span>
                    </div>
                    <Badge
                      variant="secondary"
                      className="font-semibold"
                    >
                      {item.value.toLocaleString()}
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
