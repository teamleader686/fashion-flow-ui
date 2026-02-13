import { useNavigate } from 'react-router-dom';
import { useOrders } from '@/contexts/OrderContext';
import OrderCard from '@/components/orders/OrderCard';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Package } from 'lucide-react';

export default function MyOrdersPage() {
  const navigate = useNavigate();
  const { orders, loading } = useOrders();

  if (loading) {
    return (
      <div className="container max-w-6xl mx-auto p-4 space-y-4">
        <h1 className="text-2xl font-bold mb-6">My Orders</h1>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container max-w-6xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">My Orders</h1>
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Orders Yet</h2>
            <p className="text-muted-foreground mb-6">
              You haven't placed any orders yet. Start shopping to see your orders here!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>
      <div className="space-y-4">
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onViewDetails={(order) => navigate(`/orders/${order.id}`)}
          />
        ))}
      </div>
    </div>
  );
}
