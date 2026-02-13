import { ShimmerCard, ShimmerText, ShimmerButton } from '@/components/ui/shimmer';

export function CheckoutSkeleton() {
  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <ShimmerText className="w-48 h-8 mb-6" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Checkout Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Address */}
          <div className="border rounded-lg p-6 space-y-4">
            <ShimmerText className="w-40 h-6" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <ShimmerText className="w-24 h-4" />
                <ShimmerCard className="w-full h-10 rounded" />
              </div>
              <div className="space-y-2">
                <ShimmerText className="w-24 h-4" />
                <ShimmerCard className="w-full h-10 rounded" />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <ShimmerText className="w-24 h-4" />
                <ShimmerCard className="w-full h-10 rounded" />
              </div>
              <div className="space-y-2">
                <ShimmerText className="w-24 h-4" />
                <ShimmerCard className="w-full h-10 rounded" />
              </div>
              <div className="space-y-2">
                <ShimmerText className="w-24 h-4" />
                <ShimmerCard className="w-full h-10 rounded" />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="border rounded-lg p-6 space-y-4">
            <ShimmerText className="w-40 h-6" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <ShimmerCard key={i} className="w-full h-16 rounded-lg" />
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="border rounded-lg p-6 space-y-4 sticky top-4">
            <ShimmerText className="w-32 h-6" />
            
            {/* Items */}
            <div className="space-y-3 py-4 border-y">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <ShimmerCard className="w-16 h-16 rounded" />
                  <div className="flex-1 space-y-2">
                    <ShimmerText className="w-full h-4" />
                    <ShimmerText className="w-20 h-4" />
                  </div>
                </div>
              ))}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-3 py-4 border-b">
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
