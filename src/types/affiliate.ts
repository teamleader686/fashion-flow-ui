// Affiliate Marketing System Types

export interface Affiliate {
  id: string;
  user_id?: string;
  name: string;
  email: string;
  mobile: string;
  referral_code: string;
  commission_type: 'flat' | 'percentage';
  commission_value: number;
  status: 'active' | 'inactive';
  wallet_balance: number;
  total_clicks: number;
  total_orders: number;
  total_sales: number;
  total_commission: number;
  created_at: string;
  updated_at: string;
}

export interface AffiliateClick {
  id: string;
  affiliate_id: string;
  ip_address?: string;
  user_agent?: string;
  referrer?: string;
  landing_page?: string;
  clicked_at: string;
}

export interface AffiliateOrder {
  id: string;
  order_id: string;
  affiliate_id: string;
  user_id: string;
  order_total: number;
  commission_amount: number;
  commission_status: 'pending' | 'approved' | 'paid' | 'cancelled';
  created_at: string;
}

export interface AffiliateCommission {
  id: string;
  affiliate_id: string;
  order_id: string;
  affiliate_order_id: string;
  commission_type: 'flat' | 'percentage';
  commission_value: number;
  order_amount: number;
  commission_amount: number;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  approved_at?: string;
  paid_at?: string;
  created_at: string;
}

export interface AffiliateWithdrawal {
  id: string;
  affiliate_id: string;
  amount: number;
  payment_method: string;
  payment_details?: any;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  admin_notes?: string;
  requested_at: string;
  processed_at?: string;
  processed_by?: string;
}

export interface WalletTransaction {
  id: string;
  affiliate_id: string;
  transaction_type: 'credit' | 'debit';
  amount: number;
  balance_before: number;
  balance_after: number;
  reference_type?: 'commission' | 'withdrawal' | 'adjustment' | 'refund';
  reference_id?: string;
  description?: string;
  created_at: string;
}

export interface AffiliateStats {
  totalAffiliates: number;
  activeAffiliates: number;
  totalClicks: number;
  totalOrders: number;
  totalSales: number;
  totalCommission: number;
  pendingCommission: number;
  paidCommission: number;
}

export interface AffiliateFormData {
  name: string;
  email: string;
  mobile: string;
  password?: string;
  commission_type: 'flat' | 'percentage';
  commission_value: number;
  status: 'active' | 'inactive';
}
