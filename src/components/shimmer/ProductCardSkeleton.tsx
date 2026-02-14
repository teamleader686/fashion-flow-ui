import { ShimmerCard, ShimmerText } from '@/components/ui/shimmer';

export function ProductCardSkeleton() {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white">
      {/* Image Skeleton */}
      <ShimmerCard className="aspect-square rounded-t-2xl" />

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <ShimmerText className="w-3/4 h-5 rounded-lg" />

        {/* Price Row */}
        <div className="flex items-center gap-2">
          <ShimmerText className="w-24 h-6 rounded-lg" />
          <ShimmerText className="w-16 h-4 rounded-lg" />
        </div>

        {/* Loyalty Tag */}
        <ShimmerText className="w-1/2 h-5 rounded-lg opacity-50" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
