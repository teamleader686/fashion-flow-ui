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
      const { data: affiliate, error: affiliateError } = await supabase
        .from('affiliates')
        .insert({
          user_id: null, // Will be linked later when user logs in
          name: data.name,
          email: data.email,
          mobile: data.mobile,
          commission_type: data.commission_type,
          commission_value: data.commission_value,
          status: data.status,
        })
        .select()
        .single();

      if (affiliateError) throw affiliateError;

      return { success: true, data: affiliate };
    } catch (err: any) {
      setError(err.message);
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

  // Get current affiliate profile
  const getMyAffiliateProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('affiliates')
        .select('*')
        .eq('user_id', user.id)
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

  // Get my commissions
  const getMyCommissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: profile } = await getMyAffiliateProfile();
      if (!profile.success) throw new Error('Affiliate profile not found');

      const { data, error } = await supabase
        .from('affiliate_commissions')
        .select('*, orders(*)')
        .eq('affiliate_id', profile.data.id)
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
      const { data: profile } = await getMyAffiliateProfile();
      if (!profile.success) throw new Error('Affiliate profile not found');

      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('affiliate_id', profile.data.id)
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

      // Store in session/localStorage
      localStorage.setItem('affiliate_referral', referralCode);
    } catch (err) {
      console.error('Error tracking click:', err);
    }
  };

  // Get stored referral code
  const getStoredReferral = () => {
    return localStorage.getItem('affiliate_referral');
  };

  // Clear stored referral
  const clearStoredReferral = () => {
    localStorage.removeItem('affiliate_referral');
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
    getMyAffiliateProfile,
    getMyCommissions,
    getMyWalletTransactions,
    requestWithdrawal,
    // Tracking functions
    trackClick,
    getStoredReferral,
    clearStoredReferral,
  };
}
