import { ShimmerCard, ShimmerText, ShimmerButton } from '@/components/ui/shimmer';

export function ProductCardSkeleton() {
  return (
    <div className="group relative overflow-hidden rounded-lg border bg-card">
      {/* Image Skeleton */}
      <ShimmerCard className="aspect-square" />

      {/* Content */}
      <div className="p-3 sm:p-4 space-y-2">
        {/* Title */}
        <ShimmerText className="w-3/4" />

        {/* Price */}
        <div className="flex items-center gap-2">
          <ShimmerText className="w-20 h-5" />
          <ShimmerText className="w-16 h-4" />
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1">
          <ShimmerText className="w-12 h-4" />
          <ShimmerText className="w-16 h-3" />
        </div>

        {/* Button */}
        <ShimmerButton className="w-full" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
