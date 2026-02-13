import { useNavigate } from 'react-router-dom';
import { useUserOrderStats } from '@/hooks/useUserOrderStats';
import OrderStatsCards from '@/components/user/OrderStatsCards';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Layout from '@/components/layout/Layout';
import {
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Activity,
  Wallet,
  ArrowRight,
} from 'lucide-react';

export default function UserOrderDashboard() {
  const navigate = useNavigate();
  const { stats, loading, refetch } = useUserOrderStats();

  // Calculate percentages
  const deliveryRate = stats.totalOrders > 0
    ? Math.round((stats.deliveredOrders / stats.totalOrders) * 100)
    : 0;

  const cancellationRate = stats.totalOrders > 0
    ? Math.round((stats.cancelledOrders / stats.totalOrders) * 100)
    : 0;

  return (
    <Layout>
      <div className="container max-w-7xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">My Order Dashboard</h1>
            <p className="text-muted-foreground">
              Track your orders, spending, and loyalty rewards
            </p>
          </div>
          <Button onClick={refetch} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Quick Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-900 flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                Total Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">
                {stats.totalOrders}
              </div>
              <p className="text-xs text-blue-700 mt-1">
                {deliveryRate}% delivery rate
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-900 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Total Spent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900">
                ₹{stats.totalAmountSpent.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-green-700 mt-1">Lifetime spending</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-900 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Active Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900">
                {stats.pendingOrders + stats.processingOrders + stats.shippedOrders}
              </div>
              <p className="text-xs text-purple-700 mt-1">
                ₹{stats.totalActiveOrdersValue.toLocaleString('en-IN')} value
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-amber-900 flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Loyalty Coins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-900">
                {stats.currentWalletBalance}
              </div>
              <p className="text-xs text-amber-700 mt-1">Available balance</p>
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
            <ShoppingBag className="h-3 w-3 mr-1" />
            Personal statistics
          </Badge>
        </div>

        {/* Detailed Statistics */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Detailed Statistics</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/my-orders')}
            >
              View All Orders
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
          <OrderStatsCards stats={stats} loading={loading} />
        </div>

        {/* Insights Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Order Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Delivery Success Rate
                </span>
                <Badge variant="default" className="bg-green-600">
                  {deliveryRate}%
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Cancellation Rate
                </span>
                <Badge variant={cancellationRate > 10 ? 'destructive' : 'secondary'}>
                  {cancellationRate}%
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Average Order Value
                </span>
                <Badge variant="outline">
                  ₹{stats.totalOrders > 0
                    ? Math.round(stats.totalAmountSpent / stats.totalOrders).toLocaleString('en-IN')
                    : 0}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Loyalty Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Loyalty Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Coins Earned
                </span>
                <Badge variant="default" className="bg-amber-600">
                  {stats.totalCoinsEarned}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Coins Redeemed
                </span>
                <Badge variant="secondary">
                  {stats.totalCoinsRedeemed}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Redemption Rate
                </span>
                <Badge variant="outline">
                  {stats.totalCoinsEarned > 0
                    ? Math.round((stats.totalCoinsRedeemed / stats.totalCoinsEarned) * 100)
                    : 0}%
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/my-orders')}
              >
                View All Orders
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/products')}
              >
                Continue Shopping
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/account')}
              >
                Manage Account
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/wishlist')}
              >
                View Wishlist
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            <p>
              ✅ All statistics are calculated in real-time from your order history
            </p>
            <p className="mt-1">
              ✅ Automatic updates when you place new orders or earn loyalty coins
            </p>
            <p className="text-xs mt-3 pt-3 border-t">
              Last updated: {new Date().toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
