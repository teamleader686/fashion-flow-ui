import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface ModuleStats {
  // Product Management
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;

  // Category Management
  totalCategories: number;
  activeCategories: number;

  // Affiliate Management
  totalAffiliates: number;
  activeAffiliates: number;
  pendingAffiliates: number;

  // Instagram Campaigns
  totalCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;

  // Customer Data
  totalCustomers: number;
  activeCustomers: number;

  // Shipping Management
  totalShipments: number;
  pendingShipments: number;
  deliveredShipments: number;

  // Cancellation Management
  totalCancellations: number;
  approvedCancellations: number;
  rejectedCancellations: number;

  // Coupon Management
  totalCoupons: number;
  activeCoupons: number;
  expiredCoupons: number;

  // Offer Management
  totalOffers: number;
  activeOffers: number;
  expiredOffers: number;

  // Wallet / Loyalty
  totalWalletUsers: number;
  totalLoyaltyCoinsIssued: number;
  totalCoinsRedeemed: number;
}

export const useModuleStats = () => {
  const [stats, setStats] = useState<ModuleStats>({
    totalProducts: 0,
    activeProducts: 0,
    inactiveProducts: 0,
    totalCategories: 0,
    activeCategories: 0,
    totalAffiliates: 0,
    activeAffiliates: 0,
    pendingAffiliates: 0,
    totalCampaigns: 0,
    activeCampaigns: 0,
    completedCampaigns: 0,
    totalCustomers: 0,
    activeCustomers: 0,
    totalShipments: 0,
    pendingShipments: 0,
    deliveredShipments: 0,
    totalCancellations: 0,
    approvedCancellations: 0,
    rejectedCancellations: 0,
    totalCoupons: 0,
    activeCoupons: 0,
    expiredCoupons: 0,
    totalOffers: 0,
    activeOffers: 0,
    expiredOffers: 0,
    totalWalletUsers: 0,
    totalLoyaltyCoinsIssued: 0,
    totalCoinsRedeemed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch all module stats in parallel
      const [
        // Products
        totalProductsResult,
        activeProductsResult,
        inactiveProductsResult,

        // Categories
        totalCategoriesResult,
        activeCategoriesResult,

        // Affiliates
        totalAffiliatesResult,
        activeAffiliatesResult,
        pendingAffiliatesResult,

        // Instagram Campaigns
        totalCampaignsResult,
        activeCampaignsResult,
        completedCampaignsResult,

        // Customers
        totalCustomersResult,

        // Shipments
        totalShipmentsResult,
        pendingShipmentsResult,
        deliveredShipmentsResult,

        // Cancellations
        totalCancellationsResult,
        approvedCancellationsResult,
        rejectedCancellationsResult,

        // Coupons
        totalCouponsResult,
        activeCouponsResult,
        expiredCouponsResult,

        // Offers
        totalOffersResult,
        activeOffersResult,
        expiredOffersResult,

        // Loyalty
        totalWalletUsersResult,
        loyaltyIssuedResult,
        loyaltyRedeemedResult,
      ] = await Promise.all([
        // Products
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', false),

        // Categories
        supabase.from('categories').select('id', { count: 'exact', head: true }),
        supabase.from('categories').select('id', { count: 'exact', head: true }).eq('is_active', true),

        // Affiliates - Temporarily disabled
        Promise.resolve({ count: 0, data: [], error: null }),
        Promise.resolve({ count: 0, data: [], error: null }),
        Promise.resolve({ count: 0, data: [], error: null }),

        // Instagram Campaigns
        supabase.from('instagram_campaigns').select('id', { count: 'exact', head: true }),
        supabase.from('instagram_campaigns').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('instagram_campaigns').select('id', { count: 'exact', head: true }).eq('status', 'completed'),

        // Customers
        supabase.from('user_profiles').select('id', { count: 'exact', head: true }),

        // Shipments
        supabase.from('shipments').select('id', { count: 'exact', head: true }),
        supabase.from('shipments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('shipments').select('id', { count: 'exact', head: true }).eq('status', 'delivered'),

        // Cancellations
        supabase.from('cancellation_requests').select('id', { count: 'exact', head: true }),
        supabase.from('cancellation_requests').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('cancellation_requests').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),

        // Coupons - Temporarily disabled
        Promise.resolve({ count: 0, data: [], error: null }),
        Promise.resolve({ count: 0, data: [], error: null }),
        Promise.resolve({ count: 0, data: [], error: null }),

        // Offers - Temporarily disabled
        Promise.resolve({ count: 0, data: [], error: null }),
        Promise.resolve({ count: 0, data: [], error: null }),
        Promise.resolve({ count: 0, data: [], error: null }),

        // Loyalty - Temporarily disabled
        Promise.resolve({ count: 0, data: [], error: null }),
        Promise.resolve({ data: [], error: null }),
        Promise.resolve({ data: [], error: null }),
      ]);

      // Calculate loyalty totals - Temporarily set to 0
      const totalLoyaltyCoinsIssued = 0;
      const totalCoinsRedeemed = 0;

      setStats({
        // Products
        totalProducts: totalProductsResult.count || 0,
        activeProducts: activeProductsResult.count || 0,
        inactiveProducts: inactiveProductsResult.count || 0,

        // Categories
        totalCategories: totalCategoriesResult.count || 0,
        activeCategories: activeCategoriesResult.count || 0,

        // Affiliates
        totalAffiliates: totalAffiliatesResult.count || 0,
        activeAffiliates: activeAffiliatesResult.count || 0,
        pendingAffiliates: pendingAffiliatesResult.count || 0,

        // Campaigns
        totalCampaigns: totalCampaignsResult.count || 0,
        activeCampaigns: activeCampaignsResult.count || 0,
        completedCampaigns: completedCampaignsResult.count || 0,

        // Customers
        totalCustomers: totalCustomersResult.count || 0,
        activeCustomers: totalCustomersResult.count || 0,

        // Shipments
        totalShipments: totalShipmentsResult.count || 0,
        pendingShipments: pendingShipmentsResult.count || 0,
        deliveredShipments: deliveredShipmentsResult.count || 0,

        // Cancellations
        totalCancellations: totalCancellationsResult.count || 0,
        approvedCancellations: approvedCancellationsResult.count || 0,
        rejectedCancellations: rejectedCancellationsResult.count || 0,

        // Coupons
        totalCoupons: totalCouponsResult.count || 0,
        activeCoupons: activeCouponsResult.count || 0,
        expiredCoupons: expiredCouponsResult.count || 0,

        // Offers
        totalOffers: totalOffersResult.count || 0,
        activeOffers: activeOffersResult.count || 0,
        expiredOffers: expiredOffersResult.count || 0,

        // Loyalty
        totalWalletUsers: totalWalletUsersResult.count || 0,
        totalLoyaltyCoinsIssued,
        totalCoinsRedeemed,
      });

      setError(null);
    } catch (err: any) {
      console.error('Error fetching module stats:', err);
      setError(err.message);
      toast.error('Failed to load module statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();

    // Setup real-time subscriptions for automatic updates
    const channels: any[] = [];

    // Subscribe to all relevant tables
    const tables = [
      'products',
      'categories',
      'affiliate_users',
      'instagram_campaigns',
      'user_profiles',
      'shipments',
      'cancellation_requests',
      'coupons',
      'offers',
      'loyalty_transactions',
    ];

    tables.forEach((table) => {
      const channel = supabase
        .channel(`${table}_changes`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table },
          () => {
            fetchStats();
          }
        )
        .subscribe();

      channels.push(channel);
    });

    return () => {
      channels.forEach((channel) => channel.unsubscribe());
    };
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
};
