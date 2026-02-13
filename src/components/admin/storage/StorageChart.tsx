import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Database, HardDrive, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface StorageChartProps {
  totalStorage: number;
  usedStorage: number;
  remainingStorage: number;
  usagePercentage: number;
  loading?: boolean;
}

export default function StorageChart({
  totalStorage,
  usedStorage,
  remainingStorage,
  usagePercentage,
  loading = false,
}: StorageChartProps) {
  const formatSize = (sizeInMB: number) => {
    if (sizeInMB >= 1024) {
      return `${(sizeInMB / 1024).toFixed(2)} GB`;
    }
    return `${sizeInMB.toFixed(2)} MB`;
  };

  const getStatusColor = () => {
    if (usagePercentage >= 90) return 'text-red-600';
    if (usagePercentage >= 80) return 'text-orange-600';
    return 'text-green-600';
  };

  const getProgressColor = () => {
    if (usagePercentage >= 90) return 'bg-red-500';
    if (usagePercentage >= 80) return 'bg-orange-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Storage Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-gray-200 rounded-full mx-auto w-32"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Storage Usage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Alert for high usage */}
        {usagePercentage >= 80 && (
          <Alert variant={usagePercentage >= 90 ? 'destructive' : 'default'}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {usagePercentage >= 90
                ? 'Critical: Storage is almost full!'
                : 'Warning: Storage usage is high'}
            </AlertDescription>
          </Alert>
        )}

        {/* Donut Chart Visualization */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative w-48 h-48">
            {/* SVG Donut Chart */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="12"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke={usagePercentage >= 90 ? '#ef4444' : usagePercentage >= 80 ? '#f97316' : '#22c55e'}
                strokeWidth="12"
                strokeDasharray={`${usagePercentage * 2.51} 251`}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold ${getStatusColor()}`}>
                {usagePercentage.toFixed(1)}%
              </span>
              <span className="text-sm text-muted-foreground">Used</span>
            </div>
          </div>
        </div>

        {/* Storage Stats */}
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Storage Usage</span>
              <span className="font-medium">
                {formatSize(usedStorage)} / {formatSize(totalStorage)}
              </span>
            </div>
            <Progress value={usagePercentage} className="h-3" />
          </div>

          {/* Detailed Stats */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Available</span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {formatSize(remainingStorage)}
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className={`w-3 h-3 rounded-full ${usagePercentage >= 80 ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                <span>Used</span>
              </div>
              <p className={`text-2xl font-bold ${getStatusColor()}`}>
                {formatSize(usedStorage)}
              </p>
            </div>
          </div>

          {/* Storage Icon */}
          <div className="flex items-center justify-center pt-4 text-muted-foreground">
            <HardDrive className="h-5 w-5 mr-2" />
            <span className="text-sm">Total: {formatSize(totalStorage)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
