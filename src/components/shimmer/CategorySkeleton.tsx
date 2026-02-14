import { ShimmerCircle, ShimmerText } from "@/components/ui/shimmer";

export const CategorySkeleton = () => {
    return (
        <section className="py-4 lg:py-8 overflow-hidden">
            <div className="container px-0 sm:px-6">
                <div className="flex gap-4 sm:gap-8 overflow-hidden pt-2 pb-4 px-4 sm:px-0 lg:justify-center">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex flex-col items-center gap-3 flex-shrink-0">
                            <ShimmerCircle className="w-16 h-16 sm:w-20 sm:h-20 lg:w-28 lg:h-28" />
                            <ShimmerText className="w-12 sm:w-16 h-3" />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
