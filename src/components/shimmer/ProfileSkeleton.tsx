import { ShimmerCard, ShimmerText, ShimmerButton, ShimmerCircle } from '@/components/ui/shimmer';

export function ProfileSkeleton() {
  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header */}
        <div className="border rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-4">
            <ShimmerCircle className="w-20 h-20" />
            <div className="flex-1 space-y-2">
              <ShimmerText className="w-48 h-6" />
              <ShimmerText className="w-64 h-4" />
            </div>
            <ShimmerButton className="w-24 h-10" />
          </div>
        </div>

        {/* Profile Form */}
        <div className="border rounded-lg p-6 space-y-6">
          <ShimmerText className="w-40 h-6" />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <ShimmerText className="w-24 h-4" />
                <ShimmerCard className="w-full h-10 rounded" />
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-4">
            <ShimmerButton className="w-32" />
            <ShimmerButton className="w-32" />
          </div>
        </div>

        {/* Address Section */}
        <div className="border rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <ShimmerText className="w-40 h-6" />
            <ShimmerButton className="w-32" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-4 space-y-2">
                <ShimmerText className="w-32 h-5" />
                <ShimmerText className="w-full h-4" />
                <ShimmerText className="w-3/4 h-4" />
                <div className="flex gap-2 pt-2">
                  <ShimmerButton className="w-16 h-8" />
                  <ShimmerButton className="w-16 h-8" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
