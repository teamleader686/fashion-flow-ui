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
    const { data: user } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('coupons')
      .insert([{
        ...couponData,
        code: couponData.code.toUpperCase(),
        created_by: user.user?.id
      }])
      .select()
      .single();

    if (error) throw error;
    await fetchCoupons();
    return data;
  };

  const updateCoupon = async (id: string, couponData: Partial<CouponFormData>) => {
    const { data, error } = await supabase
      .from('coupons')
      .update({
        ...couponData,
        code: couponData.code?.toUpperCase()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
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
    productIds: string[]
  ): Promise<CouponValidationResult> => {
    try {
      setValidating(true);

      const { data, error } = await supabase.rpc('validate_coupon', {
        p_code: code,
        p_user_id: userId,
        p_cart_total: cartTotal,
        p_product_ids: productIds
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
    discountAmount: number
  ) => {
    const { data, error } = await supabase.rpc('apply_coupon', {
      p_coupon_id: couponId,
      p_user_id: userId,
      p_order_id: orderId,
      p_discount_amount: discountAmount
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
