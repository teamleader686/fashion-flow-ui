import { useState } from 'react';
import { Plus, Edit, Trash2, Eye, Search } from 'lucide-react';
import { useCoupons } from '@/hooks/useCoupons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CouponFormDialog from '@/components/admin/coupons/CouponFormDialog';
import CouponUsageDialog from '@/components/admin/coupons/CouponUsageDialog';
import type { Coupon } from '@/types/coupon';

export default function CouponManagement() {
  const { coupons, loading, deleteCoupon } = useCoupons();
  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [usageOpen, setUsageOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  const filteredCoupons = coupons.filter(coupon =>
    coupon.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setFormOpen(true);
  };

  const handleViewUsage = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setUsageOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this coupon?')) {
      try {
        await deleteCoupon(id);
      } catch (error: any) {
        alert(error.message);
      }
    }
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setSelectedCoupon(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupon Management</h1>
          <p className="text-gray-600 mt-1">Create and manage discount coupons</p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Create Coupon
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          type="text"
          placeholder="Search coupons..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCoupons.map((coupon) => (
              <tr key={coupon.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="font-mono font-semibold text-pink-600">{coupon.code}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap capitalize">{coupon.type}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {coupon.type === 'flat' ? `₹${coupon.value}` : `${coupon.value}%`}
                  {coupon.max_discount && <span className="text-xs text-gray-500"> (max ₹{coupon.max_discount})</span>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {coupon.total_usage_count}
                  {coupon.usage_limit && ` / ${coupon.usage_limit}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {new Date(coupon.expiry_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    coupon.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {coupon.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewUsage(coupon)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(coupon)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(coupon.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile/Tablet Cards */}
      <div className="lg:hidden space-y-4">
        {filteredCoupons.map((coupon) => (
          <div key={coupon.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="font-mono font-bold text-lg text-pink-600">{coupon.code}</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-600 capitalize">{coupon.type}</span>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    coupon.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {coupon.status}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">
                  {coupon.type === 'flat' ? `₹${coupon.value}` : `${coupon.value}%`}
                </div>
                {coupon.max_discount && (
                  <div className="text-xs text-gray-500">max ₹{coupon.max_discount}</div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
              <div>
                <span className="text-gray-500">Usage:</span>
                <span className="ml-1 font-medium">
                  {coupon.total_usage_count}
                  {coupon.usage_limit && ` / ${coupon.usage_limit}`}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Expiry:</span>
                <span className="ml-1 font-medium">
                  {new Date(coupon.expiry_date).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewUsage(coupon)}
                className="flex-1"
              >
                <Eye className="w-4 h-4 mr-1" />
                Usage
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(coupon)}
                className="flex-1"
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(coupon.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredCoupons.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No coupons found</p>
        </div>
      )}

      {/* Dialogs */}
      <CouponFormDialog
        open={formOpen}
        onClose={handleCloseForm}
        coupon={selectedCoupon}
      />

      <CouponUsageDialog
        open={usageOpen}
        onClose={() => {
          setUsageOpen(false);
          setSelectedCoupon(null);
        }}
        coupon={selectedCoupon}
      />
    </div>
  );
}
