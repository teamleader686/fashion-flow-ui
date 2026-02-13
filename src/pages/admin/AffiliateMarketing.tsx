import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Plus, Users, MousePointerClick, ShoppingCart, DollarSign, Edit, Trash2, Power, Copy, Check } from 'lucide-react';
import { useAffiliateMarketing } from '@/hooks/useAffiliateMarketing';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Affiliate, AffiliateStats } from '@/types/affiliate';
import { StatsCardsSkeleton, TableSkeleton } from '@/components/shimmer/AdminShimmer';
import AdminPagination from '@/components/admin/AdminPagination';
import { usePagination } from '@/hooks/usePagination';

const ITEMS_PER_PAGE = 10;

export default function AffiliateMarketing() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAffiliate, setEditingAffiliate] = useState<Affiliate | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { loading, getAffiliates, getAffiliateStats, createAffiliate, updateAffiliate, deleteAffiliate } = useAffiliateMarketing();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [affiliatesRes, statsData] = await Promise.all([getAffiliates(), getAffiliateStats()]);
    if (affiliatesRes.success) setAffiliates(affiliatesRes.data || []);
    setStats(statsData);
  };

  const { currentPage, totalPages, paginatedItems, handlePageChange, startIndex, endIndex, totalItems } = usePagination(affiliates, { itemsPerPage: ITEMS_PER_PAGE });

  const handleCopyReferralCode = (code: string) => {
    navigator.clipboard.writeText(`${window.location.origin}?ref=${code}`);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleStatus = async (affiliate: Affiliate) => {
    const result = await updateAffiliate(affiliate.id, { status: affiliate.status === 'active' ? 'inactive' : 'active' });
    if (result.success) loadData();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure?')) { const result = await deleteAffiliate(id); if (result.success) loadData(); }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Affiliate Marketing</h1>
            <p className="text-muted-foreground mt-1">Manage affiliates, track performance & commissions</p>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" /> Add Affiliate
          </Button>
        </div>

        {loading ? (
          <StatsCardsSkeleton count={4} />
        ) : stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Users, color: 'bg-blue-100', iconColor: 'text-blue-600', value: stats.totalAffiliates, label: `${stats.activeAffiliates} active` },
              { icon: MousePointerClick, color: 'bg-purple-100', iconColor: 'text-purple-600', value: stats.totalClicks, label: 'Total Clicks' },
              { icon: ShoppingCart, color: 'bg-green-100', iconColor: 'text-green-600', value: stats.totalOrders, label: `₹${stats.totalSales.toFixed(0)}` },
              { icon: DollarSign, color: 'bg-pink-100', iconColor: 'text-pink-600', value: `₹${stats.totalCommission.toFixed(0)}`, label: `₹${stats.pendingCommission.toFixed(0)} pending` },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <Card key={i}><CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${s.color}`}><Icon className={`w-5 h-5 ${s.iconColor}`} /></div>
                    <div><div className="text-2xl font-bold">{s.value}</div><div className="text-sm text-muted-foreground">{s.label}</div></div>
                  </div>
                </CardContent></Card>
              );
            })}
          </div>
        )}

        {loading ? (
          <TableSkeleton rows={ITEMS_PER_PAGE} cols={7} />
        ) : affiliates.length === 0 ? (
          <Card><CardContent className="py-12 text-center"><p className="text-muted-foreground">No affiliates found</p></CardContent></Card>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block">
              <Card><CardContent className="p-0"><div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b bg-muted/50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Referral Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Commission</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Performance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
                  </tr></thead>
                  <tbody className="divide-y">
                    {paginatedItems.map((affiliate) => (
                      <tr key={affiliate.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 font-medium">{affiliate.name}</td>
                        <td className="px-6 py-4 text-sm"><div>{affiliate.email}</div><div className="text-muted-foreground">{affiliate.mobile}</div></td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <code className="text-sm bg-muted px-2 py-1 rounded">{affiliate.referral_code}</code>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopyReferralCode(affiliate.referral_code)}>
                              {copiedCode === affiliate.referral_code ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                            </Button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">{affiliate.commission_type === 'percentage' ? `${affiliate.commission_value}%` : `₹${affiliate.commission_value}`}</td>
                        <td className="px-6 py-4 text-sm"><div>{affiliate.total_clicks} clicks · {affiliate.total_orders} orders</div><div className="font-medium text-green-600">₹{affiliate.total_commission.toFixed(2)}</div></td>
                        <td className="px-6 py-4"><Badge variant={affiliate.status === 'active' ? 'default' : 'secondary'}>{affiliate.status}</Badge></td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setEditingAffiliate(affiliate)}><Edit className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleToggleStatus(affiliate)}><Power className={`w-4 h-4 ${affiliate.status === 'active' ? 'text-orange-600' : 'text-green-600'}`} /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(affiliate.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div></CardContent></Card>
            </div>

            {/* Mobile/Tablet Cards */}
            <div className="lg:hidden space-y-3">
              {paginatedItems.map((affiliate) => (
                <Card key={affiliate.id}><CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div><h3 className="font-semibold">{affiliate.name}</h3><p className="text-sm text-muted-foreground">{affiliate.email}</p><p className="text-sm text-muted-foreground">{affiliate.mobile}</p></div>
                    <Badge variant={affiliate.status === 'active' ? 'default' : 'secondary'}>{affiliate.status}</Badge>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <code className="text-sm bg-muted px-2 py-1 rounded flex-1">{affiliate.referral_code}</code>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopyReferralCode(affiliate.referral_code)}>
                      {copiedCode === affiliate.referral_code ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                    <div><p className="text-muted-foreground">Commission</p><p className="font-medium">{affiliate.commission_type === 'percentage' ? `${affiliate.commission_value}%` : `₹${affiliate.commission_value}`}</p></div>
                    <div><p className="text-muted-foreground">Clicks</p><p className="font-medium">{affiliate.total_clicks}</p></div>
                    <div><p className="text-muted-foreground">Orders</p><p className="font-medium">{affiliate.total_orders}</p></div>
                    <div><p className="text-muted-foreground">Earned</p><p className="font-medium text-green-600">₹{affiliate.total_commission.toFixed(2)}</p></div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditingAffiliate(affiliate)} className="flex-1"><Edit className="w-4 h-4 mr-1" /> Edit</Button>
                    <Button variant="outline" size="sm" onClick={() => handleToggleStatus(affiliate)} className="flex-1"><Power className="w-4 h-4 mr-1" />{affiliate.status === 'active' ? 'Deactivate' : 'Activate'}</Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(affiliate.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </CardContent></Card>
              ))}
            </div>

            <AdminPagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} startIndex={startIndex} endIndex={endIndex} totalItems={totalItems} label="affiliates" />
          </>
        )}

        {(showAddModal || editingAffiliate) && (
          <AffiliateFormModal affiliate={editingAffiliate} onClose={() => { setShowAddModal(false); setEditingAffiliate(null); }} onSuccess={() => { setShowAddModal(false); setEditingAffiliate(null); loadData(); }} />
        )}
      </div>
    </AdminLayout>
  );
}

function AffiliateFormModal({ affiliate, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    name: affiliate?.name || '', email: affiliate?.email || '', mobile: affiliate?.mobile || '',
    password: '', commission_type: affiliate?.commission_type || 'percentage',
    commission_value: affiliate?.commission_value || 10, status: affiliate?.status || 'active',
  });
  const { createAffiliate, updateAffiliate, loading } = useAffiliateMarketing();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updateData = { name: formData.name, mobile: formData.mobile, commission_type: formData.commission_type, commission_value: formData.commission_value, status: formData.status };
    const result = affiliate ? await updateAffiliate(affiliate.id, updateData) : await createAffiliate(formData);
    if (result.success) onSuccess(); else alert(`Error: ${result.error}`);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-lg max-w-md w-full p-6 shadow-xl">
        <h2 className="text-xl font-bold mb-4">{affiliate ? 'Edit Affiliate' : 'Add New Affiliate'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">Name</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary" required /></div>
          <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary" required disabled={!!affiliate} /></div>
          <div><label className="block text-sm font-medium mb-1">Mobile</label><input type="tel" value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary" required /></div>
          <div><label className="block text-sm font-medium mb-1">Commission Type</label><select value={formData.commission_type} onChange={(e) => setFormData({ ...formData, commission_type: e.target.value as any })} className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary"><option value="percentage">Percentage</option><option value="flat">Flat Amount</option></select></div>
          <div><label className="block text-sm font-medium mb-1">Commission Value {formData.commission_type === 'percentage' ? '(%)' : '(₹)'}</label><input type="number" step="0.01" value={formData.commission_value} onChange={(e) => setFormData({ ...formData, commission_value: parseFloat(e.target.value) })} className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary" required /></div>
          <div><label className="block text-sm font-medium mb-1">Status</label><select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary"><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={loading} className="flex-1">{loading ? 'Saving...' : affiliate ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
