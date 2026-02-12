import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useCoupons } from '@/hooks/useCoupons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Coupon, CouponFormData } from '@/types/coupon';

interface Props {
  open: boolean;
  onClose: () => void;
  coupon: Coupon | null;
}

export default function CouponFormDialog({ open, onClose, coupon }: Props) {
  const { createCoupon, updateCoupon } = useCoupons();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CouponFormData>({
    code: '',
    type: 'flat',
    value: 0,
    min_order_amount: 0,
    max_discount: null,
    start_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    usage_limit: null,
    usage_per_user: 1,
    applicable_type: 'all',
    applicable_ids: [],
    user_restriction: 'all',
    restricted_user_ids: [],
    status: 'active'
  });

  useEffect(() => {
    if (coupon) {
      setFormData({
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        min_order_amount: coupon.min_order_amount,
        max_discount: coupon.max_discount,
        start_date: coupon.start_date.split('T')[0],
        expiry_date: coupon.expiry_date.split('T')[0],
        usage_limit: coupon.usage_limit,
        usage_per_user: coupon.usage_per_user,
        applicable_type: coupon.applicable_type,
        applicable_ids: coupon.applicable_ids || [],
        user_restriction: coupon.user_restriction,
        restricted_user_ids: coupon.restricted_user_ids || [],
        status: coupon.status
      });
    } else {
      setFormData({
        code: '',
        type: 'flat',
        value: 0,
        min_order_amount: 0,
        max_discount: null,
        start_date: new Date().toISOString().split('T')[0],
        expiry_date: '',
        usage_limit: null,
        usage_per_user: 1,
        applicable_type: 'all',
        applicable_ids: [],
        user_restriction: 'all',
        restricted_user_ids: [],
        status: 'active'
      });
    }
  }, [coupon, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (coupon) {
        await updateCoupon(coupon.id, formData);
      } else {
        await createCoupon(formData);
      }
      onClose();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">
            {coupon ? 'Edit Coupon' : 'Create New Coupon'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="code">Coupon Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="SAVE50"
                required
                disabled={!!coupon}
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Discount Type & Value */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Discount Type *</Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-md"
                required
              >
                <option value="flat">Flat Discount (₹)</option>
                <option value="percentage">Percentage (%)</option>
              </select>
            </div>

            <div>
              <Label htmlFor="value">
                Discount Value * {formData.type === 'percentage' && '(%)'}
              </Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                required
              />
            </div>
          </div>

          {/* Min Order & Max Discount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="min_order">Minimum Order Amount (₹)</Label>
              <Input
                id="min_order"
                type="number"
                step="0.01"
                value={formData.min_order_amount}
                onChange={(e) => setFormData({ ...formData, min_order_amount: parseFloat(e.target.value) })}
              />
            </div>

            {formData.type === 'percentage' && (
              <div>
                <Label htmlFor="max_discount">Maximum Discount (₹)</Label>
                <Input
                  id="max_discount"
                  type="number"
                  step="0.01"
                  value={formData.max_discount || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    max_discount: e.target.value ? parseFloat(e.target.value) : null 
                  })}
                  placeholder="Optional"
                />
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="expiry_date">Expiry Date *</Label>
              <Input
                id="expiry_date"
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Usage Limits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="usage_limit">Total Usage Limit</Label>
              <Input
                id="usage_limit"
                type="number"
                value={formData.usage_limit || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  usage_limit: e.target.value ? parseInt(e.target.value) : null 
                })}
                placeholder="Unlimited"
              />
            </div>

            <div>
              <Label htmlFor="usage_per_user">Usage Per User *</Label>
              <Input
                id="usage_per_user"
                type="number"
                value={formData.usage_per_user}
                onChange={(e) => setFormData({ ...formData, usage_per_user: parseInt(e.target.value) })}
                required
                min="1"
              />
            </div>
          </div>

          {/* Applicable Type */}
          <div>
            <Label htmlFor="applicable_type">Applicable To</Label>
            <select
              id="applicable_type"
              value={formData.applicable_type}
              onChange={(e) => setFormData({ ...formData, applicable_type: e.target.value as any })}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="all">All Products</option>
              <option value="products">Specific Products</option>
              <option value="categories">Specific Categories</option>
            </select>
          </div>

          {/* User Restriction */}
          <div>
            <Label htmlFor="user_restriction">User Restriction</Label>
            <select
              id="user_restriction"
              value={formData.user_restriction}
              onChange={(e) => setFormData({ ...formData, user_restriction: e.target.value as any })}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="all">All Users</option>
              <option value="new">New Users Only</option>
              <option value="specific">Specific Users</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'Saving...' : coupon ? 'Update Coupon' : 'Create Coupon'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
