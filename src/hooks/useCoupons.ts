import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Coupon, CouponFormData, CouponValidationResult, CouponUsage } from '@/types/coupon';

export function useCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const createCoupon = async (couponData: CouponFormData) => {
    const { data: { user } } = await supabase.auth.getUser();

    const dataToInsert = {
      code: couponData.code.toUpperCase(),
      type: couponData.type,
      value: couponData.value,
      min_order_amount: couponData.min_order_amount,
      max_discount: couponData.max_discount,
      start_date: couponData.start_date,
      expiry_date: couponData.expiry_date,
      usage_limit: couponData.usage_limit,
      usage_per_user: couponData.usage_per_user,
      applicable_type: couponData.applicable_type,
      applicable_ids: couponData.applicable_ids.length > 0 ? couponData.applicable_ids : null,
      user_restriction: couponData.user_restriction,
      restricted_user_ids: couponData.restricted_user_ids.length > 0 ? couponData.restricted_user_ids : null,
      status: couponData.status,
      created_by: user?.id || null,
      // Affiliate fields
      is_affiliate_coupon: couponData.is_affiliate_coupon,
      affiliate_user_id: couponData.affiliate_user_id || null,
      coupon_type: couponData.coupon_type,
      commission_type: couponData.commission_type,
      commission_value: couponData.commission_value
    };

    const { data, error } = await supabase
      .from('coupons')
      .insert([dataToInsert])
      .select()
      .single();

    if (error) {
      console.error('Coupon creation error:', error);
      throw error;
    }
    await fetchCoupons();
    return data;
  };

  const updateCoupon = async (id: string, couponData: Partial<CouponFormData>) => {
    const dataToUpdate: any = { ...couponData };
    if (dataToUpdate.code) {
      dataToUpdate.code = dataToUpdate.code.toUpperCase();
    }

    // Ensure array fields are handled
    if (dataToUpdate.applicable_ids) {
      dataToUpdate.applicable_ids = dataToUpdate.applicable_ids.length > 0 ? dataToUpdate.applicable_ids : null;
    }
    if (dataToUpdate.restricted_user_ids) {
      dataToUpdate.restricted_user_ids = dataToUpdate.restricted_user_ids.length > 0 ? dataToUpdate.restricted_user_ids : null;
    }

    const { data, error } = await supabase
      .from('coupons')
      .update(dataToUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Coupon update error:', error);
      throw error;
    }
    await fetchCoupons();
    return data;
  };

  const deleteCoupon = async (id: string) => {
    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await fetchCoupons();
  };

  return {
    coupons,
    loading,
    error,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    refetch: fetchCoupons
  };
}

export function useValidateCoupon() {
  const [validating, setValidating] = useState(false);

  const validateCoupon = async (
    code: string,
    userId: string,
    cartTotal: number,
    productIds: string[],
    appliedCouponCodes: string[] = []
  ): Promise<CouponValidationResult> => {
    try {
      setValidating(true);

      const { data, error } = await supabase.rpc('validate_coupon_v2', {
        p_code: code,
        p_user_id: userId === "" ? null : userId,
        p_cart_total: cartTotal,
        p_product_ids: productIds,
        p_applied_coupon_codes: appliedCouponCodes
      });

      if (error) throw error;
      return data as CouponValidationResult;
    } catch (err: any) {
      return {
        valid: false,
        error: err.message || 'Failed to validate coupon'
      };
    } finally {
      setValidating(false);
    }
  };

  return { validateCoupon, validating };
}

export function useApplyCoupon() {
  const applyCoupon = async (
    couponId: string,
    userId: string,
    orderId: string,
    discountAmount: number,
    commissionAmount: number = 0,
    affiliateId: string | null = null
  ) => {
    const { data, error } = await supabase.rpc('apply_coupon_v2', {
      p_coupon_id: couponId,
      p_user_id: userId,
      p_order_id: orderId,
      p_discount_amount: discountAmount,
      p_commission_amount: commissionAmount,
      p_affiliate_id: affiliateId
    });

    if (error) throw error;
    return data;
  };

  return { applyCoupon };
}

export function useCouponUsages(couponId?: string) {
  const [usages, setUsages] = useState<CouponUsage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsages = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('coupon_usages')
        .select('*')
        .order('used_at', { ascending: false });

      if (couponId) {
        query = query.eq('coupon_id', couponId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setUsages(data || []);
    } catch (err) {
      console.error('Error fetching coupon usages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsages();
  }, [couponId]);

  return { usages, loading, refetch: fetchUsages };
}
