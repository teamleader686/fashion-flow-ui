// Centralized Notification Types

export type NotificationModule = 
  | 'order' 
  | 'shipping' 
  | 'instagram' 
  | 'affiliate' 
  | 'system';

export type NotificationRole = 'admin' | 'user' | 'affiliate' | 'instagram_user';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export type NotificationStatus = 'unread' | 'read' | 'archived';

// Order Notification Types
export type OrderNotificationType =
  | 'order_placed'
  | 'order_confirmed'
  | 'order_processing'
  | 'order_shipped'
  | 'order_delivered'
  | 'order_cancelled'
  | 'order_returned'
  | 'return_approved'
  | 'return_rejected'
  | 'refund_completed';

// Shipping Notification Types
export type ShippingNotificationType =
  | 'courier_assigned'
  | 'tracking_generated'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'delivery_failed'
  | 'shipping_delayed'
  | 'return_pickup_scheduled';

// Instagram Notification Types
export type InstagramNotificationType =
  | 'campaign_created'
  | 'campaign_started'
  | 'campaign_ended'
  | 'campaign_milestone'
  | 'story_assigned'
  | 'story_completed'
  | 'coins_earned'
  | 'instagram_order_tracked'
  | 'instagram_offer_applied';

// Affiliate Notification Types
export type AffiliateNotificationType =
  | 'commission_earned'
  | 'commission_approved'
  | 'commission_rejected'
  | 'payout_processed'
  | 'payout_requested'
  | 'coupon_used'
  | 'affiliate_registered'
  | 'affiliate_milestone';

export type NotificationType =
  | OrderNotificationType
  | ShippingNotificationType
  | InstagramNotificationType
  | AffiliateNotificationType
  | 'system_update';

export interface Notification {
  id: string;
  user_id: string;
  role: NotificationRole;
  module: NotificationModule;
  type: NotificationType;
  title: string;
  message: string;
  status: NotificationStatus;
  priority: NotificationPriority;
  reference_id?: string; // Order ID, Shipment ID, Campaign ID, etc.
  reference_type?: string; // 'order', 'shipment', 'campaign', etc.
  action_url?: string;
  action_label?: string;
  metadata?: Record<string, any>;
  created_at: string;
  read_at?: string;
  archived_at?: string;
}

export interface NotificationPreferences {
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  order_updates: boolean;
  shipping_updates: boolean;
  marketing_updates: boolean;
  affiliate_updates: boolean;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byModule: Record<NotificationModule, number>;
  byPriority: Record<NotificationPriority, number>;
}
