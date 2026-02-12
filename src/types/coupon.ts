// Coupon Types

export type CouponType = 'flat' | 'percentage';
export type ApplicableType = 'all' | 'products' | 'categories';
export type UserRestriction = 'all' | 'new' | 'specific';
export type CouponStatus = 'active' | 'inactive';

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  min_order_amount: number;
  max_discount: number | null;
  start_date: string;
  expiry_date: string;
  usage_limit: number | null;
  usage_per_user: number;
  applicable_type: ApplicableType;
  applicable_ids: string[] | null;
  user_restriction: UserRestriction;
  restricted_user_ids: string[] | null;
  status: CouponStatus;
  total_usage_count: number;
  total_discount_given: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CouponUsage {
  id: string;
  coupon_id: string;
  user_id: string;
  order_id: string;
  discount_amount: number;
  used_at: string;
}

export interface CouponFormData {
  code: string;
  type: CouponType;
  value: number;
  min_order_amount: number;
  max_discount: number | null;
  start_date: string;
  expiry_date: string;
  usage_limit: number | null;
  usage_per_user: number;
  applicable_type: ApplicableType;
  applicable_ids: string[];
  user_restriction: UserRestriction;
  restricted_user_ids: string[];
  status: CouponStatus;
}

export interface CouponValidationResult {
  valid: boolean;
  error?: string;
  coupon_id?: string;
  code?: string;
  type?: CouponType;
  discount?: number;
  final_amount?: number;
}
