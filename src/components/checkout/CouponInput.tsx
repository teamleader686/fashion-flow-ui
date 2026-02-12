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
  onCouponRemoved: () => void;
  appliedCoupon: CouponValidationResult | null;
}

export default function CouponInput({
  userId,
  cartTotal,
  productIds,
  onCouponApplied,
  onCouponRemoved,
  appliedCoupon
}: Props) {
  const [couponCode, setCouponCode] = useState('');
  const [error, setError] = useState('');
  const { validateCoupon, validating } = useValidateCoupon();

  const handleApply = async () => {
    if (!couponCode.trim()) {
      setError('Please enter a coupon code');
      return;
    }

    setError('');
    const result = await validateCoupon(couponCode, userId, cartTotal, productIds);

    if (result.valid) {
      onCouponApplied(result);
      setCouponCode('');
    } else {
      setError(result.error || 'Invalid coupon');
    }
  };

  const handleRemove = () => {
    onCouponRemoved();
    setCouponCode('');
    setError('');
  };

  if (appliedCoupon?.valid) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="bg-green-100 p-2 rounded-full">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="font-semibold text-green-900">
                Coupon Applied: {appliedCoupon.code}
              </div>
              <div className="text-sm text-green-700 mt-1">
                You saved ₹{appliedCoupon.discount?.toFixed(2)}
              </div>
            </div>
          </div>
          <button
            onClick={handleRemove}
            className="text-green-600 hover:text-green-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
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
        Have a coupon? Enter the code above to get discount
      </div>
    </div>
  );
}
