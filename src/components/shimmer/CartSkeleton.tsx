import { ShimmerCard, ShimmerText, ShimmerButton } from '@/components/ui/shimmer';

export function CartItemSkeleton() {
  return (
    <div className="flex gap-4 p-4 border rounded-lg bg-card">
      {/* Image */}
      <ShimmerCard className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg flex-shrink-0" />

      {/* Details */}
      <div className="flex-1 space-y-2">
        <ShimmerText className="w-3/4 h-5" />
        <ShimmerText className="w-1/2 h-4" />
        <div className="flex items-center gap-4 mt-2">
          <ShimmerCard className="w-24 h-8 rounded" />
          <ShimmerText className="w-20 h-6" />
        </div>
      </div>

      {/* Remove Button */}
      <ShimmerButton className="w-8 h-8 rounded" />
    </div>
  );
}

export function CartSkeleton() {
  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <ShimmerText className="w-48 h-8 mb-6" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <CartItemSkeleton key={i} />
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="border rounded-lg p-6 space-y-4 sticky top-4">
            <ShimmerText className="w-32 h-6" />
            <div className="space-y-3 py-4 border-y">
              <div className="flex justify-between">
                <ShimmerText className="w-24 h-4" />
                <ShimmerText className="w-20 h-4" />
              </div>
              <div className="flex justify-between">
                <ShimmerText className="w-24 h-4" />
                <ShimmerText className="w-20 h-4" />
              </div>
              <div className="flex justify-between">
                <ShimmerText className="w-24 h-4" />
                <ShimmerText className="w-20 h-4" />
              </div>
            </div>
            <div className="flex justify-between">
              <ShimmerText className="w-24 h-6" />
              <ShimmerText className="w-24 h-6" />
            </div>
            <ShimmerButton className="w-full h-12" />
          </div>
        </div>
      </div>
    </div>
  );
}
