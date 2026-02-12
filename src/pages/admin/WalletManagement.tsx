import { useState } from 'react';
import { useAllWallets, useWalletActions } from '@/hooks/useWallet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wallet, Lock, Unlock, Plus, Minus, Search, TrendingUp } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';

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

  const handleCredit = async () => {
    if (!selectedWallet || !amount) return;

    setProcessing(true);
    try {
      await creditWallet({
        user_id: selectedWallet.user_id,
        wallet_type: walletType,
        amount: parseFloat(amount),
        source: 'manual',
        description: description || 'Manual credit by admin'
      });
      alert('Credit successful!');
      setActionType(null);
      setAmount('');
      setDescription('');
      refetch();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleDebit = async () => {
    if (!selectedWallet || !amount) return;

    setProcessing(true);
    try {
      await debitWallet({
        user_id: selectedWallet.user_id,
        wallet_type: walletType,
        amount: parseFloat(amount),
        source: 'manual',
        description: description || 'Manual debit by admin'
      });
      alert('Debit successful!');
      setActionType(null);
      setAmount('');
      setDescription('');
      refetch();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleFreeze = async (userId: string) => {
    const reason = prompt('Enter reason for freezing wallet:');
    if (!reason) return;

    try {
      await freezeWallet(userId, reason);
      alert('Wallet frozen successfully!');
      refetch();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleUnfreeze = async (userId: string) => {
    if (!confirm('Are you sure you want to unfreeze this wallet?')) return;

    try {
      await unfreezeWallet(userId);
      alert('Wallet unfrozen successfully!');
      refetch();
    } catch (error: any) {
      alert(error.message);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wallet Management</h1>
          <p className="text-gray-600 mt-1">Manage user wallets and loyalty coins</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Wallets</p>
                <p className="text-2xl font-bold text-gray-900">{wallets.length}</p>
              </div>
              <Wallet className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Balance</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{wallets.reduce((sum, w) => sum + w.total_balance, 0).toFixed(0)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Coins</p>
                <p className="text-2xl font-bold text-gray-900">
                  {wallets.reduce((sum, w) => sum + w.loyalty_balance, 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Frozen Wallets</p>
                <p className="text-2xl font-bold text-gray-900">
                  {wallets.filter(w => w.frozen).length}
                </p>
              </div>
              <Lock className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search by user ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">User ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Total Balance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Loyalty Coins</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Affiliate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Refund</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredWallets.map((wallet) => (
                      <tr key={wallet.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 text-sm font-mono">{wallet.user_id.slice(0, 8)}...</td>
                        <td className="px-6 py-4 text-sm font-semibold">₹{wallet.total_balance}</td>
                        <td className="px-6 py-4 text-sm text-yellow-600 font-semibold">{wallet.loyalty_balance}</td>
                        <td className="px-6 py-4 text-sm">₹{wallet.affiliate_balance}</td>
                        <td className="px-6 py-4 text-sm">₹{wallet.refund_balance}</td>
                        <td className="px-6 py-4">
                          <Badge variant={wallet.frozen ? 'destructive' : 'default'}>{wallet.frozen ? 'Frozen' : 'Active'}</Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => { setSelectedWallet(wallet); setActionType('credit'); }} title="Credit"><Plus className="w-4 h-4 text-green-600" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => { setSelectedWallet(wallet); setActionType('debit'); }} title="Debit"><Minus className="w-4 h-4 text-destructive" /></Button>
                            {wallet.frozen ? (
                              <Button variant="ghost" size="icon" onClick={() => handleUnfreeze(wallet.user_id)} title="Unfreeze"><Unlock className="w-4 h-4 text-green-600" /></Button>
                            ) : (
                              <Button variant="ghost" size="icon" onClick={() => handleFreeze(wallet.user_id)} title="Freeze"><Lock className="w-4 h-4 text-orange-600" /></Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile/Tablet Cards */}
        <div className="lg:hidden space-y-3">
          {filteredWallets.map((wallet) => (
            <Card key={wallet.id}>
              <CardContent className="p-4">
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
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Credit/Debit Modal */}
        {actionType && selectedWallet && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
              <h2 className="text-xl font-bold mb-4">
                {actionType === 'credit' ? 'Credit Wallet' : 'Debit Wallet'}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Wallet Type</label>
                  <select
                    value={walletType}
                    onChange={(e) => setWalletType(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="loyalty">Loyalty Coins</option>
                    <option value="affiliate">Affiliate Earnings</option>
                    <option value="refund">Refund Credits</option>
                    <option value="promotional">Promotional Credits</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Amount</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <Input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Reason for transaction"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setActionType(null);
                      setAmount('');
                      setDescription('');
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={actionType === 'credit' ? handleCredit : handleDebit}
                    disabled={processing || !amount}
                    className="flex-1"
                  >
                    {processing ? 'Processing...' : actionType === 'credit' ? 'Credit' : 'Debit'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
