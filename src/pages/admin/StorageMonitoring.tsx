import { useNavigate } from 'react-router-dom';
import { useStorageStats } from '@/hooks/useStorageStats';
import StorageChart from '@/components/admin/storage/StorageChart';
import StorageBreakdown from '@/components/admin/storage/StorageBreakdown';
import StorageAnalytics from '@/components/admin/storage/StorageAnalytics';
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

      // Sheet 1: Overview
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
        ['Bucket Breakdown'],
        ['Product Images', `${stats.breakdown.productImages.toFixed(2)} MB`],
        ['Category Images', `${stats.breakdown.categoryImages.toFixed(2)} MB`],
        ['User Avatars', `${stats.breakdown.avatars.toFixed(2)} MB`],
        ['Sliders / Banners', `${(stats.breakdown.sliders || 0).toFixed(2)} MB`],
        ['Website Assets', `${(stats.breakdown.websiteAssets || 0).toFixed(2)} MB`],
        ['Database (Estimated)', `${stats.breakdown.database.toFixed(2)} MB`],
        [],
        ['Log-Based Analytics'],
        ['Total Logged Storage', `${(stats.logsTotalKB / 1024).toFixed(2)} MB`],
        ['Total Uploads', stats.logsUploadCount],
        ['Total Deletions', stats.logsDeleteCount],
      ];

      // Sheet 2: Module Breakdown
      const moduleData = [
        ['Module', 'Total KB', 'Total MB', 'Operations Count'],
        ...stats.moduleBreakdown.map(m => [
          m.module, m.totalKB.toFixed(2), m.totalMB.toFixed(4), m.logCount,
        ]),
      ];

      // Sheet 3: Daily Usage
      const dailyData = [
        ['Date', 'Total KB', 'Uploads', 'Deletions'],
        ...stats.dailyUsage.map(d => [
          d.day, d.totalKB.toFixed(2), d.uploadCount, d.deleteCount,
        ]),
      ];

      // Sheet 4: Top Consumers
      const topData = [
        ['Module', 'Action', 'Size (KB)', 'File/Record', 'Timestamp'],
        ...stats.topUsage.map(t => [
          t.module, t.action, t.sizeKB.toFixed(2), t.filePath || t.recordId || '', t.createdAt,
        ]),
      ];

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(overviewData), 'Overview');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(moduleData), 'Module Breakdown');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(dailyData), 'Daily Usage');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(topData), 'Top Consumers');

      XLSX.writeFile(wb, `storage-report-${new Date().toISOString().split('T')[0]}.xlsx`);

      toast.success('Complete storage report exported! 📊');
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
            <h1 className="text-3xl font-bold">📦 Storage Monitoring</h1>
            <p className="text-muted-foreground">
              Full-app storage analytics — Supabase Storage + Database
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleExport} variant="outline" disabled={loading}>
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Button onClick={refetch} variant="outline" disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
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

        {/* Storage Overview — Chart + Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StorageChart
            totalStorage={stats.totalStorage}
            usedStorage={stats.usedStorage}
            remainingStorage={stats.remainingStorage}
            usagePercentage={stats.usagePercentage}
            loading={loading}
          />
          <StorageBreakdown
            breakdown={stats.breakdown}
            totalUsed={stats.usedStorage}
            loading={loading}
          />
        </div>

        {/* Advanced Analytics */}
        <div>
          <h2 className="text-xl font-bold mb-4">📊 CRUD Activity Analytics</h2>
          <StorageAnalytics
            moduleBreakdown={stats.moduleBreakdown}
            dailyUsage={stats.dailyUsage}
            topUsage={stats.topUsage}
            logsTotalKB={stats.logsTotalKB}
            logsUploadCount={stats.logsUploadCount}
            logsDeleteCount={stats.logsDeleteCount}
            loading={loading}
          />
        </div>

        {/* Info Section */}
        <div className="bg-muted/50 rounded-lg p-6 space-y-4">
          <h3 className="font-semibold text-lg">About Storage Monitoring</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div>
              <p className="font-medium text-foreground mb-2">📁 Buckets Tracked:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Product images</li>
                <li>Category images</li>
                <li>User avatars</li>
                <li>Slider / Banner images</li>
                <li>Website assets</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-foreground mb-2">🗄️ DB Tables Tracked:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Products, Categories</li>
                <li>Orders, Order Items</li>
                <li>User Profiles</li>
                <li>Reviews</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-foreground mb-2">⚙️ Features:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Auto-refresh every 5 minutes</li>
                <li>CRUD activity tracking</li>
                <li>Module-wise breakdown</li>
                <li>Daily trend analysis</li>
                <li>Top consumers view</li>
                <li>Excel export (4 sheets)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
