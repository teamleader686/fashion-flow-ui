import { X } from 'lucide-react';
import { useCouponUsages } from '@/hooks/useCoupons';
import type { Coupon } from '@/types/coupon';

interface Props {
  open: boolean;
  onClose: () => void;
  coupon: Coupon | null;
}

export default function CouponUsageDialog({ open, onClose, coupon }: Props) {
  const { usages, loading } = useCouponUsages(coupon?.id);

  if (!open || !coupon) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Coupon Usage History</h2>
            <p className="text-sm text-gray-600 mt-1">
              Code: <span className="font-mono font-semibold text-pink-600">{coupon.code}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-600 font-medium">Total Usage</div>
              <div className="text-2xl font-bold text-blue-900">{coupon.total_usage_count}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-600 font-medium">Total Discount</div>
              <div className="text-2xl font-bold text-green-900">₹{coupon.total_discount_given}</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-purple-600 font-medium">Usage Limit</div>
              <div className="text-2xl font-bold text-purple-900">
                {coupon.usage_limit || '∞'}
              </div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-sm text-orange-600 font-medium">Per User</div>
              <div className="text-2xl font-bold text-orange-900">{coupon.usage_per_user}</div>
            </div>
          </div>

          {/* Usage List */}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
            </div>
          ) : usages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No usage history yet
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Order ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        User ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Discount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Used At
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {usages.map((usage) => (
                      <tr key={usage.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-mono text-gray-900">
                          {usage.order_id.slice(0, 8)}...
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-600">
                          {usage.user_id.slice(0, 8)}...
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-green-600">
                          ₹{usage.discount_amount}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(usage.used_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {usages.map((usage) => (
                  <div key={usage.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm text-gray-600">Order ID</div>
                      <div className="text-sm font-mono">{usage.order_id.slice(0, 12)}...</div>
                    </div>
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm text-gray-600">Discount</div>
                      <div className="text-sm font-semibold text-green-600">₹{usage.discount_amount}</div>
                    </div>
                    <div className="flex justify-between items-start">
                      <div className="text-sm text-gray-600">Used At</div>
                      <div className="text-sm">{new Date(usage.used_at).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
