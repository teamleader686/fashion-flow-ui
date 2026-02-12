import { useState, useEffect } from 'react';
import { Plus, Users, MousePointerClick, ShoppingCart, DollarSign, TrendingUp, Edit, Trash2, Power, Copy, Check } from 'lucide-react';
import { useAffiliateMarketing } from '@/hooks/useAffiliateMarketing';
import type { Affiliate, AffiliateStats } from '@/types/affiliate';

export default function AffiliateMarketing() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAffiliate, setEditingAffiliate] = useState<Affiliate | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { 
    loading, 
    getAffiliates, 
    getAffiliateStats, 
    createAffiliate, 
    updateAffiliate, 
    deleteAffiliate 
  } = useAffiliateMarketing();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [affiliatesRes, statsData] = await Promise.all([
      getAffiliates(),
      getAffiliateStats()
    ]);

    if (affiliatesRes.success) {
      setAffiliates(affiliatesRes.data || []);
    }
    setStats(statsData);
  };

  const handleCopyReferralCode = (code: string) => {
    navigator.clipboard.writeText(`${window.location.origin}?ref=${code}`);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleStatus = async (affiliate: Affiliate) => {
    const newStatus = affiliate.status === 'active' ? 'inactive' : 'active';
    const result = await updateAffiliate(affiliate.id, { status: newStatus });
    if (result.success) {
      loadData();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this affiliate?')) {
      const result = await deleteAffiliate(id);
      if (result.success) {
        loadData();
      }
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Affiliate Marketing</h1>
          <p className="text-gray-600 mt-1">Manage affiliates, track performance & commissions</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Affiliate
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={<Users className="w-6 h-6" />}
            label="Total Affiliates"
            value={stats.totalAffiliates}
            subValue={`${stats.activeAffiliates} active`}
            color="blue"
          />
          <StatCard
            icon={<MousePointerClick className="w-6 h-6" />}
            label="Total Clicks"
            value={stats.totalClicks}
            color="purple"
          />
          <StatCard
            icon={<ShoppingCart className="w-6 h-6" />}
            label="Total Orders"
            value={stats.totalOrders}
            subValue={`₹${stats.totalSales.toFixed(2)}`}
            color="green"
          />
          <StatCard
            icon={<DollarSign className="w-6 h-6" />}
            label="Total Commission"
            value={`₹${stats.totalCommission.toFixed(2)}`}
            subValue={`₹${stats.pendingCommission.toFixed(2)} pending`}
            color="pink"
          />
        </div>
      )}

      {/* Affiliates Table - Desktop */}
      <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referral Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performance</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {affiliates.map((affiliate) => (
              <tr key={affiliate.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{affiliate.name}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{affiliate.email}</div>
                  <div className="text-sm text-gray-500">{affiliate.mobile}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">{affiliate.referral_code}</code>
                    <button
                      onClick={() => handleCopyReferralCode(affiliate.referral_code)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {copiedCode === affiliate.referral_code ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm">
                    {affiliate.commission_type === 'percentage' 
                      ? `${affiliate.commission_value}%` 
                      : `₹${affiliate.commission_value}`}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm">
                    <div>{affiliate.total_clicks} clicks</div>
                    <div>{affiliate.total_orders} orders</div>
                    <div className="font-medium text-green-600">₹{affiliate.total_commission.toFixed(2)}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    affiliate.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {affiliate.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingAffiliate(affiliate)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(affiliate)}
                      className={affiliate.status === 'active' ? 'text-orange-600 hover:text-orange-800' : 'text-green-600 hover:text-green-800'}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(affiliate.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Affiliates Cards - Mobile/Tablet */}
      <div className="lg:hidden space-y-4">
        {affiliates.map((affiliate) => (
          <AffiliateCard
            key={affiliate.id}
            affiliate={affiliate}
            onEdit={setEditingAffiliate}
            onToggleStatus={handleToggleStatus}
            onDelete={handleDelete}
            onCopyCode={handleCopyReferralCode}
            copiedCode={copiedCode}
          />
        ))}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingAffiliate) && (
        <AffiliateFormModal
          affiliate={editingAffiliate}
          onClose={() => {
            setShowAddModal(false);
            setEditingAffiliate(null);
          }}
          onSuccess={() => {
            setShowAddModal(false);
            setEditingAffiliate(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({ icon, label, value, subValue, color }: any) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    green: 'bg-green-100 text-green-600',
    pink: 'bg-pink-100 text-pink-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      <div className="mt-4">
        <p className="text-sm text-gray-600">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {subValue && <p className="text-sm text-gray-500 mt-1">{subValue}</p>}
      </div>
    </div>
  );
}

// Affiliate Card Component (Mobile/Tablet)
function AffiliateCard({ affiliate, onEdit, onToggleStatus, onDelete, onCopyCode, copiedCode }: any) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{affiliate.name}</h3>
          <p className="text-sm text-gray-600">{affiliate.email}</p>
          <p className="text-sm text-gray-600">{affiliate.mobile}</p>
        </div>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
          affiliate.status === 'active' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {affiliate.status}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <code className="text-sm bg-gray-100 px-2 py-1 rounded flex-1">{affiliate.referral_code}</code>
        <button
          onClick={() => onCopyCode(affiliate.referral_code)}
          className="text-gray-400 hover:text-gray-600"
        >
          {copiedCode === affiliate.referral_code ? (
            <Check className="w-4 h-4 text-green-600" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
        <div>
          <p className="text-gray-600">Commission</p>
          <p className="font-medium">
            {affiliate.commission_type === 'percentage' 
              ? `${affiliate.commission_value}%` 
              : `₹${affiliate.commission_value}`}
          </p>
        </div>
        <div>
          <p className="text-gray-600">Clicks</p>
          <p className="font-medium">{affiliate.total_clicks}</p>
        </div>
        <div>
          <p className="text-gray-600">Orders</p>
          <p className="font-medium">{affiliate.total_orders}</p>
        </div>
        <div>
          <p className="text-gray-600">Earned</p>
          <p className="font-medium text-green-600">₹{affiliate.total_commission.toFixed(2)}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onEdit(affiliate)}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100"
        >
          <Edit className="w-4 h-4" />
          Edit
        </button>
        <button
          onClick={() => onToggleStatus(affiliate)}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg ${
            affiliate.status === 'active'
              ? 'bg-orange-50 text-orange-600 hover:bg-orange-100'
              : 'bg-green-50 text-green-600 hover:bg-green-100'
          }`}
        >
          <Power className="w-4 h-4" />
          {affiliate.status === 'active' ? 'Deactivate' : 'Activate'}
        </button>
        <button
          onClick={() => onDelete(affiliate.id)}
          className="flex items-center justify-center bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Affiliate Form Modal
function AffiliateFormModal({ affiliate, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    name: affiliate?.name || '',
    email: affiliate?.email || '',
    mobile: affiliate?.mobile || '',
    password: '',
    commission_type: affiliate?.commission_type || 'percentage',
    commission_value: affiliate?.commission_value || 10,
    status: affiliate?.status || 'active',
  });

  const { createAffiliate, updateAffiliate, loading } = useAffiliateMarketing();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare update data - only editable fields
    const updateData = {
      name: formData.name,
      mobile: formData.mobile,
      commission_type: formData.commission_type,
      commission_value: formData.commission_value,
      status: formData.status,
    };

    const result = affiliate
      ? await updateAffiliate(affiliate.id, updateData)
      : await createAffiliate(formData);

    if (result.success) {
      onSuccess();
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-4">
          {affiliate ? 'Edit Affiliate' : 'Add New Affiliate'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
              required
              disabled={!!affiliate}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
            <input
              type="tel"
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Note: Affiliate can register separately using this email
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Commission Type</label>
            <select
              value={formData.commission_type}
              onChange={(e) => setFormData({ ...formData, commission_type: e.target.value as any })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
            >
              <option value="percentage">Percentage</option>
              <option value="flat">Flat Amount</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Commission Value {formData.commission_type === 'percentage' ? '(%)' : '(₹)'}
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.commission_value}
              onChange={(e) => setFormData({ ...formData, commission_value: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : affiliate ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
