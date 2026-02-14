import { useState, useMemo, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOrdersRealtime } from '@/hooks/useOrdersRealtime';
import { Search, Filter, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import OrderTableDesktop from '@/components/admin/orders/OrderTableDesktop';
import OrderTableTablet from '@/components/admin/orders/OrderTableTablet';
import OrderCardMobile from '@/components/admin/orders/OrderCardMobile';
import { Order } from '@/lib/supabase';
import { StatsCardsSkeleton, OrderCardsSkeleton, TableSkeleton } from '@/components/shimmer/AdminShimmer';
import AdminPagination from '@/components/admin/AdminPagination';
import { usePagination } from '@/hooks/usePagination';

const AdminOrders = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const {
    orders,
    totalCount,
    loading,
    refetch,
    updateOrderStatus,
    updateShipment,
    updateReturn
  } = useOrdersRealtime({
    page: currentPage,
    pageSize: itemsPerPage,
    status: statusFilter,
    search: searchQuery
  });

  // Global stats might need a separate fetch if we only fetch page data
  // For now, let's just show totalCount as the main stat and others if available.
  // Ideally, stats should be a separate query.
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalCount);

  const stats = useMemo(() => ({
    total: totalCount,
    pending: 0, // These would ideally come from a summary RPC or separate query
    processing: 0,
    shipped: 0,
    delivered: 0,
  }), [totalCount]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, itemsPerPage]);

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + ["Order Number,Customer,Email,Status,Amount,Date"]
        .concat(orders.map(o => `${o.order_number},${o.customer_name},${o.customer_email},${o.status},${o.total_amount},${o.created_at}`))
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `orders_page_${currentPage}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Order Management</h1>
            <p className="text-muted-foreground mt-1">Manage and track all customer orders ({totalCount} total)</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExport} variant="outline" className="hidden md:flex">
              Export Page
            </Button>
            <Button onClick={refetch} variant="outline" className="w-full md:w-auto">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>
        </div>

        {loading ? (
          <StatsCardsSkeleton count={5} />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Total Orders', value: stats.total, color: '' },
              { label: 'Pending', value: stats.pending, color: 'text-orange-600' },
              { label: 'Processing', value: stats.processing, color: 'text-blue-600' },
              { label: 'Shipped', value: stats.shipped, color: 'text-purple-600' },
              { label: 'Delivered', value: stats.delivered, color: 'text-green-600' },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="pt-6">
                  <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-sm text-muted-foreground">{s.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by order number, customer name, email, or phone..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="packed">Packed</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={itemsPerPage.toString()} onValueChange={(v) => setItemsPerPage(parseInt(v))}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Per page" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 per page</SelectItem>
                    <SelectItem value="20">20 per page</SelectItem>
                    <SelectItem value="50">50 per page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <>
            <div className="hidden lg:block"><TableSkeleton rows={itemsPerPage} cols={6} /></div>
            <div className="lg:hidden"><OrderCardsSkeleton count={5} /></div>
          </>
        ) : orders.length === 0 ? (
          <Card><CardContent className="pt-6"><div className="text-center py-8 text-muted-foreground">No orders found</div></CardContent></Card>
        ) : (
          <>
            <div className="hidden lg:block">
              <OrderTableDesktop orders={orders} onSelectOrder={setSelectedOrder} onUpdateStatus={updateOrderStatus} onUpdateShipment={updateShipment} onUpdateReturn={updateReturn} />
            </div>
            <div className="hidden md:block lg:hidden">
              <OrderTableTablet orders={orders} onSelectOrder={setSelectedOrder} onUpdateStatus={updateOrderStatus} onUpdateShipment={updateShipment} onUpdateReturn={updateReturn} />
            </div>
            <div className="block md:hidden">
              <OrderCardMobile orders={orders} onSelectOrder={setSelectedOrder} onUpdateStatus={updateOrderStatus} onUpdateShipment={updateShipment} onUpdateReturn={updateReturn} />
            </div>
            <AdminPagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} startIndex={startIndex} endIndex={endIndex} totalItems={totalCount} label="orders" />
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
