import { ShimmerCard } from '@/components/ui/shimmer';

export function BannerSkeleton() {
  return (
    <div className="px-4 py-4 md:px-0 md:py-0 w-full mb-4 md:mb-0">
      <ShimmerCard className="w-full aspect-[16/9] md:aspect-[21/7] rounded-2xl md:rounded-none" />
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="space-y-4">
      <BannerSkeleton />

      {/* Optional: Category Pills */}
      <div className="flex gap-2 overflow-hidden px-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <ShimmerCard key={i} className="h-10 w-24 flex-shrink-0 rounded-full" />
        ))}
      </div>
    </div>
  );
}
