import { ShimmerCard, ShimmerText, ShimmerButton } from '@/components/ui/shimmer';

export function OrderCardSkeleton() {
  return (
    <div className="border rounded-lg p-4 sm:p-6 space-y-4 bg-card">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-2 flex-1">
          <ShimmerText className="w-32 h-5" />
          <ShimmerText className="w-48 h-4" />
        </div>
        <ShimmerCard className="w-24 h-6 rounded-full" />
      </div>

      {/* Product Info */}
      <div className="flex gap-4">
        <ShimmerCard className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <ShimmerText className="w-3/4" />
          <ShimmerText className="w-1/2 h-3" />
          <ShimmerText className="w-1/3 h-5" />
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
        <ShimmerButton className="flex-1" />
        <ShimmerButton className="flex-1" />
      </div>
    </div>
  );
}

export function OrderListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <OrderCardSkeleton key={i} />
      ))}
    </div>
  );
}
