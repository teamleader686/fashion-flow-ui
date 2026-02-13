import { useState, useMemo } from 'react';
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

const ITEMS_PER_PAGE = 10;

const AdminOrders = () => {
  const { orders, loading, refetch, updateOrderStatus, updateShipment, updateReturn } = useOrdersRealtime();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer_phone.includes(searchQuery);
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  const { currentPage, totalPages, paginatedItems, handlePageChange, startIndex, endIndex, totalItems } = usePagination(filteredOrders, { itemsPerPage: ITEMS_PER_PAGE });

  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  }), [orders]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Order Management</h1>
            <p className="text-muted-foreground mt-1">Manage and track all customer orders</p>
          </div>
          <Button onClick={refetch} variant="outline" className="w-full md:w-auto">
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
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
              <div className="w-full md:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Orders</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="packed">Packed</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <>
            <div className="hidden lg:block"><TableSkeleton rows={ITEMS_PER_PAGE} cols={6} /></div>
            <div className="lg:hidden"><OrderCardsSkeleton count={5} /></div>
          </>
        ) : filteredOrders.length === 0 ? (
          <Card><CardContent className="pt-6"><div className="text-center py-8 text-muted-foreground">No orders found</div></CardContent></Card>
        ) : (
          <>
            <div className="hidden lg:block">
              <OrderTableDesktop orders={paginatedItems} onSelectOrder={setSelectedOrder} onUpdateStatus={updateOrderStatus} onUpdateShipment={updateShipment} onUpdateReturn={updateReturn} />
            </div>
            <div className="hidden md:block lg:hidden">
              <OrderTableTablet orders={paginatedItems} onSelectOrder={setSelectedOrder} onUpdateStatus={updateOrderStatus} onUpdateShipment={updateShipment} onUpdateReturn={updateReturn} />
            </div>
            <div className="block md:hidden">
              <OrderCardMobile orders={paginatedItems} onSelectOrder={setSelectedOrder} onUpdateStatus={updateOrderStatus} onUpdateShipment={updateShipment} onUpdateReturn={updateReturn} />
            </div>
            <AdminPagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} startIndex={startIndex} endIndex={endIndex} totalItems={totalItems} label="orders" />
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
