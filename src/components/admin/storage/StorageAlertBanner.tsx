import { useStorageStats } from '@/hooks/useStorageStats';
import { AlertTriangle, HardDrive } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface StorageAlertBannerProps {
    /** Compact mode for dialogs and tight spaces */
    compact?: boolean;
    /** Show even if storage is not critical (always show usage info) */
    alwaysShow?: boolean;
    /** Custom class name */
    className?: string;
}

export default function StorageAlertBanner({
    compact = false,
    alwaysShow = false,
    className = '',
}: StorageAlertBannerProps) {
    const { stats, loading } = useStorageStats();
    const navigate = useNavigate();

    if (loading) return null;

    const { usagePercentage, usedStorage, totalStorage, remainingStorage } = stats;

    // Don't show if usage is low and alwaysShow is false
    if (!alwaysShow && usagePercentage < 80) return null;

    const isCritical = usagePercentage >= 90;
    const isWarning = usagePercentage >= 80;

    const formatSize = (sizeInMB: number) => {
        if (sizeInMB >= 1024) return `${(sizeInMB / 1024).toFixed(1)} GB`;
        return `${sizeInMB.toFixed(1)} MB`;
    };

    // Compact mode — small inline alert
    if (compact) {
        if (!isWarning && !alwaysShow) return null;

        return (
            <div
                className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg cursor-pointer transition-colors ${isCritical
                        ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                        : isWarning
                            ? 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100'
                            : 'bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100'
                    } ${className}`}
                onClick={() => navigate('/admin/store/storage')}
                title="Click to view storage details"
            >
                {isWarning ? (
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                ) : (
                    <HardDrive className="h-3.5 w-3.5 shrink-0" />
                )}
                <span className="font-medium">
                    {isCritical
                        ? `⚠️ Storage critical: ${usagePercentage.toFixed(0)}% used`
                        : isWarning
                            ? `Storage high: ${usagePercentage.toFixed(0)}% used`
                            : `Storage: ${formatSize(usedStorage)} / ${formatSize(totalStorage)}`}
                </span>
                <span className="text-[10px] opacity-70">
                    ({formatSize(remainingStorage)} left)
                </span>
            </div>
        );
    }

    // Full mode — detailed banner
    return (
        <div
            className={`rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${isCritical
                    ? 'bg-gradient-to-r from-red-50 to-red-100 border border-red-200'
                    : isWarning
                        ? 'bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200'
                        : 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200'
                } ${className}`}
            onClick={() => navigate('/admin/store/storage')}
            title="Click to view storage details"
        >
            <div className="flex items-start gap-3">
                <div
                    className={`p-2 rounded-lg shrink-0 ${isCritical
                            ? 'bg-red-500/10'
                            : isWarning
                                ? 'bg-orange-500/10'
                                : 'bg-blue-500/10'
                        }`}
                >
                    {isWarning ? (
                        <AlertTriangle
                            className={`h-5 w-5 ${isCritical ? 'text-red-600' : 'text-orange-600'
                                }`}
                        />
                    ) : (
                        <HardDrive className="h-5 w-5 text-blue-600" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <p
                            className={`font-semibold text-sm ${isCritical
                                    ? 'text-red-800'
                                    : isWarning
                                        ? 'text-orange-800'
                                        : 'text-blue-800'
                                }`}
                        >
                            {isCritical
                                ? '🚨 Storage Almost Full!'
                                : isWarning
                                    ? '⚠️ Storage Usage High'
                                    : '💾 Storage Usage'}
                        </p>
                        <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${isCritical
                                    ? 'bg-red-200 text-red-800'
                                    : isWarning
                                        ? 'bg-orange-200 text-orange-800'
                                        : 'bg-blue-200 text-blue-800'
                                }`}
                        >
                            {usagePercentage.toFixed(1)}%
                        </span>
                    </div>
                    <p
                        className={`text-xs mb-2 ${isCritical
                                ? 'text-red-600'
                                : isWarning
                                    ? 'text-orange-600'
                                    : 'text-blue-600'
                            }`}
                    >
                        {isCritical
                            ? 'Immediately manage storage — delete unused images or upgrade plan.'
                            : isWarning
                                ? 'Consider cleaning up old images or compressing new uploads.'
                                : `${formatSize(usedStorage)} of ${formatSize(totalStorage)} used.`}
                    </p>
                    {/* Progress bar */}
                    <div className="w-full h-2 bg-white/80 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${isCritical
                                    ? 'bg-red-500'
                                    : isWarning
                                        ? 'bg-orange-500'
                                        : 'bg-blue-500'
                                }`}
                            style={{ width: `${Math.min(100, usagePercentage)}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-1">
                        <span className="text-[10px] opacity-60">
                            {formatSize(usedStorage)} used
                        </span>
                        <span className="text-[10px] opacity-60">
                            {formatSize(remainingStorage)} free
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
