
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function ShimmerCard() {
    return (
        <Card className="animate-pulse">
            <CardHeader className="pb-2 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
        </Card>
    );
}

export function ShimmerList() {
    return (
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse p-4 flex gap-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-md"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export function ShimmerDashboard() {
    return (
        <div className="p-4 md:p-6 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <ShimmerCard key={i} />
                ))}
            </div>

            <Card>
                <CardHeader>
                    <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                </CardHeader>
                <CardContent>
                    <ShimmerList />
                </CardContent>
            </Card>
        </div>
    );
}
