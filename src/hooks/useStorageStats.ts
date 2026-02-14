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
      // Note: This only lists files at the root level. For recursive listing, a more complex solution is needed.
      const [productImagesResult, categoryImagesResult, avatarsResult] = await Promise.allSettled([
        supabase.storage.from('product-images').list('', { limit: 1000 }), // Increased limit
        supabase.storage.from('category-images').list('', { limit: 1000 }),
        supabase.storage.from('avatars').list('', { limit: 1000 }),
      ]);

      // Calculate storage for each bucket
      const calculateBucketSize = (result: PromiseSettledResult<{ data: any[] | null; error: any | null }>, bucketName: string): number => {
        if (result.status === 'fulfilled') {
          if (result.value.error) {
            console.warn(`Error listing bucket ${bucketName}:`, result.value.error);
            return 0;
          }
          if (result.value.data) {
            return result.value.data.reduce((total: number, file: any) => {
              return total + (file.metadata?.size || 0);
            }, 0);
          }
        } else {
          console.error(`Failed to list bucket ${bucketName}:`, result.reason);
        }
        return 0;
      };

      const productImagesSize = calculateBucketSize(productImagesResult as any, 'product-images') / (1024 * 1024); // Convert to MB
      const categoryImagesSize = calculateBucketSize(categoryImagesResult as any, 'category-images') / (1024 * 1024);
      const avatarsSize = calculateBucketSize(avatarsResult as any, 'avatars') / (1024 * 1024);

      // Estimate database size (approximate based on row counts)
      // Using Promise.all for parallel fetching
      const [products, orders, users] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('user_profiles').select('*', { count: 'exact', head: true }) // Using user_profiles as per schema
      ]);

      const productsCount = products.count || 0;
      const ordersCount = orders.count || 0;
      const usersCount = users.count || 0;

      // Log errors if any
      if (products.error) console.error('Error counting products:', products.error);
      if (orders.error) console.error('Error counting orders:', orders.error);
      if (users.error) console.error('Error counting profiles:', users.error);

      // Rough estimate: 1KB per product, 2KB per order, 1KB per user
      const estimatedDatabaseSize =
        (productsCount * 1 + ordersCount * 2 + usersCount * 1) / 1024; // in MB

      const totalUsed = productImagesSize + categoryImagesSize + avatarsSize + estimatedDatabaseSize;
      const totalStorage = 500; // Supabase free tier default
      const remaining = Math.max(0, totalStorage - totalUsed);
      const percentage = totalStorage > 0 ? Math.min(100, (totalUsed / totalStorage) * 100) : 0;

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
