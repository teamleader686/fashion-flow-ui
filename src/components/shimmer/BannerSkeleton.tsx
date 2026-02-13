import { ShimmerCard } from '@/components/ui/shimmer';

export function BannerSkeleton() {
  return (
    <div className="relative w-full">
      {/* Desktop Banner */}
      <div className="hidden md:block">
        <ShimmerCard className="w-full h-[400px] lg:h-[500px]" />
      </div>

      {/* Mobile Banner */}
      <div className="md:hidden">
        <ShimmerCard className="w-full h-[300px]" />
      </div>
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
