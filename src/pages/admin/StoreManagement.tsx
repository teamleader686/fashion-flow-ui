import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { useStoreData, useStoreTable } from '@/hooks/useStoreData';
import StatsCards from '@/components/admin/store/StatsCards';
import DataTable from '@/components/admin/store/DataTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Plus, Database } from 'lucide-react';
import { format } from 'date-fns';

export default function StoreManagement() {
  const navigate = useNavigate();
  const { stats, loading: statsLoading, refetch: refetchStats } = useStoreData();
  const [activeTab, setActiveTab] = useState('overview');

  // Data hooks for different tables
  const products = useStoreTable('products', 10);
  const orders = useStoreTable('orders', 10);
  const users = useStoreTable('user_profiles', 10);
  const coupons = useStoreTable('coupons', 10);
  const offers = useStoreTable('offers', 10);

  const handleRefresh = () => {
    refetchStats();
    products.refetch();
    orders.refetch();
    users.refetch();
    coupons.refetch();
    offers.refetch();
  };

  // Column definitions
  const productColumns = [
    { key: 'name', label: 'Product Name' },
    {
      key: 'price',
      label: 'Price',
      render: (value: number) => `₹${value.toLocaleString('en-IN')}`,
    },
    {
      key: 'stock_quantity',
      label: 'Stock',
      render: (value: number) => (
        <Badge variant={value > 10 ? 'default' : 'destructive'}>{value}</Badge>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (value: boolean) => (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (value: string) => format(new Date(value), 'MMM dd, yyyy'),
    },
  ];

  const orderColumns = [
    { key: 'order_number', label: 'Order #' },
    { key: 'customer_name', label: 'Customer' },
    {
      key: 'total_amount',
      label: 'Amount',
      render: (value: number) => `₹${value.toLocaleString('en-IN')}`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => {
        const colors: Record<string, string> = {
          pending: 'bg-yellow-100 text-yellow-800',
          confirmed: 'bg-blue-100 text-blue-800',
          processing: 'bg-purple-100 text-purple-800',
          shipped: 'bg-cyan-100 text-cyan-800',
          delivered: 'bg-green-100 text-green-800',
          cancelled: 'bg-red-100 text-red-800',
        };
        return (
          <Badge className={colors[value] || 'bg-gray-100 text-gray-800'}>
            {value.toUpperCase()}
          </Badge>
        );
      },
    },
    {
      key: 'payment_status',
      label: 'Payment',
      render: (value: string) => (
        <Badge variant={value === 'paid' ? 'default' : 'secondary'}>
          {value.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      label: 'Date',
      render: (value: string) => format(new Date(value), 'MMM dd, yyyy'),
    },
  ];

  const userColumns = [
    { key: 'full_name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    {
      key: 'loyalty_coins_balance',
      label: 'Loyalty Coins',
      render: (value: number) => value || 0,
    },
    {
      key: 'created_at',
      label: 'Joined',
      render: (value: string) => format(new Date(value), 'MMM dd, yyyy'),
    },
  ];

  const couponColumns = [
    { key: 'code', label: 'Code' },
    {
      key: 'discount_type',
      label: 'Type',
      render: (value: string) => value ? value.toUpperCase() : 'N/A',
    },
    {
      key: 'discount_value',
      label: 'Discount',
      render: (value: number, row: any) =>
        row.discount_type === 'percentage' ? `${value || 0}%` : `₹${value || 0}`,
    },
    {
      key: 'usage_count',
      label: 'Used',
      render: (value: number, row: any) => `${value || 0}/${row.usage_limit || '∞'}`,
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (value: boolean) => (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  const offerColumns = [
    { key: 'title', label: 'Title' },
    {
      key: 'discount_percentage',
      label: 'Discount',
      render: (value: number) => `${value}%`,
    },
    {
      key: 'valid_from',
      label: 'Valid From',
      render: (value: string) => format(new Date(value), 'MMM dd, yyyy'),
    },
    {
      key: 'valid_until',
      label: 'Valid Until',
      render: (value: string) => format(new Date(value), 'MMM dd, yyyy'),
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (value: boolean) => (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="container max-w-7xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Store Management</h1>
            <p className="text-muted-foreground">
              Manage all your store data and monitor statistics
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => navigate('/admin/store/storage')} variant="outline">
              <Database className="h-4 w-4 mr-2" />
              Storage Monitoring
            </Button>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <StatsCards stats={stats} loading={statsLoading} />

        {/* Data Tables */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="marketing">Marketing</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Orders */}
              <DataTable
                title="Recent Orders"
                data={orders.data.slice(0, 5)}
                columns={orderColumns.slice(0, 4)}
                loading={orders.loading}
                page={0}
                totalPages={1}
                onNextPage={() => { }}
                onPrevPage={() => { }}
                onView={(row) => navigate(`/admin/orders/${row.id}`)}
                searchable={false}
              />

              {/* Low Stock Products */}
              <DataTable
                title="Low Stock Products"
                data={products.data.filter((p) => p.stock_quantity < 10).slice(0, 5)}
                columns={productColumns.slice(0, 3)}
                loading={products.loading}
                page={0}
                totalPages={1}
                onNextPage={() => { }}
                onPrevPage={() => { }}
                onEdit={(row) => navigate(`/admin/products/edit/${row.id}`)}
                searchable={false}
              />
            </div>
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => navigate('/admin/products/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>
            <DataTable
              title="All Products"
              data={products.data}
              columns={productColumns}
              loading={products.loading}
              page={products.page}
              totalPages={products.totalPages}
              onNextPage={products.nextPage}
              onPrevPage={products.prevPage}
              onEdit={(row) => navigate(`/admin/products/edit/${row.id}`)}
              onDelete={products.deleteRecord}
            />
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <DataTable
              title="All Orders"
              data={orders.data}
              columns={orderColumns}
              loading={orders.loading}
              page={orders.page}
              totalPages={orders.totalPages}
              onNextPage={orders.nextPage}
              onPrevPage={orders.prevPage}
              onView={(row) => navigate(`/admin/orders/${row.id}`)}
            />
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <DataTable
              title="All Users"
              data={users.data}
              columns={userColumns}
              loading={users.loading}
              page={users.page}
              totalPages={users.totalPages}
              onNextPage={users.nextPage}
              onPrevPage={users.prevPage}
            />
          </TabsContent>

          <TabsContent value="marketing" className="space-y-6">
            <DataTable
              title="Coupons"
              data={coupons.data}
              columns={couponColumns}
              loading={coupons.loading}
              page={coupons.page}
              totalPages={coupons.totalPages}
              onNextPage={coupons.nextPage}
              onPrevPage={coupons.prevPage}
              onDelete={coupons.deleteRecord}
            />

            <DataTable
              title="Offers"
              data={offers.data}
              columns={offerColumns}
              loading={offers.loading}
              page={offers.page}
              totalPages={offers.totalPages}
              onNextPage={offers.nextPage}
              onPrevPage={offers.prevPage}
              onDelete={offers.deleteRecord}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
