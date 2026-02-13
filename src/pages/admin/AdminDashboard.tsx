import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import {
  ShoppingCart,
  DollarSign,
  Package,
  Users,
  TrendingUp,
  AlertCircle,
  BarChart3,
  LineChart as LineChartIcon,
} from 'lucide-react';
import DateRangeFilter, { DateFilter } from '@/components/admin/analytics/DateRangeFilter';
import RevenueExpenseChart from '@/components/admin/analytics/RevenueExpenseChart';
import ProfitLossChart from '@/components/admin/analytics/ProfitLossChart';
import AnalyticsSummaryCards from '@/components/admin/analytics/AnalyticsSummaryCards';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';

type DashboardStats = {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  totalCustomers: number;
  lowStockProducts: number;
  todayOrders: number;
};

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    totalCustomers: 0,
    lowStockProducts: 0,
    todayOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  
  // Analytics state
  const [dateFilter, setDateFilter] = useState<DateFilter>('month');
  const [customDateRange, setCustomDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  
  const analyticsData = useAnalyticsData(dateFilter, customDateRange);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Fetch total orders and revenue
      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount, created_at, status')
        .not('status', 'in', '(cancelled,returned)');

      // Fetch pending orders
      const { data: pending } = await supabase
        .from('orders')
        .select('id')
        .eq('status', 'pending');

      // Fetch total customers
      const { data: customers } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('role', 'customer');

      // Fetch low stock products
      const { data: lowStock } = await supabase
        .from('product_variants')
        .select('id')
        .lte('stock_quantity', 10);

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const todayOrders = orders?.filter(o => 
        o.created_at.startsWith(today)
      ).length || 0;

      const totalRevenue = orders?.reduce((sum, order) => 
        sum + parseFloat(order.total_amount || '0'), 0
      ) || 0;

      setStats({
        totalOrders: orders?.length || 0,
        totalRevenue,
        pendingOrders: pending?.length || 0,
        totalCustomers: customers?.length || 0,
        lowStockProducts: lowStock?.length || 0,
        todayOrders,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Total Revenue',
      value: `₹${stats.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders,
      icon: AlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Total Customers',
      value: stats.totalCustomers,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Today\'s Orders',
      value: stats.todayOrders,
      icon: TrendingUp,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
    },
    {
      title: 'Low Stock Items',
      value: stats.lowStockProducts,
      icon: Package,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">Welcome to your admin panel</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-3">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 rounded w-32"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                      {stat.title}
                    </CardTitle>
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <a
                href="/admin/products"
                className="p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Package className="h-5 w-5 sm:h-6 sm:w-6 text-pink-500 mb-2" />
                <h3 className="font-semibold text-sm sm:text-base">Manage Products</h3>
                <p className="text-xs sm:text-sm text-gray-500">Add or edit products</p>
              </a>
              <a
                href="/admin/orders"
                className="p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500 mb-2" />
                <h3 className="font-semibold text-sm sm:text-base">Process Orders</h3>
                <p className="text-xs sm:text-sm text-gray-500">View and manage orders</p>
              </a>
              <a
                href="/admin/customers"
                className="p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500 mb-2" />
                <h3 className="font-semibold text-sm sm:text-base">View Customers</h3>
                <p className="text-xs sm:text-sm text-gray-500">Manage customer accounts</p>
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Business Analytics Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Business Analytics</h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Track your revenue, expenses, profit & loss
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={chartType === 'line' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('line')}
                className="text-xs sm:text-sm"
              >
                <LineChartIcon className="h-4 w-4 mr-1" />
                Line
              </Button>
              <Button
                variant={chartType === 'bar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('bar')}
                className="text-xs sm:text-sm"
              >
                <BarChart3 className="h-4 w-4 mr-1" />
                Bar
              </Button>
            </div>
          </div>

          <DateRangeFilter
            selectedFilter={dateFilter}
            onFilterChange={setDateFilter}
            customDateRange={customDateRange}
            onCustomDateChange={setCustomDateRange}
          />

          {analyticsData.error && (
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-4">
                <p className="text-sm text-red-600">{analyticsData.error}</p>
              </CardContent>
            </Card>
          )}

          <AnalyticsSummaryCards
            data={{
              totalRevenue: analyticsData.revenueExpenseData.reduce((sum, item) => sum + item.revenue, 0),
              totalExpenses: analyticsData.revenueExpenseData.reduce((sum, item) => sum + item.expenses, 0),
              totalProfit: analyticsData.profitLossData.reduce((sum, item) => sum + item.profit, 0),
              totalLoss: analyticsData.profitLossData.reduce((sum, item) => sum + item.loss, 0),
              profitMargin: analyticsData.revenueExpenseData.reduce((sum, item) => sum + item.revenue, 0) > 0
                ? ((analyticsData.revenueExpenseData.reduce((sum, item) => sum + item.revenue, 0) - 
                    analyticsData.revenueExpenseData.reduce((sum, item) => sum + item.expenses, 0)) / 
                    analyticsData.revenueExpenseData.reduce((sum, item) => sum + item.revenue, 0)) * 100
                : 0,
            }}
            loading={analyticsData.loading}
          />

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
            <RevenueExpenseChart
              data={analyticsData.revenueExpenseData}
              chartType={chartType}
              loading={analyticsData.loading}
            />
            <ProfitLossChart
              data={analyticsData.profitLossData}
              loading={analyticsData.loading}
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
