import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type {
  Affiliate,
  AffiliateOrder,
  AffiliateCommission,
  AffiliateWithdrawal,
  WalletTransaction,
  AffiliateStats,
  AffiliateFormData
} from '@/types/affiliate';

export function useAffiliateMarketing() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // ============================================
  // ADMIN FUNCTIONS
  // ============================================

  // Create new affiliate (without auth user - admin will create manually)
  const createAffiliate = async (data: AffiliateFormData) => {
    setLoading(true);
    setError(null);
    try {
      // Create affiliate record directly (without auth user)
      // Admin can manually create auth user later if needed
      // Generate unique referral code
      const referralCode = 'REF' + Math.random().toString(36).substring(2, 8).toUpperCase();

      const { data: affiliate, error: affiliateError } = await supabase
        .from('affiliates')
        .insert({
          user_id: null, // Will be linked later when user logs in
          name: data.name,
          email: data.email,
          mobile: data.mobile,
          referral_code: referralCode,
          commission_type: data.commission_type,
          commission_value: data.commission_value,
          status: data.status,
          // Removed password as it is not in the schema
        })
        .select()
        .single();

      if (affiliateError) throw affiliateError;

      return { success: true, data: affiliate };
    } catch (err: any) {
      console.error('Create affiliate error:', err);
      if (err.message?.includes('duplicate key') || err.code === '23505') {
        if (err.message?.includes('email')) {
          return { success: false, error: 'This email is already registered as an affiliate.' };
        }
        if (err.message?.includes('mobile')) {
          return { success: false, error: 'This mobile number is already registered.' };
        }
        if (err.message?.includes('referral_code')) {
          return { success: false, error: 'Referral code collision. Please try again.' };
        }
        return { success: false, error: 'This affiliate already exists (duplicate email or mobile).' };
      }
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Get all affiliates
  const getAffiliates = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('affiliates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Update affiliate
  const updateAffiliate = async (id: string, updates: Partial<Affiliate>) => {
    setLoading(true);
    setError(null);
    try {
      // Remove fields that shouldn't be updated directly
      const {
        total_clicks,
        total_orders,
        total_sales,
        total_commission,
        created_at,
        updated_at,
        referral_code, // Don't allow changing referral code
        ...safeUpdates
      } = updates;

      const { data, error } = await supabase
        .from('affiliates')
        .update(safeUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (err: any) {
      console.error('Update error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Delete affiliate
  const deleteAffiliate = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('affiliates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Get affiliate statistics
  const getAffiliateStats = async (): Promise<AffiliateStats> => {
    try {
      const { data: affiliates } = await supabase
        .from('affiliates')
        .select('*');

      const { data: commissions } = await supabase
        .from('affiliate_commissions')
        .select('*');

      const totalAffiliates = affiliates?.length || 0;
      const activeAffiliates = affiliates?.filter(a => a.status === 'active').length || 0;
      const totalClicks = affiliates?.reduce((sum, a) => sum + (a.total_clicks || 0), 0) || 0;
      const totalOrders = affiliates?.reduce((sum, a) => sum + (a.total_orders || 0), 0) || 0;
      const totalSales = affiliates?.reduce((sum, a) => sum + (a.total_sales || 0), 0) || 0;
      const totalCommission = affiliates?.reduce((sum, a) => sum + (a.total_commission || 0), 0) || 0;
      const pendingCommission = commissions?.filter(c => c.status === 'pending')
        .reduce((sum, c) => sum + c.commission_amount, 0) || 0;
      const paidCommission = commissions?.filter(c => c.status === 'paid')
        .reduce((sum, c) => sum + c.commission_amount, 0) || 0;

      return {
        totalAffiliates,
        activeAffiliates,
        totalClicks,
        totalOrders,
        totalSales,
        totalCommission,
        pendingCommission,
        paidCommission,
      };
    } catch (err) {
      return {
        totalAffiliates: 0,
        activeAffiliates: 0,
        totalClicks: 0,
        totalOrders: 0,
        totalSales: 0,
        totalCommission: 0,
        pendingCommission: 0,
        paidCommission: 0,
      };
    }
  };

  // Get affiliate orders
  const getAffiliateOrders = async (affiliateId?: string) => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('affiliate_orders')
        .select('*, orders(*), affiliates(name, referral_code)')
        .order('created_at', { ascending: false });

      if (affiliateId) {
        query = query.eq('affiliate_id', affiliateId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return { success: true, data };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Approve commission
  const approveCommission = async (commissionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('affiliate_commissions')
        .update({ status: 'approved', approved_at: new Date().toISOString() })
        .eq('id', commissionId);

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Pay commission (credit to wallet)
  const payCommission = async (affiliateOrderId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.rpc('process_commission_payment', {
        p_affiliate_order_id: affiliateOrderId
      });

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // AFFILIATE USER FUNCTIONS
  // ============================================


  // Affiliate Login
  const affiliateLogin = async (mobile: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('affiliates')
        .select('*')
        .eq('mobile', mobile)
        .eq('password', password) // Note: In production, use hashed password comparison on server side
        .single();

      if (error || !data) {
        throw new Error('Invalid mobile number or password');
      }

      if (data.status !== 'active') {
        throw new Error('Your account is inactive. Please contact admin.');
      }

      // Save session locally
      localStorage.setItem('affiliate_user', JSON.stringify(data));

      return { success: true, data };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Get current affiliate profile
  const getMyAffiliateProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Check for local affiliate session (manual login)
      const localSession = localStorage.getItem('affiliate_user');
      if (localSession) {
        const affiliate = JSON.parse(localSession);
        // Verify if still valid/active by fetching fresh data
        const { data, error } = await supabase
          .from('affiliates')
          .select('*')
          .eq('id', affiliate.id)
          .single();

        if (!error && data) {
          // Update local storage with fresh data
          localStorage.setItem('affiliate_user', JSON.stringify(data));
          return { success: true, data };
        }
      }

      // 2. Fallback to Supabase Auth (Google Login)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Determine if we should throw error or just return null
        // For dashboard, we might want null to trigger redirect
        return { success: false, error: 'Not authenticated' };
      }

      const { data, error } = await supabase
        .from('affiliates')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (err: any) {
      // Don't set global error for profile fetch failure as it might just mean not logged in
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Get my commissions
  const getMyCommissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const profileRes = await getMyAffiliateProfile();
      if (!profileRes.success || !profileRes.data) throw new Error('Affiliate profile not found');

      const { data, error } = await supabase
        .from('affiliate_commissions')
        .select('*, orders(*)')
        .eq('affiliate_id', profileRes.data.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Get my wallet transactions
  const getMyWalletTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const profileRes = await getMyAffiliateProfile();
      if (!profileRes.success || !profileRes.data) throw new Error('Affiliate profile not found');

      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('affiliate_id', profileRes.data.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Get my withdrawals
  const getMyWithdrawals = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: profileRes } = await getMyAffiliateProfile();
      if (!profileRes?.success || !profileRes?.data) throw new Error('Affiliate profile not found');

      const { data, error } = await supabase
        .from('affiliate_withdrawals')
        .select('*')
        .eq('affiliate_id', profileRes.data.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Request withdrawal
  const requestWithdrawal = async (amount: number, paymentMethod: string, paymentDetails: any) => {
    setLoading(true);
    setError(null);
    try {
      const { data: profile } = await getMyAffiliateProfile();
      if (!profile.success) throw new Error('Affiliate profile not found');

      if (amount > profile.data.wallet_balance) {
        throw new Error('Insufficient wallet balance');
      }

      const { data, error } = await supabase
        .from('affiliate_withdrawals')
        .insert({
          affiliate_id: profile.data.id,
          amount,
          payment_method: paymentMethod,
          payment_details: paymentDetails,
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // TRACKING FUNCTIONS
  // ============================================

  // Track referral click
  const trackClick = async (referralCode: string) => {
    try {
      // Get affiliate by referral code
      const { data: affiliate } = await supabase
        .from('affiliates')
        .select('id')
        .eq('referral_code', referralCode)
        .eq('status', 'active')
        .single();

      if (!affiliate) return;

      // Insert click record
      await supabase.from('affiliate_clicks').insert({
        affiliate_id: affiliate.id,
        ip_address: '', // Can be populated from server
        user_agent: navigator.userAgent,
        referrer: document.referrer,
        landing_page: window.location.href,
      });

      // Update click count
      await supabase.rpc('increment', {
        table_name: 'affiliates',
        row_id: affiliate.id,
        column_name: 'total_clicks'
      });

      // Store in session/localStorage (use consistent key with useAffiliateTracker)
      localStorage.setItem('affiliate_referral_code', referralCode);

      // If user is logged in, link to their profile persistently
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Only update if they don't already have an affiliate assigned
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('referred_by_affiliate')
          .eq('user_id', user.id)
          .single();

        if (profile && !profile.referred_by_affiliate) {
          await supabase
            .from('user_profiles')
            .update({ referred_by_affiliate: affiliate.id })
            .eq('user_id', user.id);
        }
      }
    } catch (err) {
      console.error('Error tracking click:', err);
    }
  };

  // Get stored referral code
  const getStoredReferral = () => {
    return localStorage.getItem('affiliate_referral_code');
  };

  // Clear stored referral
  const clearStoredReferral = () => {
    localStorage.removeItem('affiliate_referral_code');
    localStorage.removeItem('affiliate_referral_time');
    localStorage.removeItem('affiliate_ref_product_id');
  };

  // Get assigned products (Auto Assignment: All enabled products)
  const getAssignedProducts = async () => {
    const localSession = localStorage.getItem('affiliate_user');
    if (!localSession) return { success: false, error: 'Not logged in' };

    setLoading(true);
    try {
      // Fetch ALL products that are affiliate enabled
      // We join product_images to get the main image
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          product_name,
          price,
          selling_price,
          slug,
          product_images (
            image_url,
            is_primary,
            display_order
          )
        `)
        .eq('is_active', true)
        // If the column exists, filter by it. If running on old schema without column, this might fail unless column added.
        // We added it in schema script.
        //.eq('affiliate_enabled', true) 
        .order('created_at', { ascending: false });

      if (error) throw error;

      const products = data?.map((prod: any) => {
        // Process images from relation
        const images = prod.product_images
          ?.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
          .map((img: any) => img.image_url) || [];

        // Return standardized object
        return {
          id: prod.id,
          product_name: prod.product_name || prod.name || 'Untitled Product', // Fallback
          selling_price: prod.selling_price || prod.price || 0, // Fallback
          slug: prod.slug,
          images: images.length > 0 ? images : ['/placeholder.svg'],
        };
      }) || [];

      return { success: true, data: products };
    } catch (err: any) {
      console.error('Error fetching assigned products:', err);
      // Fallback: Return empty list rather than crash if column missing
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Get my coupons
  const getMyCoupons = async () => {
    const localSession = localStorage.getItem('affiliate_user');
    if (!localSession) return { success: false, error: 'Not logged in' };
    const affiliate = JSON.parse(localSession);

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('affiliate_user_id', affiliate.id)
        .eq('is_affiliate_coupon', true)
        .eq('status', 'active');

      if (error) throw error;
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Create affiliate coupon
  const createAffiliateCoupon = async (couponData: {
    code: string;
    discount_type: 'percentage' | 'fixed_amount';
    discount_value: number;
    min_purchase_amount?: number;
    max_discount_amount?: number;
    valid_from?: string;
    valid_until?: string;
    is_active?: boolean;
  }) => {
    const localSession = localStorage.getItem('affiliate_user');
    if (!localSession) return { success: false, error: 'Not logged in' };
    const affiliate = JSON.parse(localSession);

    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('coupons')
        .insert({
          code: couponData.code,
          type: couponData.discount_type === 'fixed_amount' ? 'flat' : 'percentage',
          value: couponData.discount_value,
          min_order_amount: couponData.min_purchase_amount || 0,
          max_discount: couponData.max_discount_amount || null,
          start_date: couponData.valid_from || new Date().toISOString(),
          expiry_date: couponData.valid_until || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: couponData.is_active === false ? 'inactive' : 'active',
          affiliate_user_id: affiliate.id,
          is_affiliate_coupon: true,
          coupon_type: 'affiliate_tracking'
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    // Admin functions
    createAffiliate,
    getAffiliates,
    updateAffiliate,
    deleteAffiliate,
    getAffiliateStats,
    getAffiliateOrders,
    approveCommission,
    payCommission,
    // Affiliate functions
    affiliateLogin,
    getMyAffiliateProfile,
    getMyCommissions,
    getMyWalletTransactions,
    getMyWithdrawals,
    requestWithdrawal,
    getAssignedProducts,
    getMyCoupons,
    createAffiliateCoupon,
    // Tracking functions
    trackClick,
    getStoredReferral,
    clearStoredReferral,
  };
}
