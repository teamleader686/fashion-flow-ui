import { useNavigate } from 'react-router-dom';
import { useStorageStats } from '@/hooks/useStorageStats';
import StorageChart from '@/components/admin/storage/StorageChart';
import StorageBreakdown from '@/components/admin/storage/StorageBreakdown';
import { Button } from '@/components/ui/button';
import { RefreshCw, ArrowLeft, Download } from 'lucide-react';
import { toast } from 'sonner';

import AdminLayout from '@/components/admin/AdminLayout';

export default function StorageMonitoring() {
  const navigate = useNavigate();
  const { stats, loading, refetch } = useStorageStats();

  const handleExport = () => {
    const data = {
      timestamp: new Date().toISOString(),
      totalStorage: stats.totalStorage,
      usedStorage: stats.usedStorage,
      remainingStorage: stats.remainingStorage,
      usagePercentage: stats.usagePercentage,
      breakdown: stats.breakdown,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `storage-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Storage report exported successfully');
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin/store')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Store
              </Button>
            </div>
            <h1 className="text-3xl font-bold">Storage Monitoring</h1>
            <p className="text-muted-foreground">
              Monitor your Supabase database and storage usage
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleExport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button onClick={refetch} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Storage Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Storage Chart */}
          <StorageChart
            totalStorage={stats.totalStorage}
            usedStorage={stats.usedStorage}
            remainingStorage={stats.remainingStorage}
            usagePercentage={stats.usagePercentage}
            loading={loading}
          />

          {/* Storage Breakdown */}
          <StorageBreakdown
            breakdown={stats.breakdown}
            totalUsed={stats.usedStorage}
            loading={loading}
          />
        </div>

        {/* Additional Info */}
        <div className="bg-muted/50 rounded-lg p-6 space-y-4">
          <h3 className="font-semibold text-lg">About Storage Monitoring</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <p className="font-medium text-foreground mb-2">What's Included:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Product images storage</li>
                <li>Category images storage</li>
                <li>User avatars storage</li>
                <li>Database size estimation</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-foreground mb-2">Updates:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Auto-refresh every 5 minutes</li>
                <li>Manual refresh available</li>
                <li>Real-time usage tracking</li>
                <li>Alert at 80% usage</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
