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

const AdminShipping = () => {
  const { shippingOrders, loading, refetch, updateShipment } = useShippingRealtime();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [courierFilter, setCourierFilter] = useState<string>('all');

  // Filter and search shipping orders
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

  // Statistics
  const stats = useMemo(() => {
    return {
      total: shippingOrders.length,
      pending: shippingOrders.filter(o => !o.shipment || o.shipment.status === 'pending').length,
      in_transit: shippingOrders.filter(o => o.shipment?.status === 'in_transit').length,
      out_for_delivery: shippingOrders.filter(o => o.shipment?.status === 'out_for_delivery').length,
      delivered: shippingOrders.filter(o => o.shipment?.status === 'delivered').length,
    };
  }, [shippingOrders]);

  // Get unique couriers
  const couriers = useMemo(() => {
    const uniqueCouriers = new Set(
      shippingOrders
        .map(o => o.shipment?.carrier)
        .filter(Boolean)
    );
    return Array.from(uniqueCouriers);
  }, [shippingOrders]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Truck className="h-8 w-8 text-blue-600" />
              Shipping Management
            </h1>
            <p className="text-gray-500 mt-1">Manage courier assignments and track shipments</p>
          </div>
          <Button
            onClick={refetch}
            variant="outline"
            className="w-full md:w-auto"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-sm text-gray-500">Total Orders</div>
                </div>
                <Package className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
                  <div className="text-sm text-gray-500">Not Assigned</div>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{stats.in_transit}</div>
                  <div className="text-sm text-gray-500">In Transit</div>
                </div>
                <Truck className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-purple-600">{stats.out_for_delivery}</div>
                  <div className="text-sm text-gray-500">Out for Delivery</div>
                </div>
                <Package className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
                  <div className="text-sm text-gray-500">Delivered</div>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by order number, customer name, phone, or tracking ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
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
                    <SelectTrigger>
                      <Truck className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by courier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Couriers</SelectItem>
                      {couriers.map(courier => (
                        <SelectItem key={courier} value={courier!}>
                          {courier}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Orders Display - Responsive */}
        {loading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">Loading shipping orders...</div>
            </CardContent>
          </Card>
        ) : filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-gray-500">
                No shipping orders found
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Desktop View (≥1024px) */}
            <div className="hidden lg:block">
              <ShippingTableDesktop
                orders={filteredOrders}
                onUpdateShipment={updateShipment}
              />
            </div>

            {/* Tablet View (768px-1023px) */}
            <div className="hidden md:block lg:hidden">
              <ShippingTableTablet
                orders={filteredOrders}
                onUpdateShipment={updateShipment}
              />
            </div>

            {/* Mobile View (≤767px) */}
            <div className="block md:hidden">
              <ShippingCardMobile
                orders={filteredOrders}
                onUpdateShipment={updateShipment}
              />
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminShipping;
