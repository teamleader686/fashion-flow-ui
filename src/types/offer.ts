// Offer Types

export type OfferType = 'flat' | 'percentage' | 'bogo' | 'flash_sale' | 'category';
export type ScopeType = 'all' | 'products' | 'categories';
export type OfferStatus = 'active' | 'inactive' | 'scheduled' | 'expired';

export interface Offer {
  id: string;
  title: string;
  type: OfferType;
  discount_value: number;
  max_discount: number | null;
  min_order_amount: number;
  scope_type: ScopeType;
  start_datetime: string;
  end_datetime: string;
  badge_text: string;
  badge_color: string;
  status: OfferStatus;
  priority: number;
  stock_limit: number | null;
  stock_remaining: number | null;
  total_usage_count: number;
  total_discount_given: number;
  total_revenue: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface OfferProduct {
  id: string;
  offer_id: string;
  product_id: string;
  created_at: string;
}

export interface OfferCategory {
  id: string;
  offer_id: string;
  category_id: string;
  created_at: string;
}

export interface OfferAnalytics {
  id: string;
  offer_id: string;
  date: string;
  views: number;
  clicks: number;
  conversions: number;
  revenue: number;
  discount_given: number;
  created_at: string;
}

export interface OfferFormData {
  title: string;
  type: OfferType;
  discount_value: number;
  max_discount: number | null;
  min_order_amount: number;
  scope_type: ScopeType;
  start_datetime: string;
  end_datetime: string;
  badge_text: string;
  badge_color: string;
  status: OfferStatus;
  priority: number;
  stock_limit: number | null;
  product_ids: string[];
  category_ids: string[];
}

export interface ProductOffer {
  offer_id: string;
  title: string;
  type: OfferType;
  discount_value: number;
  max_discount: number | null;
  badge_text: string;
  badge_color: string;
  end_datetime: string;
  stock_remaining: number | null;
  priority: number;
}

export interface OfferPrice {
  original_price: number;
  offer_price: number;
  discount_amount: number;
  discount_percentage: number;
  has_offer: boolean;
  offer?: ProductOffer;
}
