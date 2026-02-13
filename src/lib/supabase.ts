import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export type UserProfile = {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  role: 'customer' | 'admin';
  is_active: boolean;
  loyalty_coins_balance?: number;
  created_at: string;
  updated_at: string;
};

export type AdminUser = {
  id: string;
  user_id: string;
  admin_level: 'super_admin' | 'admin' | 'moderator';
  permissions: {
    products: boolean;
    orders: boolean;
    users: boolean;
    settings: boolean;
  };
  is_active: boolean;
  created_at: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  price: number;
  compare_at_price?: number;
  category_id?: string;
  sku?: string;
  stock_quantity: number;
  low_stock_threshold: number;
  is_featured: boolean;
  is_new_arrival: boolean;
  is_bestseller: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  category?: Category;
  product_images?: ProductImage[];
  product_variants?: ProductVariant[];
  loyalty_config?: ProductLoyaltyConfig;
  affiliate_config?: ProductAffiliateConfig;
  active_offer?: ProductOffer;
  available_sizes?: string[];
  available_colors?: { name: string; hex: string }[];
};

export type ProductImage = {
  id: string;
  product_id: string;
  image_url: string;
  alt_text?: string;
  display_order: number;
  is_primary: boolean;
  created_at: string;
};

export type ProductVariant = {
  id: string;
  product_id: string;
  size?: string;
  color?: string;
  color_code?: string;
  sku?: string;
  price?: number;
  stock_quantity: number;
  is_available: boolean;
  created_at: string;
};

export type ProductLoyaltyConfig = {
  id: string;
  product_id: string;
  is_enabled: boolean;
  coins_earned_per_purchase: number;
  coins_required_for_redemption: number;
  max_coins_usable_per_order: number;
  created_at: string;
  updated_at: string;
};

export type ProductAffiliateConfig = {
  id: string;
  product_id: string;
  is_enabled: boolean;
  commission_type: 'percentage' | 'fixed';
  commission_value: number;
  created_at: string;
  updated_at: string;
};

export type ProductOffer = {
  id: string;
  product_id: string;
  offer_type: 'percentage_discount' | 'flat_discount' | 'bogo';
  discount_value: number;
  start_date: string;
  end_date: string;
  banner_tag?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type AffiliateCoupon = {
  id: string;
  coupon_code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  affiliate_id?: string;
  expiry_date?: string;
  usage_limit?: number;
  times_used: number;
  is_active: boolean;
  created_at: string;
  // Relations
  affiliate?: {
    id: string;
    name: string;
    affiliate_code: string;
  };
};

export type Order = {
  id: string;
  order_number: string;
  user_id?: string;
  customer_name: string;
  customer_email?: string;
  customer_phone: string;
  shipping_address_line1: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip: string;
  subtotal: number;
  shipping_cost: number;
  discount_amount: number;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned';
  payment_status: 'pending' | 'paid' | 'partially_paid' | 'failed' | 'refunded';
  payment_method: 'cod' | 'online' | 'upi' | 'card' | 'netbanking' | 'wallet';
  created_at: string;
  updated_at: string;
  delivered_at?: string;
  // Relations
  order_items?: OrderItem[];
  shipment?: Shipment;
  return?: Return;
  user_profile?: UserProfile;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id?: string;
  product_name: string;
  product_image?: string;
  sku?: string;
  size?: string;
  color?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
};

export type Return = {
  id: string;
  order_id: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'pickup_scheduled' | 'picked_up' | 'refund_completed';
  refund_amount?: number;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
};

export type Shipment = {
  id: string;
  order_id: string;
  carrier?: string;
  tracking_number?: string;
  tracking_url?: string;
  weight?: number;
  dimensions?: any;
  status: 'pending' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed' | 'returned';
  created_at: string;
  shipped_at?: string;
  delivered_at?: string;
  shipping_notes?: string;
};

// Instagram Marketing Types
export type InstagramUser = {
  id: string;
  name: string;
  mobile_number: string;
  email: string;
  password_hash: string;
  instagram_username: string;
  instagram_profile_url?: string;
  followers_count: number;
  status: 'active' | 'inactive';
  total_coins_earned: number;
  available_coins: number;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
  created_by?: string;
};

export type InstagramCampaign = {
  id: string;
  campaign_title: string;
  description?: string;
  media_url: string;
  media_type: 'image' | 'video';
  thumbnail_url?: string;
  duration_hours: number;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  created_by?: string;
};

export type InstagramStoryAssignment = {
  id: string;
  campaign_id: string;
  instagram_user_id: string;
  assigned_date: string;
  expiry_date: string;
  status: 'assigned' | 'active' | 'completed' | 'expired' | 'cancelled';
  viewed_by_user: boolean;
  viewed_at?: string;
  completed_at?: string;
  reminder_sent: boolean;
  reminder_sent_at?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  assigned_by?: string;
  // Relations
  campaign?: InstagramCampaign;
  instagram_user?: InstagramUser;
};

export type InstagramCoinLog = {
  id: string;
  instagram_user_id: string;
  assignment_id?: string;
  coins_amount: number;
  transaction_type: 'earned' | 'bonus' | 'deducted' | 'redeemed';
  reason: string;
  balance_before: number;
  balance_after: number;
  created_at: string;
  assigned_by?: string;
  admin_notes?: string;
  // Relations
  instagram_user?: InstagramUser;
  assignment?: InstagramStoryAssignment;
};

export type InstagramNotification = {
  id: string;
  recipient_type: 'admin' | 'instagram_user';
  instagram_user_id?: string;
  admin_user_id?: string;
  notification_type: 'story_assigned' | 'story_expiring' | 'story_expired' | 'coins_assigned' | 'campaign_completed';
  title: string;
  message: string;
  reference_id?: string;
  reference_type?: string;
  action_url?: string;
  action_label?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
};
