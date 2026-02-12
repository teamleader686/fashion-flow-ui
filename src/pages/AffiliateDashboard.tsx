import { useState, useEffect } from 'react';
import { 
  MousePointerClick, 
  ShoppingCart, 
  DollarSign, 
  Wallet, 
  Copy, 
  Check, 
  Share2,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useAffiliateMarketing } from '@/hooks/useAffiliateMarketing';
import type { Affiliate, AffiliateCommission, WalletTransaction } from '@/types/affiliate';

export default function AffiliateDashboard() {
  const [profile, setProfile] = useState<Affiliate | null>(null);
  const [commissions, setCommissions] = useState<AffiliateCommission[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'commissions' | 'wallet'>('commissions');

  const { 
    loading,
    getMyAffiliateProfile, 
    getMyCommissions, 
    getMyWalletTransactions 
  } = useAffiliateMarketing();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [profileRes, commissionsRes, transactionsRes] = await Promise.all([
      getMyAffiliateProfile(),
      getMyCommissions(),
      getMyWalletTransactions()
    ]);

    if (profileRes.success) setProfile(profileRes.data);
    if (commissionsRes.success) setCommissions(commissionsRes.data || []);
    if (transactionsRes.success) setTransactions(transactionsRes.data || []);
  };

  const referralLink = profile ? `${window.location.origin}?ref=${profile.referral_code}` : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join via my referral',
        text: 'Shop amazing products and get great deals!',
        url: referralLink
      });
    } else {
      handleCopyLink();
    }
  };

  if (loading && !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Affiliate profile not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
          <h1 className="text-2xl md:text-3xl font-bold">Affiliate Dashboard</h1>
          <p className="mt-2 opacity-90">Welcome back, {profile.name}!</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={<MousePointerClick className="w-6 h-6" />}
            label="Total Clicks"
            value={profile.total_clicks}
            color="blue"
          />
          <StatCard
            icon={<ShoppingCart className="w-6 h-6" />}
            label="Total Orders"
            value={profile.total_orders}
            color="green"
          />
          <StatCard
            icon={<DollarSign className="w-6 h-6" />}
            label="Total Sales"
            value={`₹${profile.total_sales.toFixed(2)}`}
            color="purple"
          />
          <StatCard
            icon={<Wallet className="w-6 h-6" />}
            label="Wallet Balance"
            value={`₹${profile.wallet_balance.toFixed(2)}`}
            color="pink"
          />
        </div>

        {/* Referral Link Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Your Referral Link</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex items-center gap-2 bg-gray-50 px-4 py-3 rounded-lg border">
              <code className="flex-1 text-sm truncate">{referralLink}</code>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {copiedLink ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                <span className="hidden sm:inline">{copiedLink ? 'Copied!' : 'Copy'}</span>
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Share2 className="w-5 h-5" />
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-3">
            Share this link with your friends and earn {profile.commission_type === 'percentage' 
              ? `${profile.commission_value}%` 
              : `₹${profile.commission_value}`} commission on every sale!
          </p>
        </div>

        {/* Commission Info Card */}
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-6 mb-6 border border-pink-200">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white rounded-lg">
              <TrendingUp className="w-6 h-6 text-pink-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Your Commission Rate</h3>
              <p className="text-2xl font-bold text-pink-600">
                {profile.commission_type === 'percentage' 
                  ? `${profile.commission_value}%` 
                  : `₹${profile.commission_value} per order`}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Total earned: ₹{profile.total_commission.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="border-b">
            <div className="flex">
              <button
                onClick={() => setActiveTab('commissions')}
                className={`flex-1 px-6 py-4 font-medium transition-colors ${
                  activeTab === 'commissions'
                    ? 'text-pink-600 border-b-2 border-pink-600 bg-pink-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Commissions & Orders
              </button>
              <button
                onClick={() => setActiveTab('wallet')}
                className={`flex-1 px-6 py-4 font-medium transition-colors ${
                  activeTab === 'wallet'
                    ? 'text-pink-600 border-b-2 border-pink-600 bg-pink-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Wallet History
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'commissions' ? (
              <CommissionsTable commissions={commissions} />
            ) : (
              <WalletTable transactions={transactions} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ icon, label, value, color }: any) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    pink: 'bg-pink-100 text-pink-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

// Commissions Table Component
function CommissionsTable({ commissions }: { commissions: AffiliateCommission[] }) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (commissions.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No commissions yet</p>
        <p className="text-sm text-gray-500 mt-2">Start sharing your referral link to earn commissions!</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {/* Desktop Table */}
      <table className="hidden md:table w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order Amount</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {commissions.map((commission) => (
            <tr key={commission.id} className="hover:bg-gray-50">
              <td className="px-4 py-4">
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                  {commission.order_id.slice(0, 8)}...
                </code>
              </td>
              <td className="px-4 py-4 text-sm">₹{commission.order_amount.toFixed(2)}</td>
              <td className="px-4 py-4 text-sm font-medium text-green-600">
                ₹{commission.commission_amount.toFixed(2)}
              </td>
              <td className="px-4 py-4">
                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(commission.status)}`}>
                  {getStatusIcon(commission.status)}
                  {commission.status}
                </span>
              </td>
              <td className="px-4 py-4 text-sm text-gray-600">
                {new Date(commission.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {commissions.map((commission) => (
          <div key={commission.id} className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <code className="text-sm bg-white px-2 py-1 rounded">
                {commission.order_id.slice(0, 8)}...
              </code>
              <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(commission.status)}`}>
                {getStatusIcon(commission.status)}
                {commission.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-600">Order Amount</p>
                <p className="font-medium">₹{commission.order_amount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-600">Commission</p>
                <p className="font-medium text-green-600">₹{commission.commission_amount.toFixed(2)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-600">Date</p>
                <p className="font-medium">{new Date(commission.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Wallet Table Component
function WalletTable({ transactions }: { transactions: WalletTransaction[] }) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No transactions yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {/* Desktop Table */}
      <table className="hidden md:table w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {transactions.map((transaction) => (
            <tr key={transaction.id} className="hover:bg-gray-50">
              <td className="px-4 py-4">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  transaction.transaction_type === 'credit'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {transaction.transaction_type}
                </span>
              </td>
              <td className={`px-4 py-4 text-sm font-medium ${
                transaction.transaction_type === 'credit' ? 'text-green-600' : 'text-red-600'
              }`}>
                {transaction.transaction_type === 'credit' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
              </td>
              <td className="px-4 py-4 text-sm">₹{transaction.balance_after.toFixed(2)}</td>
              <td className="px-4 py-4 text-sm text-gray-600">{transaction.description || '-'}</td>
              <td className="px-4 py-4 text-sm text-gray-600">
                {new Date(transaction.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                transaction.transaction_type === 'credit'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {transaction.transaction_type}
              </span>
              <p className={`text-lg font-bold ${
                transaction.transaction_type === 'credit' ? 'text-green-600' : 'text-red-600'
              }`}>
                {transaction.transaction_type === 'credit' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
              </p>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-gray-600">Balance After</p>
                <p className="font-medium">₹{transaction.balance_after.toFixed(2)}</p>
              </div>
              {transaction.description && (
                <div>
                  <p className="text-gray-600">Description</p>
                  <p className="font-medium">{transaction.description}</p>
                </div>
              )}
              <div>
                <p className="text-gray-600">Date</p>
                <p className="font-medium">{new Date(transaction.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
