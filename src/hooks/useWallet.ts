import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type {
  Wallet,
  WalletTransaction,
  LoyaltyTransaction,
  WalletBalance,
  CreditWalletParams,
  DebitWalletParams,
  CreditCoinsParams,
  RedeemCoinsParams
} from '@/types/wallet';

export function useWallet(userId?: string) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWallet = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setWallet(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, [userId]);

  return { wallet, loading, error, refetch: fetchWallet };
}

export function useWalletBalance(userId?: string) {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        const { data, error} = await supabase.rpc('get_wallet_balance', {
          p_user_id: userId
        });

        if (error) throw error;
        setBalance(data && data.length > 0 ? data[0] : null);
      } catch (err) {
        console.error('Error fetching wallet balance:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [userId]);

  return { balance, loading };
}

export function useWalletTransactions(userId?: string) {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      console.error('Error fetching wallet transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [userId]);

  return { transactions, loading, refetch: fetchTransactions };
}

export function useLoyaltyTransactions(userId?: string) {
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('loyalty_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      console.error('Error fetching loyalty transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [userId]);

  return { transactions, loading, refetch: fetchTransactions };
}

export function useWalletActions() {
  const creditWallet = async (params: CreditWalletParams) => {
    const { data, error } = await supabase.rpc('credit_wallet', {
      p_user_id: params.user_id,
      p_wallet_type: params.wallet_type,
      p_amount: params.amount,
      p_source: params.source,
      p_reference_id: params.reference_id || null,
      p_description: params.description || null,
      p_created_by: params.created_by || null
    });

    if (error) throw error;
    return data;
  };

  const debitWallet = async (params: DebitWalletParams) => {
    const { data, error } = await supabase.rpc('debit_wallet', {
      p_user_id: params.user_id,
      p_wallet_type: params.wallet_type,
      p_amount: params.amount,
      p_source: params.source,
      p_reference_id: params.reference_id || null,
      p_description: params.description || null,
      p_created_by: params.created_by || null
    });

    if (error) throw error;
    return data;
  };

  const creditCoins = async (params: CreditCoinsParams) => {
    const { data, error } = await supabase.rpc('credit_loyalty_coins', {
      p_user_id: params.user_id,
      p_order_id: params.order_id,
      p_coins: params.coins,
      p_type: params.type || 'earn',
      p_description: params.description || null,
      p_expires_at: params.expires_at || null
    });

    if (error) throw error;
    return data;
  };

  const redeemCoins = async (params: RedeemCoinsParams) => {
    const { data, error } = await supabase.rpc('redeem_loyalty_coins', {
      p_user_id: params.user_id,
      p_order_id: params.order_id,
      p_coins: params.coins,
      p_description: params.description || null
    });

    if (error) throw error;
    return data;
  };

  const freezeWallet = async (userId: string, reason: string) => {
    const { data: user } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('wallets')
      .update({
        frozen: true,
        frozen_reason: reason,
        frozen_at: new Date().toISOString(),
        frozen_by: user.user?.id
      })
      .eq('user_id', userId);

    if (error) throw error;
  };

  const unfreezeWallet = async (userId: string) => {
    const { error } = await supabase
      .from('wallets')
      .update({
        frozen: false,
        frozen_reason: null,
        frozen_at: null,
        frozen_by: null
      })
      .eq('user_id', userId);

    if (error) throw error;
  };

  return {
    creditWallet,
    debitWallet,
    creditCoins,
    redeemCoins,
    freezeWallet,
    unfreezeWallet
  };
}

// Hook for admin to view all wallets
export function useAllWallets() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWallets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .order('total_balance', { ascending: false });

      if (error) throw error;
      setWallets(data || []);
    } catch (err) {
      console.error('Error fetching wallets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, []);

  return { wallets, loading, refetch: fetchWallets };
}
