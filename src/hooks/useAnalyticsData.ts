import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, eachDayOfInterval, subDays } from 'date-fns';

export type DateFilter = 'today' | 'week' | 'month' | 'custom';

type AnalyticsData = {
  revenueExpenseData: Array<{ date: string; revenue: number; expenses: number }>;
  profitLossData: Array<{ date: string; profit: number; loss: number }>;
  loading: boolean;
  error: string | null;
};

export function useAnalyticsData(
  filter: DateFilter,
  customRange: { from: Date | undefined; to: Date | undefined }
): AnalyticsData {
  const [data, setData] = useState<AnalyticsData>({
    revenueExpenseData: [],
    profitLossData: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Fallback security: never stay in loading state forever
    const timer = setTimeout(() => {
      setData(prev => ({ ...prev, loading: false }));
    }, 8000);

    fetchAnalyticsData();

    return () => clearTimeout(timer);
  }, [filter, customRange.from, customRange.to]);

  const getDateRange = () => {
    const now = new Date();

    switch (filter) {
      case 'today':
        return { start: startOfDay(now), end: endOfDay(now) };
      case 'week':
        return { start: startOfWeek(now), end: endOfWeek(now) };
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'custom':
        if (customRange.from && customRange.to) {
          return { start: startOfDay(customRange.from), end: endOfDay(customRange.to) };
        }
        return { start: startOfMonth(now), end: endOfMonth(now) };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      const { start, end } = getDateRange();

      // Fetch orders within date range
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('total_amount, created_at, status, shipping_cost')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .not('status', 'in', '(cancelled)');

      if (ordersError) throw ordersError;

      // Generate date intervals
      const dateIntervals = eachDayOfInterval({ start, end });

      // Process data by date
      const dataByDate = new Map<string, { revenue: number; expenses: number }>();

      dateIntervals.forEach(date => {
        const dateKey = format(date, 'MMM dd');
        dataByDate.set(dateKey, { revenue: 0, expenses: 0 });
      });

      // Calculate revenue and expenses
      orders?.forEach(order => {
        const dateKey = format(new Date(order.created_at), 'MMM dd');
        const current = dataByDate.get(dateKey) || { revenue: 0, expenses: 0 };

        // Revenue from completed orders
        if (['delivered', 'shipped', 'out_for_delivery', 'processing', 'confirmed'].includes(order.status)) {
          current.revenue += parseFloat(order.total_amount || '0');
        }

        // Expenses (shipping costs, returns, etc.)
        current.expenses += parseFloat(order.shipping_cost || '0');



        dataByDate.set(dateKey, current);
      });

      // Convert to array format
      const revenueExpenseData = Array.from(dataByDate.entries()).map(([date, values]) => ({
        date,
        revenue: Math.round(values.revenue),
        expenses: Math.round(values.expenses),
      }));

      // Calculate profit/loss data
      const profitLossData = revenueExpenseData.map(item => {
        const netAmount = item.revenue - item.expenses;
        return {
          date: item.date,
          profit: netAmount > 0 ? netAmount : 0,
          loss: netAmount < 0 ? Math.abs(netAmount) : 0,
        };
      });

      setData({
        revenueExpenseData,
        profitLossData,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Error fetching analytics data:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to fetch analytics data',
      }));
    }
  };

  return data;
}
