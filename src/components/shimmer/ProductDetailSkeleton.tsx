import { ShimmerCard, ShimmerText, ShimmerButton, ShimmerCircle } from '@/components/ui/shimmer';

export function ProductDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
        {/* Image Gallery */}
        <div className="space-y-4">
          {/* Main Image */}
          <ShimmerCard className="w-full aspect-square rounded-lg" />
          
          {/* Thumbnail Images */}
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <ShimmerCard key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Title & Rating */}
          <div className="space-y-3">
            <ShimmerText className="w-3/4 h-8" />
            <ShimmerText className="w-1/2 h-6" />
            <div className="flex items-center gap-2">
              <ShimmerText className="w-24 h-5" />
              <ShimmerText className="w-32 h-4" />
            </div>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <div className="flex items-baseline gap-3">
              <ShimmerText className="w-32 h-10" />
              <ShimmerText className="w-24 h-6" />
            </div>
            <ShimmerText className="w-48 h-4" />
          </div>

          {/* Size Selection */}
          <div className="space-y-3">
            <ShimmerText className="w-24 h-5" />
            <div className="flex gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <ShimmerCard key={i} className="w-12 h-12 rounded-lg" />
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div className="space-y-3">
            <ShimmerText className="w-24 h-5" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <ShimmerCircle key={i} className="w-10 h-10" />
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <ShimmerButton className="flex-1 h-12" />
            <ShimmerButton className="flex-1 h-12" />
          </div>

          {/* Description */}
          <div className="space-y-2 pt-6 border-t">
            <ShimmerText className="w-32 h-6" />
            <ShimmerText className="w-full h-4" />
            <ShimmerText className="w-full h-4" />
            <ShimmerText className="w-3/4 h-4" />
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12 space-y-6">
        <ShimmerText className="w-48 h-8" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <ShimmerCircle className="w-10 h-10" />
                <div className="flex-1 space-y-2">
                  <ShimmerText className="w-32 h-4" />
                  <ShimmerText className="w-24 h-3" />
                </div>
              </div>
              <ShimmerText className="w-full h-4" />
              <ShimmerText className="w-3/4 h-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
