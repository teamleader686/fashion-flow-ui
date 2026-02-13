import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface WalletTransaction {
  id: string;
  user_id: string;
  order_id: string | null;
  type: 'earn' | 'redeem' | 'refund' | 'admin_adjust' | 'affiliate_credit' | 'promotional';
  coins: number;
  amount: number;
  wallet_type: string;
  description: string;
  balance_after: number;
  status: string;
  created_at: string;
}

export interface WalletData {
  id: string;
  user_id: string;
  available_balance: number;
  loyalty_balance: number; // Mapping for admin consistency
  affiliate_balance: number;
  refund_balance: number;
  promotional_balance: number;
  total_balance: number;
  total_earned: number;
  total_redeemed: number;
  frozen: boolean;
  frozen_reason: string;
}

// Hook for User-side Wallet
export const useWallet = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWalletData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data: walletData, error: walletError } = await supabase
        .from('loyalty_wallet')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (walletError) {
        throw walletError;
      }

      if (walletData) {
        setWallet({
          ...walletData,
          loyalty_balance: walletData.available_balance // compatibility
        });
      } else {
        setWallet(null);
      }

      const { data: txData, error: txError } = await supabase
        .from('loyalty_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (txError) throw txError;
      setTransactions(txData || []);

    } catch (err: any) {
      console.error('Error fetching wallet data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWalletData();
    if (!user) return;

    const channel = supabase.channel('user_wallet_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loyalty_wallet', filter: `user_id=eq.${user.id}` }, () => fetchWalletData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loyalty_transactions', filter: `user_id=eq.${user.id}` }, () => fetchWalletData())
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [user, fetchWalletData]);

  return { wallet, transactions, loading, error, refetch: fetchWalletData };
};

// Hook for Admin: Fetch all wallets
export const useAllWallets = () => {
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllWallets = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('loyalty_wallet')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const mappedData = (data || []).map(w => ({
        ...w,
        loyalty_balance: w.available_balance // compatibility with admin UI
      }));

      setWallets(mappedData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllWallets();
  }, [fetchAllWallets]);

  return { wallets, loading, error, refetch: fetchAllWallets };
};

// Hook for Admin: Wallet Actions
export const useWalletActions = () => {
  const [loading, setLoading] = useState(false);

  const creditWallet = async ({ user_id, amount, description, wallet_type }: any) => {
    setLoading(true);
    try {
      // If loyalty type, we use the loyalty_transactions table to trigger the update
      if (wallet_type === 'loyalty') {
        const { error } = await supabase
          .from('loyalty_transactions')
          .insert({
            user_id,
            type: 'admin_adjust',
            coins: Math.round(amount),
            description: description || 'Admin adjustment',
            wallet_type: 'loyalty'
          });
        if (error) throw error;
      } else {
        // For other types, direct update (since triggers are simplified)
        // In a real system, you'd have more triggers or RPCs
        const updateField = `${wallet_type}_balance`;
        const { data: current } = await supabase.from('loyalty_wallet').select(updateField).eq('user_id', user_id).single();
        const newBalance = (current?.[updateField] || 0) + amount;

        const { error } = await supabase
          .from('loyalty_wallet')
          .update({ [updateField]: newBalance, updated_at: new Date().toISOString() })
          .eq('user_id', user_id);
        if (error) throw error;
      }
      toast.success('Wallet credited successfully');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const debitWallet = async ({ user_id, amount, description, wallet_type }: any) => {
    setLoading(true);
    try {
      if (wallet_type === 'loyalty') {
        const { error } = await supabase
          .from('loyalty_transactions')
          .insert({
            user_id,
            type: 'admin_adjust',
            coins: -Math.round(amount),
            description: description || 'Admin adjustment',
            wallet_type: 'loyalty'
          });
        if (error) throw error;
      } else {
        const updateField = `${wallet_type}_balance`;
        const { data: current } = await supabase.from('loyalty_wallet').select(updateField).eq('user_id', user_id).single();
        const newBalance = Math.max(0, (current?.[updateField] || 0) - amount);

        const { error } = await supabase
          .from('loyalty_wallet')
          .update({ [updateField]: newBalance, updated_at: new Date().toISOString() })
          .eq('user_id', user_id);
        if (error) throw error;
      }
      toast.success('Wallet debited successfully');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const freezeWallet = async (user_id: string, reason: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('loyalty_wallet')
        .update({ frozen: true, frozen_reason: reason, updated_at: new Date().toISOString() })
        .eq('user_id', user_id);
      if (error) throw error;
      toast.success('Wallet frozen');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const unfreezeWallet = async (user_id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('loyalty_wallet')
        .update({ frozen: false, frozen_reason: null, updated_at: new Date().toISOString() })
        .eq('user_id', user_id);
      if (error) throw error;
      toast.success('Wallet unfrozen');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { creditWallet, debitWallet, freezeWallet, unfreezeWallet, loading };
};
