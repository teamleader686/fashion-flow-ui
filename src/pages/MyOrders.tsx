import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useUserOrders } from '@/hooks/useUserOrders';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import OrderCard from '@/components/orders/OrderCard';
import OrderDetailModal from '@/components/orders/OrderDetailModal';
import { OrderListSkeleton } from '@/components/shimmer/OrderCardSkeleton';
import {
  Package,
  ShoppingBag,
  ArrowLeft,
  Search,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const ITEMS_PER_PAGE = 6;

export default function MyOrders() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { orders, loading, error, refetch, cancelOrder, requestReturn, confirmDelivery } = useUserOrders();

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm]);

  // Redirect if not logged in
  if (!user) {
    return (
      <Layout>
        <div className="container max-w-4xl mx-auto px-4 py-12 text-center">
          <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Please Login</h2>
          <p className="text-muted-foreground mb-6">
            You need to be logged in to view your orders
          </p>
          <Button onClick={() => navigate('/account')}>
            Go to Login
          </Button>
        </div>
      </Layout>
    );
  }

  // Error State
  if (error && !loading && orders.length === 0) {
    return (
      <Layout>
        <div className="container max-w-4xl mx-auto px-4 py-12 text-center">
          <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-red-600">Failed to load orders</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={refetch}>Try Again</Button>
        </div>
      </Layout>
    );
  }

  // Filter orders by status and search term
  const filteredOrders = orders.filter((order) => {
    // 1. Status Filter
    const statusMatch = (() => {
      if (statusFilter === 'all') return true;
      if (statusFilter === 'active') {
        return !['delivered', 'cancelled', 'returned'].includes(order.status);
      }
      return order.status === statusFilter;
    })();

    if (!statusMatch) return false;

    // 2. Search Term Filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      const matchesId = order.order_number?.toLowerCase().includes(term);
      const matchesProduct = order.order_items?.some(item =>
        item.product_name?.toLowerCase().includes(term)
      );
      return matchesId || matchesProduct;
    }

    return true;
  });

  const statusCounts = {
    all: orders.length,
    active: orders.filter(
      (o) => !['delivered', 'cancelled', 'returned'].includes(o.status)
    ).length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  };

  // Pagination Logic
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <Layout>
      <div className="min-h-screen bg-muted/30 pb-12">
        {/* Header */}
        <div className="bg-background border-b sticky top-0 z-10">
          <div className="container max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/account')}
                className="lg:hidden"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                  <ShoppingBag className="h-6 w-6" />
                  My Orders
                </h1>
                <p className="text-sm text-muted-foreground">
                  Track and manage your orders
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="container max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-6">
            {/* Filter Tabs */}
            <Tabs
              value={statusFilter}
              onValueChange={setStatusFilter}
              className="w-full md:w-auto overflow-x-auto"
            >
              <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
                <TabsTrigger value="all" className="text-xs sm:text-sm">
                  All ({statusCounts.all})
                </TabsTrigger>
                <TabsTrigger value="active" className="text-xs sm:text-sm">
                  Active ({statusCounts.active})
                </TabsTrigger>
                <TabsTrigger value="delivered" className="text-xs sm:text-sm">
                  Delivered ({statusCounts.delivered})
                </TabsTrigger>
                <TabsTrigger value="cancelled" className="text-xs sm:text-sm">
                  Cancelled ({statusCounts.cancelled})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Search Bar */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by Order ID or Product"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 w-full"
              />
            </div>
          </div>

          {/* Error inline if some orders loaded but refresh failed */}
          {error && orders.length > 0 && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm flex items-center gap-2 border border-red-200">
              <AlertCircle className="h-4 w-4" />
              <span>Failed to sync latest order changes. <button onClick={refetch} className="underline font-medium">Retry</button></span>
            </div>
          )}

          {/* Loading State */}
          {loading && orders.length === 0 && <OrderListSkeleton count={4} />}

          {/* Empty State */}
          {!loading && filteredOrders.length === 0 && (
            <Card>
              <CardContent className="py-12 md:py-20 text-center">
                <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm
                    ? 'No matching orders found'
                    : statusFilter === 'all'
                      ? 'No orders yet'
                      : `No ${statusFilter} orders`}
                </h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  {searchTerm
                    ? `We couldn't find any orders matching "${searchTerm}". Try adjusting your search.`
                    : statusFilter === 'all'
                      ? 'Start shopping to see your orders here'
                      : `You don't have any ${statusFilter} orders`}
                </p>
                {statusFilter === 'all' && !searchTerm && (
                  <Button onClick={() => navigate('/products')} size="lg" className="rounded-full">
                    Start Shopping
                  </Button>
                )}
                {searchTerm && (
                  <Button variant="outline" onClick={() => setSearchTerm('')}>
                    Clear Search
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Orders Grid */}
          {!loading && paginatedOrders.length > 0 && (
            <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
              {paginatedOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order as any}
                  onViewDetails={(o: any) => setSelectedOrder(o)}
                  onCancelOrder={cancelOrder}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous page</span>
              </Button>
              <div className="text-sm font-medium px-4">
                Page {currentPage} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next page</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={selectedOrder as any}
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onCancelOrder={cancelOrder}
        onRequestReturn={requestReturn}
        onConfirmDelivery={confirmDelivery}
      />
    </Layout>
  );
}
