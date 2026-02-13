import { useModuleStats } from '@/hooks/useModuleStats';
import ModuleStatsCards from '@/components/admin/store/ModuleStatsCards';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, TrendingUp, Database, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import AdminLayout from '@/components/admin/AdminLayout';

export default function StoreCalculations() {
  const { stats, loading, refetch } = useModuleStats();

  // Calculate summary metrics
  const totalRecords =
    stats.totalProducts +
    stats.totalCategories +
    stats.totalAffiliates +
    stats.totalCampaigns +
    stats.totalCustomers +
    stats.totalShipments +
    stats.totalCancellations +
    stats.totalCoupons +
    stats.totalOffers;

  const activeRecords =
    stats.activeProducts +
    stats.activeCategories +
    stats.activeAffiliates +
    stats.activeCampaigns +
    stats.activeCustomers +
    stats.activeCoupons +
    stats.activeOffers;

  const pendingRecords =
    stats.pendingAffiliates +
    stats.pendingShipments;

  return (
    <AdminLayout>
      <div className="container max-w-7xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Database Store Calculations</h1>
            <p className="text-muted-foreground">
              Real-time module-wise statistics and calculations
            </p>
          </div>
          <Button onClick={refetch} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-900 flex items-center gap-2">
                <Database className="h-4 w-4" />
                Total Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">
                {totalRecords.toLocaleString()}
              </div>
              <p className="text-xs text-blue-700 mt-1">Across all modules</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-900 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Active Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900">
                {activeRecords.toLocaleString()}
              </div>
              <p className="text-xs text-green-700 mt-1">Currently active</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-900 flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Pending Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-900">
                {pendingRecords.toLocaleString()}
              </div>
              <p className="text-xs text-yellow-700 mt-1">Awaiting action</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-900 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Loyalty Coins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900">
                {stats.totalLoyaltyCoinsIssued.toLocaleString()}
              </div>
              <p className="text-xs text-purple-700 mt-1">Total issued</p>
            </CardContent>
          </Card>
        </div>

        {/* Real-time Update Badge */}
        <div className="flex items-center justify-center gap-2">
          <Badge variant="outline" className="text-xs">
            <Activity className="h-3 w-3 mr-1 animate-pulse text-green-600" />
            Real-time updates enabled
          </Badge>
          <Badge variant="outline" className="text-xs">
            <Database className="h-3 w-3 mr-1" />
            10 modules tracked
          </Badge>
        </div>

        {/* Module Stats Cards */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Module-wise Breakdown</h2>
          <ModuleStatsCards stats={stats} loading={loading} />
        </div>

        {/* Additional Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">About This Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              ✅ All statistics are calculated in real-time from the database
            </p>
            <p>
              ✅ Automatic updates when data changes (no manual refresh needed)
            </p>
            <p>
              ✅ Module-wise breakdown for easy monitoring
            </p>
            <p>
              ✅ Color-coded indicators for quick insights
            </p>
            <p className="text-xs mt-4 pt-4 border-t">
              Last updated: {new Date().toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );

}
