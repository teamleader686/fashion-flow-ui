import { useState } from 'react';
import { Tag, X, Check } from 'lucide-react';
import { useValidateCoupon } from '@/hooks/useCoupons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { CouponValidationResult } from '@/types/coupon';

interface Props {
  userId: string;
  cartTotal: number;
  productIds: string[];
  onCouponApplied: (result: CouponValidationResult) => void;
  onCouponRemoved: (code: string) => void;
  appliedCoupons: CouponValidationResult[];
}

export default function CouponInput({
  userId,
  cartTotal,
  productIds,
  onCouponApplied,
  onCouponRemoved,
  appliedCoupons = []
}: Props) {
  const [couponCode, setCouponCode] = useState('');
  const [error, setError] = useState('');
  const { validateCoupon, validating } = useValidateCoupon();

  const handleApply = async () => {
    if (!couponCode.trim()) {
      setError('Please enter a coupon code');
      return;
    }

    if (appliedCoupons.length >= 3) {
      setError('Maximum 3 coupons allowed per order');
      return;
    }

    setError('');
    const appliedCodes = appliedCoupons.map(c => c.code || '');
    const result = await validateCoupon(couponCode, userId, cartTotal, productIds, appliedCodes);

    if (result.valid) {
      onCouponApplied(result);
      setCouponCode('');
    } else {
      setError(result.error || 'Invalid coupon');
    }
  };

  return (
    <div className="space-y-4">
      {/* Applied Coupons List */}
      {appliedCoupons.length > 0 && (
        <div className="space-y-2">
          {appliedCoupons.map((coupon) => (
            <div key={coupon.code} className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-1.5 rounded-full">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-green-900 text-sm">
                      {coupon.code} Applied
                      {coupon.is_affiliate_coupon && (
                        <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full uppercase">
                          Affiliate
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-green-700">
                      Saved ₹{coupon.discount?.toFixed(2)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onCouponRemoved(coupon.code || '')}
                  className="text-green-600 hover:text-green-700 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input Field */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Enter coupon code"
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value.toUpperCase());
                setError('');
              }}
              className="pl-10 uppercase"
              disabled={validating}
            />
          </div>
          <Button
            onClick={handleApply}
            disabled={validating || !couponCode.trim()}
            className="whitespace-nowrap"
          >
            {validating ? 'Checking...' : 'Apply'}
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="text-xs text-gray-500">
          Have a coupon? Enter the code above to get discount. (Max 3 allowed)
        </div>
      </div>
    </div>
  );
}
