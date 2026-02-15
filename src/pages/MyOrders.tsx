import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useUserOrders } from '@/hooks/useUserOrders';
import { useAuth } from '@/contexts/AuthContext';
import { Order as SupabaseOrder } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OrderCard from '@/components/orders/OrderCard';
import OrderDetailModal from '@/components/orders/OrderDetailModal';
import { OrderListSkeleton } from '@/components/shimmer/OrderCardSkeleton';
import {
  Package,
  ShoppingBag,
  ArrowLeft,
  Filter,
} from 'lucide-react';

export default function MyOrders() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { orders, loading, cancelOrder, requestReturn, confirmDelivery } = useUserOrders();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

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

  // Filter orders by status
  const filteredOrders = orders.filter((order) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') {
      return !['delivered', 'cancelled', 'returned'].includes(order.status);
    }
    return order.status === statusFilter;
  });

  const statusCounts = {
    all: orders.length,
    active: orders.filter(
      (o) => !['delivered', 'cancelled', 'returned'].includes(o.status)
    ).length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  };

  return (
    <Layout>
      <div className="min-h-screen bg-muted/30">
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
          {/* Filter Tabs */}
          <Tabs
            value={statusFilter}
            onValueChange={setStatusFilter}
            className="mb-6"
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

          {/* Loading State */}
          {loading && <OrderListSkeleton count={4} />}

          {/* Empty State */}
          {!loading && filteredOrders.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {statusFilter === 'all'
                    ? 'No orders yet'
                    : `No ${statusFilter} orders`}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {statusFilter === 'all'
                    ? 'Start shopping to see your orders here'
                    : `You don't have any ${statusFilter} orders`}
                </p>
                {statusFilter === 'all' && (
                  <Button onClick={() => navigate('/products')}>
                    Start Shopping
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Orders Grid */}
          {!loading && filteredOrders.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order as any}
                  onViewDetails={(o: any) => setSelectedOrder(o)}
                />
              ))}
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
