import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface StoreStats {
  totalProducts: number;
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  totalLoyaltyCoins: number;
  totalAffiliateCommissions: number;
  activeCoupons: number;
  activeOffers: number;
}

export const useStoreData = () => {
  const [stats, setStats] = useState<StoreStats>({
    totalProducts: 0,
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    totalLoyaltyCoins: 0,
    totalAffiliateCommissions: 0,
    activeCoupons: 0,
    activeOffers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch all stats in parallel
      const [
        productsResult,
        usersResult,
        ordersResult,
        revenueResult,
        pendingOrdersResult,
        shippedOrdersResult,
        deliveredOrdersResult,
      ] = await Promise.allSettled([
        // Total products
        supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true),

        // Total users
        supabase
          .from('user_profiles')
          .select('id', { count: 'exact', head: true }),

        // Total orders
        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true }),

        // Total revenue
        supabase
          .from('orders')
          .select('total_amount')
          .eq('payment_status', 'paid'),

        // Pending orders
        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),

        // Shipped orders
        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .in('status', ['shipped', 'out_for_delivery']),

        // Delivered orders
        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'delivered'),
      ]);

      // Helper to safely get count
      const getCount = (result: any) => {
        if (result.status === 'fulfilled' && !result.value.error) {
          return result.value.count || 0;
        }
        return 0;
      };

      // Helper to safely get data
      const getData = (result: any) => {
        if (result.status === 'fulfilled' && !result.value.error) {
          return result.value.data || [];
        }
        return [];
      };

      // Calculate totals
      const totalRevenue = getData(revenueResult).reduce(
        (sum: number, order: any) => sum + (order.total_amount || 0),
        0
      );

      setStats({
        totalProducts: getCount(productsResult),
        totalUsers: getCount(usersResult),
        totalOrders: getCount(ordersResult),
        totalRevenue,
        pendingOrders: getCount(pendingOrdersResult),
        shippedOrders: getCount(shippedOrdersResult),
        deliveredOrders: getCount(deliveredOrdersResult),
        totalLoyaltyCoins: 0, // Temporarily disabled
        totalAffiliateCommissions: 0, // Temporarily disabled
        activeCoupons: 0, // Temporarily disabled
        activeOffers: 0, // Temporarily disabled
      });

      setError(null);
    } catch (err: any) {
      console.error('Error fetching store stats:', err);
      setError(err.message);
      toast.error('Failed to load store statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    if (mounted) fetchStats();

    let ordersChannel: any;
    let productsChannel: any;

    try {
      // Setup real-time subscriptions for automatic updates securely
      ordersChannel = supabase
        .channel(`store_orders_changes_${Date.now()}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
          if (mounted) fetchStats();
        })
        .subscribe((status, err) => {
          if (err) console.error("Realtime subscription error in store orders:", err);
        });

      productsChannel = supabase
        .channel(`store_products_changes_${Date.now()}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
          if (mounted) fetchStats();
        })
        .subscribe((status, err) => {
          if (err) console.error("Realtime subscription error in store products:", err);
        });
    } catch (e) {
      console.error("Failed to setup real-time subscription for store stats", e);
    }

    return () => {
      mounted = false;
      if (ordersChannel) supabase.removeChannel(ordersChannel);
      if (productsChannel) supabase.removeChannel(productsChannel);
    };
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
};

// Hook for fetching paginated data
export const useStoreTable = (tableName: string, pageSize: number = 10) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data: tableData, error: fetchError, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .range(from, to)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error(`Error fetching ${tableName}:`, fetchError);
        // Don't throw, just set empty data
        setData([]);
        setTotalCount(0);
        setError(fetchError.message);
        return;
      }

      setData(tableData || []);
      setTotalCount(count || 0);
      setError(null);
    } catch (err: any) {
      console.error(`Error fetching ${tableName}:`, err);
      setError(err.message);
      setData([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [tableName, page, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const nextPage = () => {
    if ((page + 1) * pageSize < totalCount) {
      setPage(page + 1);
    }
  };

  const prevPage = () => {
    if (page > 0) {
      setPage(page - 1);
    }
  };

  const deleteRecord = async (id: string) => {
    try {
      const { error } = await supabase.from(tableName).delete().eq('id', id);

      if (error) throw error;

      toast.success('Record deleted successfully');
      fetchData();
    } catch (err: any) {
      console.error('Error deleting record:', err);
      toast.error('Failed to delete record');
      throw err;
    }
  };

  return {
    data,
    loading,
    error,
    page,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
    nextPage,
    prevPage,
    refetch: fetchData,
    deleteRecord,
  };
};
