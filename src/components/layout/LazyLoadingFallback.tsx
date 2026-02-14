import { Shimmer } from "@/components/ui/shimmer";

export const PageLoadingFallback = () => {
    return (
        <div className="w-full min-h-[60vh] flex flex-col gap-8 p-4 md:p-8 animate-in fade-in duration-500">
            {/* Banner Shimmer */}
            <Shimmer className="w-full h-48 md:h-64 rounded-xl" />

            <div className="flex flex-col gap-4">
                <Shimmer className="w-48 h-8 rounded-md" />
                <Shimmer className="w-full h-4 rounded-md" />
                <Shimmer className="w-3/4 h-4 rounded-md" />
            </div>

            {/* Grid Shimmer */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex flex-col gap-3">
                        <Shimmer className="aspect-[3/4] rounded-lg" />
                        <Shimmer className="w-full h-4 rounded" />
                        <Shimmer className="w-1/2 h-4 rounded" />
                    </div>
                ))}
            </div>
        </div>
    );
};

export const SectionLoadingFallback = () => {
    return (
        <div className="w-full p-4 flex flex-col gap-4">
            <Shimmer className="w-32 h-6 rounded" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <Shimmer key={i} className="aspect-square rounded-lg" />
                ))}
            </div>
        </div>
    );
};
