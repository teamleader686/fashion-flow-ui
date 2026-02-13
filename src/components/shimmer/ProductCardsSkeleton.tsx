import { Skeleton } from '@/components/ui/skeleton';

interface ProductCardsSkeletonProps {
  count?: number;
}

export default function ProductCardsSkeleton({ count = 10 }: ProductCardsSkeletonProps) {
  return (
    <div className="lg:hidden space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex gap-3 p-3 border rounded-lg">
          {/* Product Image */}
          <Skeleton className="w-16 h-16 rounded shrink-0" />
          
          {/* Product Info */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Title and Badge */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 space-y-2 flex-1">
                <Skeleton className="h-4 w-full max-w-[200px]" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-5 w-14 rounded-full shrink-0" />
            </div>
            
            {/* Price and Stock */}
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-1">
              <Skeleton className="h-8 w-16 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
