// Instagram Marketing Module Types

export interface InstagramUser {
  id: string;
  name: string;
  mobile_number: string;
  email: string;
  password?: string;
  instagram_username: string;
  followers_count: number;
  status: 'active' | 'inactive';
  total_coins: number;
  created_at: string;
  updated_at: string;
}

export interface InstagramCampaign {
  id: string;
  campaign_title: string; // Keep for legacy
  name?: string;
  description?: string;
  campaign_code?: string;
  source?: string;
  medium?: string;
  media_url?: string;
  media_type?: 'image' | 'video';
  expiry_hours: number;
  status: 'active' | 'expired' | 'completed';
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface InstagramAssignment {
  id: string;
  campaign_id: string;
  user_id: string;
  assigned_date: string;
  expiry_date: string;
  status: 'active' | 'expired' | 'completed';
  reminder_sent: boolean;
  created_at: string;
  campaign?: InstagramCampaign;
  user?: InstagramUser;
}

export interface InstagramCoinLog {
  id: string;
  user_id: string;
  coins: number;
  reason: string;
  assigned_by?: string;
  assigned_date: string;
  running_balance: number;
  created_at: string;
  user?: InstagramUser;
}

export interface InstagramNotification {
  id: string;
  notification_type: 'story_expiry' | 'coins_assigned' | 'campaign_assigned';
  recipient_type: 'admin' | 'instagram_user';
  recipient_id?: string;
  title: string;
  message: string;
  assignment_id?: string;
  is_read: boolean;
  created_at: string;
  assignment?: InstagramAssignment;
}

export interface InstagramAnalytics {
  total_active_users: number;
  total_campaigns: number;
  total_coins_distributed: number;
  active_stories: number;
  expired_stories: number;
  completed_stories: number;
  total_clicks: number;
  total_orders: number;
  total_revenue: number;
}

export interface InstagramUserFormData {
  name: string;
  mobile_number: string;
  email: string;
  password: string;
  instagram_username: string;
  followers_count: number;
  status: 'active' | 'inactive';
}

export interface CampaignFormData {
  campaign_title: string;
  name?: string;
  description?: string;
  campaign_code?: string;
  source?: string;
  medium?: string;
  media_file?: File;
  media_url?: string;
  media_type: 'image' | 'video';
  expiry_hours: number;
  assigned_users: string[];
}

export interface CoinAssignmentData {
  user_id: string;
  coins: number;
  reason: string;
}
