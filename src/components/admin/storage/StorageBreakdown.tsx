import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Image, FolderOpen, User, Database, Layers, Globe, ShoppingBag } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface StorageBreakdownProps {
  breakdown: {
    productImages: number;
    categoryImages: number;
    avatars: number;
    database: number;
    sliders?: number;
    websiteAssets?: number;
    orders?: number;
  };
  totalUsed: number;
  loading?: boolean;
}

export default function StorageBreakdown({
  breakdown,
  totalUsed,
  loading = false,
}: StorageBreakdownProps) {
  const formatSize = (sizeInMB: number) => {
    if (sizeInMB >= 1024) {
      return `${(sizeInMB / 1024).toFixed(2)} GB`;
    }
    return `${sizeInMB.toFixed(2)} MB`;
  };

  const getPercentage = (size: number) => {
    if (totalUsed === 0) return 0;
    return (size / totalUsed) * 100;
  };

  const storageItems = [
    {
      name: 'Product Images',
      size: breakdown.productImages,
      icon: Image,
      color: 'bg-blue-500',
      textColor: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      name: 'Category Images',
      size: breakdown.categoryImages,
      icon: FolderOpen,
      color: 'bg-purple-500',
      textColor: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      name: 'User Avatars',
      size: breakdown.avatars,
      icon: User,
      color: 'bg-green-500',
      textColor: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      name: 'Orders',
      size: breakdown.orders || 0,
      icon: ShoppingBag,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      name: 'Sliders / Banners',
      size: breakdown.sliders || 0,
      icon: Layers,
      color: 'bg-pink-500',
      textColor: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
    },
    {
      name: 'Website Assets',
      size: breakdown.websiteAssets || 0,
      icon: Globe,
      color: 'bg-teal-500',
      textColor: 'text-teal-500',
      bgColor: 'bg-teal-500/10',
    },
    {
      name: 'Database (Est.)',
      size: breakdown.database,
      icon: Database,
      color: 'bg-orange-500',
      textColor: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ].filter(item => item.size > 0);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Storage Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-2 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Storage Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Combined visual bar */}
        <div className="w-full h-4 bg-muted rounded-full overflow-hidden flex">
          {storageItems.map((item) => {
            const pct = getPercentage(item.size);
            if (pct < 0.5) return null;
            return (
              <div
                key={item.name}
                className={`h-full ${item.color} transition-all duration-700`}
                style={{ width: `${pct}%` }}
                title={`${item.name}: ${formatSize(item.size)} (${pct.toFixed(1)}%)`}
              />
            );
          })}
        </div>

        {/* Individual items */}
        {storageItems.map((item) => {
          const Icon = item.icon;
          const percentage = getPercentage(item.size);

          return (
            <div key={item.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${item.bgColor}`}>
                    <Icon className={`h-4 w-4 ${item.textColor}`} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {percentage.toFixed(1)}% of total
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-sm">{formatSize(item.size)}</span>
              </div>
              <Progress value={percentage} className="h-2" />
            </div>
          );
        })}

        {/* Total Summary */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Total Used</span>
            <span className="text-lg font-bold">{formatSize(totalUsed)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
