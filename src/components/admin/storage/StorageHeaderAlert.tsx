import { useStorageStats } from '@/hooks/useStorageStats';
import { HardDrive } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

/**
 * A small icon button for the admin header that shows a storage warning
 * when usage is >= 80%. Invisible below 80%.
 */
export default function StorageHeaderAlert() {
    const { stats, loading } = useStorageStats();
    const navigate = useNavigate();

    if (loading) return null;

    const { usagePercentage, usedStorage, totalStorage } = stats;

    // Only show when storage is getting high
    if (usagePercentage < 80) return null;

    const isCritical = usagePercentage >= 90;

    const formatSize = (sizeInMB: number) => {
        if (sizeInMB >= 1024) return `${(sizeInMB / 1024).toFixed(1)} GB`;
        return `${sizeInMB.toFixed(1)} MB`;
    };

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="relative h-9 w-9"
                        onClick={() => navigate('/admin/store/storage')}
                    >
                        <HardDrive
                            className={`h-5 w-5 ${isCritical ? 'text-red-500' : 'text-orange-500'
                                }`}
                        />
                        {/* Pulsing dot */}
                        <span
                            className={`absolute top-1 right-1 flex h-2.5 w-2.5`}
                        >
                            <span
                                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isCritical ? 'bg-red-400' : 'bg-orange-400'
                                    }`}
                            />
                            <span
                                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isCritical ? 'bg-red-500' : 'bg-orange-500'
                                    }`}
                            />
                        </span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent
                    side="bottom"
                    className={`${isCritical
                            ? 'bg-red-600 text-white'
                            : 'bg-orange-600 text-white'
                        }`}
                >
                    <p className="font-semibold text-xs">
                        {isCritical ? '🚨 Storage Critical!' : '⚠️ Storage High'}
                    </p>
                    <p className="text-[10px] opacity-90">
                        {formatSize(usedStorage)} / {formatSize(totalStorage)} (
                        {usagePercentage.toFixed(1)}%)
                    </p>
                    <p className="text-[10px] opacity-75 mt-0.5">Click to manage →</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
