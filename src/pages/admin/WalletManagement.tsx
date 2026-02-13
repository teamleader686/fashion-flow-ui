import { useState } from 'react';
import { useAllWallets, useWalletActions } from '@/hooks/useWallet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, Lock, Unlock, Plus, Minus, Search, TrendingUp } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { StatsCardsSkeleton, TableSkeleton } from '@/components/shimmer/AdminShimmer';
import AdminPagination from '@/components/admin/AdminPagination';
import { usePagination } from '@/hooks/usePagination';

const ITEMS_PER_PAGE = 10;

export default function WalletManagement() {
  const { wallets, loading, refetch } = useAllWallets();
  const { creditWallet, debitWallet, freezeWallet, unfreezeWallet } = useWalletActions();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWallet, setSelectedWallet] = useState<any>(null);
  const [actionType, setActionType] = useState<'credit' | 'debit' | null>(null);
  const [amount, setAmount] = useState('');
  const [walletType, setWalletType] = useState<'loyalty' | 'affiliate' | 'refund' | 'promotional'>('loyalty');
  const [description, setDescription] = useState('');
  const [processing, setProcessing] = useState(false);

  const filteredWallets = wallets.filter(wallet =>
    wallet.user_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const { currentPage, totalPages, paginatedItems, handlePageChange, startIndex, endIndex, totalItems } = usePagination(filteredWallets, { itemsPerPage: ITEMS_PER_PAGE });

  const handleCredit = async () => {
    if (!selectedWallet || !amount) return;
    setProcessing(true);
    try {
      await creditWallet({ user_id: selectedWallet.user_id, wallet_type: walletType, amount: parseFloat(amount), source: 'manual', description: description || 'Manual credit by admin' });
      alert('Credit successful!'); setActionType(null); setAmount(''); setDescription(''); refetch();
    } catch (error: any) { alert(error.message); } finally { setProcessing(false); }
  };

  const handleDebit = async () => {
    if (!selectedWallet || !amount) return;
    setProcessing(true);
    try {
      await debitWallet({ user_id: selectedWallet.user_id, wallet_type: walletType, amount: parseFloat(amount), source: 'manual', description: description || 'Manual debit by admin' });
      alert('Debit successful!'); setActionType(null); setAmount(''); setDescription(''); refetch();
    } catch (error: any) { alert(error.message); } finally { setProcessing(false); }
  };

  const handleFreeze = async (userId: string) => {
    const reason = prompt('Enter reason for freezing wallet:');
    if (!reason) return;
    try { await freezeWallet(userId, reason); alert('Wallet frozen!'); refetch(); } catch (error: any) { alert(error.message); }
  };

  const handleUnfreeze = async (userId: string) => {
    if (!confirm('Unfreeze this wallet?')) return;
    try { await unfreezeWallet(userId); alert('Wallet unfrozen!'); refetch(); } catch (error: any) { alert(error.message); }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Wallet Management</h1>
          <p className="text-muted-foreground mt-1">Manage user wallets and loyalty coins</p>
        </div>

        {loading ? (
          <StatsCardsSkeleton count={4} />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Wallets', value: wallets.length, icon: Wallet, color: 'text-purple-500' },
              { label: 'Total Balance', value: `₹${wallets.reduce((s, w) => s + w.total_balance, 0).toFixed(0)}`, icon: TrendingUp, color: 'text-green-500' },
              { label: 'Total Coins', value: wallets.reduce((s, w) => s + w.loyalty_balance, 0), icon: Wallet, color: 'text-yellow-500' },
              { label: 'Frozen', value: wallets.filter(w => w.frozen).length, icon: Lock, color: 'text-red-500' },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <Card key={i}><CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm text-muted-foreground">{s.label}</p><p className="text-2xl font-bold">{s.value}</p></div>
                    <Icon className={`w-8 h-8 ${s.color}`} />
                  </div>
                </CardContent></Card>
              );
            })}
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input placeholder="Search by user ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>

        {loading ? (
          <TableSkeleton rows={ITEMS_PER_PAGE} cols={7} />
        ) : filteredWallets.length === 0 ? (
          <Card><CardContent className="py-12 text-center"><p className="text-muted-foreground">No wallets found</p></CardContent></Card>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block">
              <Card><CardContent className="p-0"><div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b bg-muted/50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">User ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Total Balance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Loyalty Coins</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Affiliate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Refund</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
                  </tr></thead>
                  <tbody className="divide-y">
                    {paginatedItems.map((wallet) => (
                      <tr key={wallet.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 text-sm font-mono">{wallet.user_id.slice(0, 8)}...</td>
                        <td className="px-6 py-4 text-sm font-semibold">₹{wallet.total_balance}</td>
                        <td className="px-6 py-4 text-sm text-yellow-600 font-semibold">{wallet.loyalty_balance}</td>
                        <td className="px-6 py-4 text-sm">₹{wallet.affiliate_balance}</td>
                        <td className="px-6 py-4 text-sm">₹{wallet.refund_balance}</td>
                        <td className="px-6 py-4"><Badge variant={wallet.frozen ? 'destructive' : 'default'}>{wallet.frozen ? 'Frozen' : 'Active'}</Badge></td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => { setSelectedWallet(wallet); setActionType('credit'); }}><Plus className="w-4 h-4 text-green-600" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => { setSelectedWallet(wallet); setActionType('debit'); }}><Minus className="w-4 h-4 text-destructive" /></Button>
                            {wallet.frozen ? (
                              <Button variant="ghost" size="icon" onClick={() => handleUnfreeze(wallet.user_id)}><Unlock className="w-4 h-4 text-green-600" /></Button>
                            ) : (
                              <Button variant="ghost" size="icon" onClick={() => handleFreeze(wallet.user_id)}><Lock className="w-4 h-4 text-orange-600" /></Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div></CardContent></Card>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-3">
              {paginatedItems.map((wallet) => (
                <Card key={wallet.id}><CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <code className="text-sm font-mono text-muted-foreground">{wallet.user_id.slice(0, 12)}...</code>
                    <Badge variant={wallet.frozen ? 'destructive' : 'default'}>{wallet.frozen ? 'Frozen' : 'Active'}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                    <div><p className="text-muted-foreground">Total</p><p className="font-semibold">₹{wallet.total_balance}</p></div>
                    <div><p className="text-muted-foreground">Loyalty</p><p className="font-semibold text-yellow-600">{wallet.loyalty_balance}</p></div>
                    <div><p className="text-muted-foreground">Affiliate</p><p className="font-semibold">₹{wallet.affiliate_balance}</p></div>
                    <div><p className="text-muted-foreground">Refund</p><p className="font-semibold">₹{wallet.refund_balance}</p></div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setSelectedWallet(wallet); setActionType('credit'); }} className="flex-1"><Plus className="w-4 h-4 mr-1 text-green-600" />Credit</Button>
                    <Button variant="outline" size="sm" onClick={() => { setSelectedWallet(wallet); setActionType('debit'); }} className="flex-1"><Minus className="w-4 h-4 mr-1 text-destructive" />Debit</Button>
                    {wallet.frozen ? (
                      <Button variant="outline" size="sm" onClick={() => handleUnfreeze(wallet.user_id)}><Unlock className="w-4 h-4 text-green-600" /></Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => handleFreeze(wallet.user_id)}><Lock className="w-4 h-4 text-orange-600" /></Button>
                    )}
                  </div>
                </CardContent></Card>
              ))}
            </div>

            <AdminPagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} startIndex={startIndex} endIndex={endIndex} totalItems={totalItems} label="wallets" />
          </>
        )}

        {actionType && selectedWallet && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg shadow-xl w-full max-w-md p-6">
              <h2 className="text-xl font-bold mb-4">{actionType === 'credit' ? 'Credit Wallet' : 'Debit Wallet'}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Wallet Type</label>
                  <select value={walletType} onChange={(e) => setWalletType(e.target.value as any)} className="w-full px-3 py-2 border rounded-md bg-background">
                    <option value="loyalty">Loyalty Coins</option><option value="affiliate">Affiliate Earnings</option><option value="refund">Refund Credits</option><option value="promotional">Promotional Credits</option>
                  </select>
                </div>
                <div><label className="block text-sm font-medium mb-1">Amount</label><Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" /></div>
                <div><label className="block text-sm font-medium mb-1">Description</label><Input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Reason for transaction" /></div>
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => { setActionType(null); setAmount(''); setDescription(''); }} className="flex-1">Cancel</Button>
                  <Button onClick={actionType === 'credit' ? handleCredit : handleDebit} disabled={processing || !amount} className="flex-1">{processing ? 'Processing...' : actionType === 'credit' ? 'Credit' : 'Debit'}</Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
