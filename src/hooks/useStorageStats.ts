import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface StorageBreakdownItem {
  module: string;
  totalKB: number;
  totalMB: number;
  logCount: number;
}

export interface DailyUsageItem {
  day: string;
  totalKB: number;
  uploadCount: number;
  deleteCount: number;
}

export interface TopUsageItem {
  module: string;
  action: string;
  sizeKB: number;
  recordId: string | null;
  filePath: string | null;
  createdAt: string;
}

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
    sliders: number;
    websiteAssets: number;
    orders: number;
  };
  moduleBreakdown: StorageBreakdownItem[];
  dailyUsage: DailyUsageItem[];
  topUsage: TopUsageItem[];
  logsTotalKB: number;
  logsUploadCount: number;
  logsDeleteCount: number;
}

const DEFAULT_STATS: StorageStats = {
  totalStorage: 500,
  usedStorage: 0,
  remainingStorage: 500,
  usagePercentage: 0,
  breakdown: {
    productImages: 0,
    categoryImages: 0,
    avatars: 0,
    database: 0,
    sliders: 0,
    websiteAssets: 0,
    orders: 0,
  },
  moduleBreakdown: [],
  dailyUsage: [],
  topUsage: [],
  logsTotalKB: 0,
  logsUploadCount: 0,
  logsDeleteCount: 0,
};

export const useStorageStats = () => {
  const [stats, setStats] = useState<StorageStats>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStorageStats = useCallback(async () => {
    try {
      setLoading(true);

      // ============================================
      // 1. Fetch storage bucket sizes (actual files)
      // ============================================
      const bucketResults = await Promise.allSettled([
        supabase.storage.from('product-images').list('', { limit: 1000 }),
        supabase.storage.from('product-images').list('products', { limit: 1000 }),
        supabase.storage.from('category-images').list('', { limit: 1000 }),
        supabase.storage.from('category-images').list('categories', { limit: 1000 }),
        supabase.storage.from('avatars').list('', { limit: 1000 }),
        supabase.storage.from('website-assets').list('', { limit: 1000 }),
        supabase.storage.from('website-assets').list('sliders', { limit: 1000 }),
      ]);

      const calculateBucketSize = (
        result: PromiseSettledResult<{ data: any[] | null; error: any | null }>,
      ): number => {
        if (result.status === 'fulfilled' && result.value.data) {
          return result.value.data.reduce((total: number, file: any) => {
            return total + (file.metadata?.size || 0);
          }, 0);
        }
        return 0;
      };

      const productImgRoot = calculateBucketSize(bucketResults[0] as any);
      const productImgSub = calculateBucketSize(bucketResults[1] as any);
      const categoryImgRoot = calculateBucketSize(bucketResults[2] as any);
      const categoryImgSub = calculateBucketSize(bucketResults[3] as any);
      const avatarsSize = calculateBucketSize(bucketResults[4] as any);
      const websiteAssetsRoot = calculateBucketSize(bucketResults[5] as any);
      const slidersSize = calculateBucketSize(bucketResults[6] as any);

      const productImagesSize = (productImgRoot + productImgSub) / (1024 * 1024);
      const categoryImagesSize = (categoryImgRoot + categoryImgSub) / (1024 * 1024);
      const avatarsSizeMB = avatarsSize / (1024 * 1024);
      const slidersSizeMB = slidersSize / (1024 * 1024);
      const websiteAssetsSizeMB = websiteAssetsRoot / (1024 * 1024);

      // ============================================
      // 2. Estimate database size
      // ============================================
      const safeCount = async (table: string) => {
        try {
          const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
          if (error) throw error;
          return { count: count || 0 };
        } catch {
          return { count: 0 };
        }
      };

      const [products, orders, users, categories, orderItems, reviews] = await Promise.all([
        safeCount('products'),
        safeCount('orders'),
        safeCount('user_profiles'),
        safeCount('categories'),
        safeCount('order_items'),
        safeCount('product_reviews'),
      ]);

      const ordersSize = ((orders.count || 0) * 3 + ((orderItems as any).count || 0) * 1) / 1024; // MB

      const estimatedDatabaseSize =
        ((products.count || 0) * 2 +
          (users.count || 0) * 1.5 +
          (categories.count || 0) * 0.5 +
          ((reviews as any).count || 0) * 0.5) / 1024; // MB excluding orders

      // ============================================
      // 3. Fetch storage logs analytics (if table exists)
      // ============================================
      let moduleBreakdown: StorageBreakdownItem[] = [];
      let dailyUsage: DailyUsageItem[] = [];
      let topUsage: TopUsageItem[] = [];
      let logsTotalKB = 0;
      let logsUploadCount = 0;
      let logsDeleteCount = 0;

      try {
        // Module breakdown
        const { data: moduleData } = await supabase.rpc('get_storage_by_module');
        if (moduleData) {
          moduleBreakdown = moduleData.map((item: any) => ({
            module: item.module,
            totalKB: Number(item.total_kb) || 0,
            totalMB: (Number(item.total_kb) || 0) / 1024,
            logCount: Number(item.log_count) || 0,
          }));
        }

        // Daily usage (last 30 days)
        const { data: dailyData } = await supabase.rpc('get_daily_storage_usage', { days_back: 30 });
        if (dailyData) {
          dailyUsage = dailyData.map((item: any) => ({
            day: item.day,
            totalKB: Number(item.total_kb) || 0,
            uploadCount: Number(item.upload_count) || 0,
            deleteCount: Number(item.delete_count) || 0,
          }));
        }

        // Top storage consumers
        const { data: topData } = await supabase.rpc('get_top_storage_usage', { limit_count: 10 });
        if (topData) {
          topUsage = topData.map((item: any) => ({
            module: item.module,
            action: item.action,
            sizeKB: Number(item.size_kb) || 0,
            recordId: item.record_id,
            filePath: item.file_path,
            createdAt: item.created_at,
          }));
        }

        // Total from logs
        const { data: totalData } = await supabase.rpc('get_total_storage_from_logs');
        if (totalData && totalData.length > 0) {
          logsTotalKB = Number(totalData[0].total_kb) || 0;
          logsUploadCount = Number(totalData[0].total_uploads) || 0;
          logsDeleteCount = Number(totalData[0].total_deletes) || 0;
        }
      } catch {
        // storage_logs table not yet created — silently ignore
        console.warn('[useStorageStats] storage_logs RPCs not available yet. Run the SQL migration.');
      }

      // ============================================
      // 4. Calculate totals
      // ============================================
      const totalUsed =
        productImagesSize +
        categoryImagesSize +
        avatarsSizeMB +
        slidersSizeMB +
        websiteAssetsSizeMB +
        estimatedDatabaseSize +
        ordersSize; // Add orders here

      const totalStorage = 500; // Supabase free tier (500MB)
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
          avatars: avatarsSizeMB,
          database: estimatedDatabaseSize,
          sliders: slidersSizeMB,
          websiteAssets: websiteAssetsSizeMB,
          orders: ordersSize,
        },
        moduleBreakdown,
        dailyUsage,
        topUsage,
        logsTotalKB,
        logsUploadCount,
        logsDeleteCount,
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

    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchStorageStats, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchStorageStats]);

  return { stats, loading, error, refetch: fetchStorageStats };
};
