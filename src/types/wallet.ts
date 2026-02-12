// Wallet & Loyalty Types

export type WalletType = 'loyalty' | 'affiliate' | 'refund' | 'promotional';
export type TransactionType = 'credit' | 'debit';
export type TransactionSource = 'order' | 'refund' | 'affiliate' | 'instagram' | 'manual' | 'promotional' | 'expiry' | 'reversal';
export type LoyaltyTransactionType = 'earn' | 'redeem' | 'expire' | 'manual' | 'reversal';

export interface Wallet {
  id: string;
  user_id: string;
  total_balance: number;
  loyalty_balance: number;
  affiliate_balance: number;
  refund_balance: number;
  promotional_balance: number;
  frozen: boolean;
  frozen_reason: string | null;
  frozen_at: string | null;
  frozen_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  wallet_id: string;
  type: TransactionType;
  source: TransactionSource;
  wallet_type: WalletType;
  reference_id: string | null;
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string | null;
  created_by: string | null;
  created_at: string;
}

export interface LoyaltyTransaction {
  id: string;
  user_id: string;
  order_id: string | null;
  coins: number;
  type: LoyaltyTransactionType;
  balance_before: number;
  balance_after: number;
  description: string | null;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
}

export interface WalletBalance {
  total_balance: number;
  loyalty_balance: number;
  affiliate_balance: number;
  refund_balance: number;
  promotional_balance: number;
  frozen: boolean;
}

export interface CreditWalletParams {
  user_id: string;
  wallet_type: WalletType;
  amount: number;
  source: TransactionSource;
  reference_id?: string;
  description?: string;
  created_by?: string;
}

export interface DebitWalletParams {
  user_id: string;
  wallet_type: WalletType;
  amount: number;
  source: TransactionSource;
  reference_id?: string;
  description?: string;
  created_by?: string;
}

export interface CreditCoinsParams {
  user_id: string;
  order_id: string;
  coins: number;
  type?: LoyaltyTransactionType;
  description?: string;
  expires_at?: string;
}

export interface RedeemCoinsParams {
  user_id: string;
  order_id: string;
  coins: number;
  description?: string;
}
