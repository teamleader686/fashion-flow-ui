import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface StorageStats {
  totalStorage: number; // in MB
  usedStorage: number; // in MB
  remainingStorage: number; // in MB
  usagePercentage: number;
  breakdown: {
    productImages: number;
    categoryImages: number;
    avatars: number;
    database: number;
  };
}

export const useStorageStats = () => {
  const [stats, setStats] = useState<StorageStats>({
    totalStorage: 500, // Default 500MB for free tier
    usedStorage: 0,
    remainingStorage: 500,
    usagePercentage: 0,
    breakdown: {
      productImages: 0,
      categoryImages: 0,
      avatars: 0,
      database: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStorageStats = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch storage bucket sizes
      const [productImagesResult, categoryImagesResult, avatarsResult] = await Promise.allSettled([
        supabase.storage.from('product-images').list(),
        supabase.storage.from('category-images').list(),
        supabase.storage.from('avatars').list(),
      ]);

      // Calculate storage for each bucket
      const calculateBucketSize = (result: any): number => {
        if (result.status === 'fulfilled' && result.value.data) {
          return result.value.data.reduce((total: number, file: any) => {
            return total + (file.metadata?.size || 0);
          }, 0);
        }
        return 0;
      };

      const productImagesSize = calculateBucketSize(productImagesResult) / (1024 * 1024); // Convert to MB
      const categoryImagesSize = calculateBucketSize(categoryImagesResult) / (1024 * 1024);
      const avatarsSize = calculateBucketSize(avatarsResult) / (1024 * 1024);

      // Estimate database size (approximate based on row counts)
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      const { count: usersCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });

      // Rough estimate: 1KB per product, 2KB per order, 1KB per user
      const estimatedDatabaseSize =
        ((productsCount || 0) * 1 + (ordersCount || 0) * 2 + (usersCount || 0) * 1) / 1024; // in MB

      const totalUsed = productImagesSize + categoryImagesSize + avatarsSize + estimatedDatabaseSize;
      const totalStorage = 500; // Supabase free tier default
      const remaining = Math.max(0, totalStorage - totalUsed);
      const percentage = Math.min(100, (totalUsed / totalStorage) * 100);

      setStats({
        totalStorage,
        usedStorage: totalUsed,
        remainingStorage: remaining,
        usagePercentage: percentage,
        breakdown: {
          productImages: productImagesSize,
          categoryImages: categoryImagesSize,
          avatars: avatarsSize,
          database: estimatedDatabaseSize,
        },
      });

      setError(null);
    } catch (err: any) {
      console.error('Error fetching storage stats:', err);
      setError(err.message);
      toast.error('Failed to load storage statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStorageStats();

    // Refresh every 5 minutes
    const interval = setInterval(fetchStorageStats, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchStorageStats]);

  return { stats, loading, error, refetch: fetchStorageStats };
};
