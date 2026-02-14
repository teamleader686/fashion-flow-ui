import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Image, FolderOpen, User, Database } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface StorageBreakdownProps {
  breakdown: {
    productImages: number;
    categoryImages: number;
    avatars: number;
    database: number;
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
    },
    {
      name: 'Category Images',
      size: breakdown.categoryImages,
      icon: FolderOpen,
      color: 'bg-purple-500',
    },
    {
      name: 'User Avatars',
      size: breakdown.avatars,
      icon: User,
      color: 'bg-green-500',
    },
    {
      name: 'Database',
      size: breakdown.database,
      icon: Database,
      color: 'bg-orange-500',
    },
  ];

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
      <CardContent className="space-y-6">
        {storageItems.map((item) => {
          const Icon = item.icon;
          const percentage = getPercentage(item.size);

          return (
            <div key={item.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${item.color.replace('500', '500/10')}`}>
                    <Icon className={`h-4 w-4 ${item.color.replace('bg-', 'text-')}`} />
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
