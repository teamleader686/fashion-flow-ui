import { useNavigate } from 'react-router-dom';
import { useStorageStats } from '@/hooks/useStorageStats';
import StorageChart from '@/components/admin/storage/StorageChart';
import StorageBreakdown from '@/components/admin/storage/StorageBreakdown';
import { Button } from '@/components/ui/button';
import { RefreshCw, ArrowLeft, Download } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

import AdminLayout from '@/components/admin/AdminLayout';

export default function StorageMonitoring() {
  const navigate = useNavigate();
  const { stats, loading, error, refetch } = useStorageStats();

  const handleExport = () => {
    try {
      const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

      // Prepare data for Excel
      const overviewData = [
        ['Storage Monitoring Report'],
        ['Generated On', timestamp],
        [],
        ['Overview'],
        ['Total Storage', `${stats.totalStorage} MB`],
        ['Used Storage', `${stats.usedStorage.toFixed(2)} MB`],
        ['Remaining Storage', `${stats.remainingStorage.toFixed(2)} MB`],
        ['Usage Percentage', `${stats.usagePercentage.toFixed(2)}%`],
        [],
        ['Breakdown'],
        ['Product Images', `${stats.breakdown.productImages.toFixed(2)} MB`],
        ['Category Images', `${stats.breakdown.categoryImages.toFixed(2)} MB`],
        ['User Avatars', `${stats.breakdown.avatars.toFixed(2)} MB`],
        ['Database (Estimated)', `${stats.breakdown.database.toFixed(2)} MB`],
      ];

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(overviewData);

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Storage Report');

      // Save file
      XLSX.writeFile(wb, `storage-report-${new Date().toISOString().split('T')[0]}.xlsx`);

      toast.success('Storage report exported successfully');
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Failed to export storage report');
    }
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
            <Button onClick={handleExport} variant="outline" disabled={loading}>
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Button onClick={refetch} variant="outline" disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

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
