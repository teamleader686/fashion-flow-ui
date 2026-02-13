import { useState, useMemo } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useShippingRealtime } from '@/hooks/useShippingRealtime';
import { Search, Filter, RefreshCw, Truck, Package, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ShippingTableDesktop from '@/components/admin/shipping/ShippingTableDesktop';
import ShippingTableTablet from '@/components/admin/shipping/ShippingTableTablet';
import ShippingCardMobile from '@/components/admin/shipping/ShippingCardMobile';
import { StatsCardsSkeleton, TableSkeleton } from '@/components/shimmer/AdminShimmer';
import AdminPagination from '@/components/admin/AdminPagination';
import { usePagination } from '@/hooks/usePagination';

const ITEMS_PER_PAGE = 10;

const AdminShipping = () => {
  const { shippingOrders, loading, refetch, updateShipment } = useShippingRealtime();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [courierFilter, setCourierFilter] = useState<string>('all');

  const filteredOrders = useMemo(() => {
    return shippingOrders.filter(order => {
      const matchesSearch = 
        order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer_phone.includes(searchQuery) ||
        order.shipment?.tracking_number?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || order.shipment?.status === statusFilter;
      const matchesCourier = courierFilter === 'all' || order.shipment?.carrier === courierFilter;
      return matchesSearch && matchesStatus && matchesCourier;
    });
  }, [shippingOrders, searchQuery, statusFilter, courierFilter]);

  const { currentPage, totalPages, paginatedItems, handlePageChange, startIndex, endIndex, totalItems } = usePagination(filteredOrders, { itemsPerPage: ITEMS_PER_PAGE });

  const stats = useMemo(() => ({
    total: shippingOrders.length,
    pending: shippingOrders.filter(o => !o.shipment || o.shipment.status === 'pending').length,
    in_transit: shippingOrders.filter(o => o.shipment?.status === 'in_transit').length,
    out_for_delivery: shippingOrders.filter(o => o.shipment?.status === 'out_for_delivery').length,
    delivered: shippingOrders.filter(o => o.shipment?.status === 'delivered').length,
  }), [shippingOrders]);

  const couriers = useMemo(() => {
    const uniqueCouriers = new Set(shippingOrders.map(o => o.shipment?.carrier).filter(Boolean));
    return Array.from(uniqueCouriers);
  }, [shippingOrders]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Truck className="h-8 w-8 text-blue-600" /> Shipping Management
            </h1>
            <p className="text-muted-foreground mt-1">Manage courier assignments and track shipments</p>
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
              { label: 'Total Orders', value: stats.total, icon: Package, color: '', iconColor: 'text-muted-foreground' },
              { label: 'Not Assigned', value: stats.pending, icon: AlertCircle, color: 'text-orange-600', iconColor: 'text-orange-400' },
              { label: 'In Transit', value: stats.in_transit, icon: Truck, color: 'text-blue-600', iconColor: 'text-blue-400' },
              { label: 'Out for Delivery', value: stats.out_for_delivery, icon: Package, color: 'text-purple-600', iconColor: 'text-purple-400' },
              { label: 'Delivered', value: stats.delivered, icon: CheckCircle, color: 'text-green-600', iconColor: 'text-green-400' },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <Card key={s.label}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                        <div className="text-sm text-muted-foreground">{s.label}</div>
                      </div>
                      <Icon className={`h-8 w-8 ${s.iconColor}`} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by order number, customer name, phone, or tracking ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Filter by status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Not Assigned</SelectItem>
                      <SelectItem value="picked_up">Picked Up</SelectItem>
                      <SelectItem value="in_transit">In Transit</SelectItem>
                      <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="failed">Failed Delivery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Select value={courierFilter} onValueChange={setCourierFilter}>
                    <SelectTrigger><Truck className="h-4 w-4 mr-2" /><SelectValue placeholder="Filter by courier" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Couriers</SelectItem>
                      {couriers.map(courier => (
                        <SelectItem key={courier} value={courier!}>{courier}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <TableSkeleton rows={ITEMS_PER_PAGE} cols={6} />
        ) : filteredOrders.length === 0 ? (
          <Card><CardContent className="pt-6"><div className="text-center py-8 text-muted-foreground">No shipping orders found</div></CardContent></Card>
        ) : (
          <>
            <div className="hidden lg:block">
              <ShippingTableDesktop orders={paginatedItems} onUpdateShipment={updateShipment} />
            </div>
            <div className="hidden md:block lg:hidden">
              <ShippingTableTablet orders={paginatedItems} onUpdateShipment={updateShipment} />
            </div>
            <div className="block md:hidden">
              <ShippingCardMobile orders={paginatedItems} onUpdateShipment={updateShipment} />
            </div>
            <AdminPagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} startIndex={startIndex} endIndex={endIndex} totalItems={totalItems} label="shipments" />
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminShipping;
