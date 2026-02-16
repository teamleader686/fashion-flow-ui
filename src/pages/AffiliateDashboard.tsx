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
  Banknote,
  LogOut,
  Home,
  User,
  List,
  Package,
  ExternalLink
} from 'lucide-react';
import { useAffiliateMarketing } from '@/hooks/useAffiliateMarketing';
import type { Affiliate, AffiliateCommission, WalletTransaction, AffiliateWithdrawal } from '@/types/affiliate';
import AffiliateLayout from '@/components/layout/AffiliateLayout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useNavigate, Link } from 'react-router-dom';

// Type for assigned products
interface AssignedProduct {
  id: string;
  product_name: string;
  selling_price: number;
  slug: string;
  images: string[];
}

// --- Sub-Components ---

// 1. Stats Grid
function StatsSection({ profile }: { profile: Affiliate }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
      <StatCard
        icon={<MousePointerClick className="w-5 h-5 md:w-6 md:h-6" />}
        label="Clicks"
        value={profile.total_clicks || 0}
        color="blue"
      />
      <StatCard
        icon={<ShoppingCart className="w-5 h-5 md:w-6 md:h-6" />}
        label="Orders"
        value={profile.total_orders || 0}
        color="green"
      />
      <StatCard
        icon={<DollarSign className="w-5 h-5 md:w-6 md:h-6" />}
        label="Sales"
        value={`₹${(profile.total_sales || 0).toFixed(0)}`}
        color="purple"
      />
      <StatCard
        icon={<Wallet className="w-5 h-5 md:w-6 md:h-6" />}
        label="Wallet"
        value={`₹${(profile.wallet_balance || 0).toFixed(0)}`}
        color="pink"
      />
    </div>
  );
}

// 2. Assigned Products Section
function AssignedProductsSection({ products, referralCode }: { products: AssignedProduct[], referralCode: string }) {
  const handleCopyLink = (product: AssignedProduct) => {
    // Construct link: origin + /product/ + slug + ?ref=CODE
    // If slug is missing, use ID? The hook selects slug. Ideally use slug or ID depending on route.
    const productPath = product.slug ? `/product/${product.slug}` : `/product/${product.id}`;
    const link = `${window.location.origin}${productPath}?ref=${referralCode}`;

    navigator.clipboard.writeText(link);
    toast.success('Product link copied!');
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-dashed mb-8">
        <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">No products assigned yet.</p>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Package className="w-5 h-5 text-primary" />
        Promote Products
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map(product => {
          const productPath = product.slug ? `/product/${product.slug}` : `/product/${product.id}`;
          const link = `${window.location.origin}${productPath}?ref=${referralCode}`;
          const shareText = `Check out ${product.product_name} on Fashion Flow! ${link}`;
          const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

          return (
            <div key={product.id} className="bg-white border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-square bg-gray-100 relative">
                {product.images && product.images[0] ? (
                  <img src={product.images[0]} alt={product.product_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-medium text-sm line-clamp-2 h-10 mb-1" title={product.product_name}>{product.product_name}</h3>
                <p className="text-primary font-bold text-sm mb-3">₹{product.selling_price}</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => handleCopyLink(product)}
                    variant="outline"
                    size="sm"
                    className="w-full text-xs h-8 px-0"
                  >
                    <Copy className="w-3 h-3 mr-1" /> Copy
                  </Button>
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="w-full">
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full text-xs h-8 px-0 bg-green-500 hover:bg-green-600"
                    >
                      <Share2 className="w-3 h-3 mr-1" /> Share
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 3. Referral Section (Generic Link)
function ReferralSection({ referralLink }: { referralLink: string }) {
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-6 md:mb-8 border">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Share2 className="w-5 h-5 text-primary" />
        Your General Store Link
      </h2>
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-xl border group overflow-hidden">
          <code className="text-xs md:text-sm font-medium break-all">{referralLink}</code>
        </div>
        <Button onClick={handleCopyLink} className="shrink-0">
          {copiedLink ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
          {copiedLink ? 'Copied' : 'Copy'}
        </Button>
      </div>
    </div>
  );
}

// 4. Commission Rate Card
function CommissionRateCard({ profile }: { profile: Affiliate }) {
  return (
    <div className="bg-gradient-to-r from-primary/5 via-primary/[0.02] to-transparent rounded-xl p-4 md:p-6 mb-6 border border-primary/10">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-white rounded-xl shadow-sm border shrink-0">
          <TrendingUp className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Commission Rate</h3>
          <p className="text-xl font-bold text-gray-900">
            {profile.commission_type === 'percentage' ? `${profile.commission_value}%` : `₹${profile.commission_value}/order`}
          </p>
        </div>
      </div>
    </div>
  );
}

// Main Component
export default function AffiliateDashboard() {
  const [profile, setProfile] = useState<Affiliate | null>(null);
  const [assignedProducts, setAssignedProducts] = useState<AssignedProduct[]>([]);
  const [commissions, setCommissions] = useState<AffiliateCommission[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<AffiliateWithdrawal[]>([]);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  // Navigation State
  const [mobileView, setMobileView] = useState<'home' | 'earnings' | 'wallet' | 'profile'>('home');

  // Withdrawal State
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('upi');
  const [paymentDetails, setPaymentDetails] = useState('');

  const navigate = useNavigate();
  const {
    loading, getMyAffiliateProfile, getMyCommissions, getMyWalletTransactions,
    getMyWithdrawals, requestWithdrawal, getAssignedProducts
  } = useAffiliateMarketing();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    // 1. Load Profile
    const profileRes = await getMyAffiliateProfile();
    if (profileRes.success && profileRes.data) {
      setProfile(profileRes.data);

      // 2. Load other data in parallel
      const [productsRes, commissionsRes, transactionsRes, withdrawalsRes] = await Promise.all([
        getAssignedProducts(),
        getMyCommissions(),
        getMyWalletTransactions(),
        getMyWithdrawals()
      ]);

      if (productsRes?.success) setAssignedProducts(productsRes.data || []);
      if (commissionsRes?.success) setCommissions(commissionsRes.data || []);
      if (transactionsRes?.success) setTransactions(transactionsRes.data || []);
      if (withdrawalsRes?.success) setWithdrawals(withdrawalsRes.data || []);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('affiliate_user');
    toast.success('Logged out successfully');
    navigate('/affiliate-dashboard/login');
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) return toast.error('Invalid amount');
    if (amount > profile.wallet_balance) return toast.error('Insufficient balance');

    const result = await requestWithdrawal(amount, withdrawMethod, { details: paymentDetails });
    if (result.success) {
      toast.success('Withdrawal requested');
      setIsWithdrawModalOpen(false);
      setWithdrawAmount('');
      setPaymentDetails('');
      loadData(); // Reload wallet
    } else {
      toast.error(result.error);
    }
  };

  if (loading && !profile) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) return null;

  const generalReferralLink = `${window.location.origin}?ref=${profile.referral_code}`;

  return (
    <AffiliateLayout>
      {/* Mobile Filter Header is handled by Layout or just content */}

      {/* MOBILE CONTENT RENDERER */}
      <div className="md:hidden pb-24">
        {mobileView === 'home' && (
          <div className="space-y-6">
            <StatsSection profile={profile} />
            <CommissionRateCard profile={profile} />
            <AssignedProductsSection products={assignedProducts} referralCode={profile.referral_code} />

            {/* Recent Commissions — Mobile Card View */}
            <div className="bg-white rounded-xl border p-4">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Recent Commissions
              </h2>
              {commissions.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                  <p className="text-muted-foreground text-sm">No commissions yet</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {commissions.slice(0, 10).map(c => (
                    <div key={c.id} className="p-3 border rounded-lg shadow-sm bg-gray-50/50">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">Order #{(c.order_id || '').slice(0, 8)}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(c.created_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-green-600">+₹{c.commission_amount}</p>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-1 inline-block ${c.status === 'paid' ? 'bg-green-100 text-green-700' :
                            c.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                              c.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                            }`}>
                            {c.status}
                          </span>
                        </div>
                      </div>
                      {c.order_amount && (
                        <div className="flex justify-between mt-2 pt-2 border-t border-dashed text-xs text-muted-foreground">
                          <span>Order: ₹{c.order_amount}</span>
                          <span>{c.commission_type === 'percentage' ? `${c.commission_value}%` : `Flat ₹${c.commission_value}`}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <ReferralSection referralLink={generalReferralLink} />
          </div>
        )}
        {mobileView === 'earnings' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Full Commission History</h2>
            {commissions.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-muted-foreground">No earnings yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {commissions.map(c => (
                  <div key={c.id} className="bg-white p-3 rounded-lg border shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-semibold">Order #{(c.order_id || '').slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(c.created_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-600">+₹{c.commission_amount}</p>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-1 inline-block ${c.status === 'paid' ? 'bg-green-100 text-green-700' :
                          c.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                            c.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                          }`}>
                          {c.status}
                        </span>
                      </div>
                    </div>
                    {c.order_amount && (
                      <div className="flex justify-between mt-2 pt-2 border-t border-dashed text-xs text-muted-foreground">
                        <span>Order: ₹{c.order_amount}</span>
                        <span>{c.commission_type === 'percentage' ? `${c.commission_value}%` : `Flat ₹${c.commission_value}`}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {mobileView === 'wallet' && (
          <div className="space-y-6">
            <div className="bg-primary text-primary-foreground rounded-2xl p-6 shadow-lg">
              <p className="opacity-80 text-sm mb-1">Total Balance</p>
              <h2 className="text-4xl font-bold mb-6">₹{(profile.wallet_balance || 0).toFixed(2)}</h2>
              <Button onClick={() => setIsWithdrawModalOpen(true)} variant="secondary" className="w-full font-bold shadow-sm">
                <Banknote className="w-4 h-4 mr-2" /> Request Withdrawal
              </Button>
            </div>
            {/* Simplified Wallet History for Mobile */}
            <h3 className="font-bold">Recent Activity</h3>
            {transactions.slice(0, 5).map(tx => (
              <div key={tx.id} className="flex justify-between items-center py-3 border-b border-dashed">
                <span className="text-sm">{tx.description}</span>
                <span className={`text-sm font-bold ${tx.transaction_type === 'credit' ? 'text-green-600' : 'text-red-500'}`}>
                  {tx.transaction_type === 'credit' ? '+' : '-'}₹{tx.amount}
                </span>
              </div>
            ))}
          </div>
        )}
        {mobileView === 'profile' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border text-center shadow-sm">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-xl font-bold">{profile.name}</h2>
              <code className="block mt-2 bg-gray-100 py-1 rounded text-sm mb-4">{profile.referral_code}</code>
              <Button variant="destructive" onClick={handleLogout} className="w-full">Logout</Button>
            </div>
          </div>
        )}
      </div>

      {/* DESKTOP CONTENT RENDERER */}
      <div className="hidden md:block">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500">Welcome back, {profile.name}</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleLogout}><LogOut className="w-4 h-4 mr-2" /> Logout</Button>
            <Button onClick={() => setIsWithdrawModalOpen(true)}>Withdraw Funds</Button>
          </div>
        </div>

        <StatsSection profile={profile} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <AssignedProductsSection products={assignedProducts} referralCode={profile.referral_code} />

            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-bold mb-4">Recent Commissions</h3>
              {/* Simple Table */}
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="p-3">Order ID</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Commission</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.slice(0, 5).map(c => (
                    <tr key={c.id} className="border-t">
                      <td className="p-3">#{c.order_id.slice(0, 8)}</td>
                      <td className="p-3">{new Date(c.created_at || Date.now()).toLocaleDateString()}</td>
                      <td className="p-3">₹{c.order_amount}</td>
                      <td className="p-3 font-bold text-green-600">₹{c.commission_amount}</td>
                      <td className="p-3 capitalize">{c.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {commissions.length === 0 && <p className="text-center py-4 text-gray-400">No data found</p>}
            </div>
          </div>

          <div className="space-y-6">
            <ReferralSection referralLink={generalReferralLink} />
            <CommissionRateCard profile={profile} />
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-2 pb-safe z-50 flex justify-around items-center shadow-lg">
        <NavButton icon={Home} label="Home" active={mobileView === 'home'} onClick={() => setMobileView('home')} />
        <NavButton icon={List} label="Earnings" active={mobileView === 'earnings'} onClick={() => setMobileView('earnings')} />
        <NavButton icon={Wallet} label="Wallet" active={mobileView === 'wallet'} onClick={() => setMobileView('wallet')} />
        <NavButton icon={User} label="Profile" active={mobileView === 'profile'} onClick={() => setMobileView('profile')} />
      </div>

      {/* Withdraw Modal */}
      <Dialog open={isWithdrawModalOpen} onOpenChange={setIsWithdrawModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Withdraw Funds</DialogTitle>
            <DialogDescription>Available Balance: ₹{(profile.wallet_balance || 0).toFixed(2)}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <select className="w-full h-10 rounded-md border px-3 bg-background" value={withdrawMethod} onChange={e => setWithdrawMethod(e.target.value)}>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Details (UPI ID / Account No)</Label>
              <Input value={paymentDetails} onChange={e => setPaymentDetails(e.target.value)} placeholder="e.g. 9876543210@upi" />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsWithdrawModalOpen(false)}>Cancel</Button>
            <Button onClick={handleWithdraw}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AffiliateLayout>
  );
}

// Helpers
function StatCard({ icon, label, value, color }: any) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    pink: 'bg-pink-50 text-pink-600 border-pink-100',
  };
  return (
    <div className="bg-white p-4 rounded-xl border shadow-sm flex items-center gap-3">
      <div className={`p-3 rounded-lg border ${colors[color]} shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground truncate uppercase font-semibold">{label}</p>
        <p className="text-xl font-bold truncate">{value}</p>
      </div>
    </div>
  );
}

function NavButton({ icon: Icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center w-full p-2 rounded-xl transition-colors ${active ? 'text-primary bg-primary/10' : 'text-gray-500 hover:bg-gray-100'}`}>
      <Icon className={`w-6 h-6 ${active ? 'fill-current' : ''}`} />
      <span className="text-[10px] font-medium mt-1">{label}</span>
    </button>
  )
}
