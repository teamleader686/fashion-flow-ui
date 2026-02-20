import { useStorageStats } from '@/hooks/useStorageStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HardDrive, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function StorageDashboardCard() {
    const { stats, loading } = useStorageStats();
    const navigate = useNavigate();

    if (loading) {
        return (
            <Card className="hover:shadow-lg transition-shadow cursor-pointer animate-pulse">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
                    <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                        Storage
                    </CardTitle>
                    <div className="p-2 rounded-lg bg-gray-100">
                        <HardDrive className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    </div>
                </CardHeader>
                <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                    <div className="h-6 bg-gray-200 rounded w-20 mb-2" />
                    <div className="h-2 bg-gray-200 rounded" />
                </CardContent>
            </Card>
        );
    }

    const { usagePercentage, usedStorage, totalStorage, remainingStorage } = stats;
    const isCritical = usagePercentage >= 90;
    const isWarning = usagePercentage >= 80;

    const formatSize = (sizeInMB: number) => {
        if (sizeInMB >= 1024) return `${(sizeInMB / 1024).toFixed(1)} GB`;
        return `${sizeInMB.toFixed(1)} MB`;
    };

    const statusColor = isCritical
        ? 'text-red-600'
        : isWarning
            ? 'text-orange-600'
            : 'text-teal-600';

    const bgColor = isCritical
        ? 'bg-red-50'
        : isWarning
            ? 'bg-orange-50'
            : 'bg-teal-50';

    const barColor = isCritical
        ? 'bg-red-500'
        : isWarning
            ? 'bg-orange-500'
            : 'bg-teal-500';

    const Icon = isWarning ? AlertTriangle : HardDrive;

    return (
        <Card
            className="hover:shadow-lg transition-shadow cursor-pointer group"
            onClick={() => navigate('/admin/store/storage')}
        >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Storage Used
                </CardTitle>
                <div className={`p-2 rounded-lg ${bgColor}`}>
                    <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${statusColor} ${isCritical ? 'animate-pulse' : ''}`} />
                </div>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                <div className={`text-xl sm:text-2xl font-bold ${statusColor}`}>
                    {usagePercentage.toFixed(1)}%
                </div>
                {/* Mini progress bar */}
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mt-2">
                    <div
                        className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                        style={{ width: `${Math.min(100, usagePercentage)}%` }}
                    />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                    {formatSize(usedStorage)} / {formatSize(totalStorage)}
                </p>
                <p className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                    Click to view details →
                </p>
            </CardContent>
        </Card>
    );
}
