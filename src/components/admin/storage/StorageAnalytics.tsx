import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    TrendingUp,
    TrendingDown,
    BarChart3,
    Clock,
    FileUp,
    FileDown,
    Activity,
} from 'lucide-react';
import type { StorageBreakdownItem, DailyUsageItem, TopUsageItem } from '@/hooks/useStorageStats';

interface StorageAnalyticsProps {
    moduleBreakdown: StorageBreakdownItem[];
    dailyUsage: DailyUsageItem[];
    topUsage: TopUsageItem[];
    logsTotalKB: number;
    logsUploadCount: number;
    logsDeleteCount: number;
    loading?: boolean;
}

export default function StorageAnalytics({
    moduleBreakdown,
    dailyUsage,
    topUsage,
    logsTotalKB,
    logsUploadCount,
    logsDeleteCount,
    loading = false,
}: StorageAnalyticsProps) {
    const formatSize = (sizeInKB: number) => {
        if (Math.abs(sizeInKB) >= 1024 * 1024) return `${(sizeInKB / (1024 * 1024)).toFixed(2)} GB`;
        if (Math.abs(sizeInKB) >= 1024) return `${(sizeInKB / 1024).toFixed(2)} MB`;
        return `${sizeInKB.toFixed(1)} KB`;
    };

    const formatModuleName = (name: string) => {
        return name
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (l) => l.toUpperCase());
    };

    const moduleColors: Record<string, string> = {
        product_images: 'bg-blue-500',
        category_images: 'bg-purple-500',
        avatars: 'bg-green-500',
        products: 'bg-indigo-500',
        orders: 'bg-amber-500',
        order_items: 'bg-yellow-500',
        categories: 'bg-pink-500',
        sliders: 'bg-rose-500',
        website_assets: 'bg-teal-500',
        users: 'bg-cyan-500',
        user_profiles: 'bg-sky-500',
        other: 'bg-gray-500',
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="animate-pulse">
                    <CardHeader><CardTitle>Loading...</CardTitle></CardHeader>
                    <CardContent><div className="h-48 bg-gray-100 rounded" /></CardContent>
                </Card>
                <Card className="animate-pulse">
                    <CardHeader><CardTitle>Loading...</CardTitle></CardHeader>
                    <CardContent><div className="h-48 bg-gray-100 rounded" /></CardContent>
                </Card>
            </div>
        );
    }

    // If no logs data available yet
    const hasData = moduleBreakdown.length > 0 || dailyUsage.length > 0;

    return (
        <div className="space-y-6">
            {/* Summary Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                            <Activity className="h-3.5 w-3.5" />
                            Logged Usage
                        </div>
                        <p className="text-xl font-bold">{formatSize(logsTotalKB)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                            <FileUp className="h-3.5 w-3.5 text-green-500" />
                            Uploads
                        </div>
                        <p className="text-xl font-bold text-green-600">{logsUploadCount}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                            <FileDown className="h-3.5 w-3.5 text-red-500" />
                            Deletions
                        </div>
                        <p className="text-xl font-bold text-red-600">{logsDeleteCount}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                            <BarChart3 className="h-3.5 w-3.5" />
                            Modules Tracked
                        </div>
                        <p className="text-xl font-bold">{moduleBreakdown.length}</p>
                    </CardContent>
                </Card>
            </div>

            {!hasData && (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Activity className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
                        <h3 className="font-semibold text-lg mb-2">No Storage Logs Yet</h3>
                        <p className="text-muted-foreground text-sm max-w-md mx-auto">
                            Storage analytics will appear here once CRUD operations are performed.
                            Make sure the <code className="bg-muted px-1 py-0.5 rounded text-xs">storage_logs</code> table and RPC functions are created in Supabase.
                        </p>
                    </CardContent>
                </Card>
            )}

            {hasData && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Module Breakdown */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <BarChart3 className="h-5 w-5" />
                                Module-wise Storage
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {moduleBreakdown.map((item) => {
                                const color = moduleColors[item.module] || 'bg-gray-500';
                                const maxKB = Math.max(...moduleBreakdown.map((m) => Math.abs(m.totalKB)), 1);
                                const barWidth = Math.abs(item.totalKB) / maxKB * 100;

                                return (
                                    <div key={item.module} className="space-y-1.5">
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded-full ${color}`} />
                                                <span className="font-medium">{formatModuleName(item.module)}</span>
                                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                                    {item.logCount} ops
                                                </Badge>
                                            </div>
                                            <span className={`font-semibold ${item.totalKB < 0 ? 'text-red-500' : ''}`}>
                                                {item.totalKB >= 0 ? '' : '-'}{formatSize(Math.abs(item.totalKB))}
                                            </span>
                                        </div>
                                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${color}`}
                                                style={{ width: `${Math.max(2, barWidth)}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>

                    {/* Daily Usage Trend */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <TrendingUp className="h-5 w-5" />
                                Daily Activity (Last 30 Days)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {dailyUsage.length === 0 ? (
                                <p className="text-muted-foreground text-sm text-center py-8">
                                    No daily data available yet
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {/* Simple bar chart */}
                                    <div className="flex items-end gap-0.5 h-32">
                                        {dailyUsage.slice(-14).map((day, idx) => {
                                            const maxTotalKB = Math.max(...dailyUsage.map(d => Math.abs(d.totalKB)), 1);
                                            const height = (Math.abs(day.totalKB) / maxTotalKB) * 100;
                                            const isNegative = day.totalKB < 0;

                                            return (
                                                <div
                                                    key={idx}
                                                    className="flex-1 flex flex-col justify-end items-center group relative"
                                                >
                                                    <div
                                                        className={`w-full rounded-t transition-all duration-300 cursor-pointer 
                              ${isNegative ? 'bg-red-400 hover:bg-red-500' : 'bg-teal-400 hover:bg-teal-500'}`}
                                                        style={{ height: `${Math.max(4, height)}%` }}
                                                    />
                                                    {/* Tooltip */}
                                                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                                        <p className="font-semibold">{new Date(day.day).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                                                        <p>{formatSize(Math.abs(day.totalKB))}</p>
                                                        <p>↑{day.uploadCount} ↓{day.deleteCount}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {/* Date labels */}
                                    <div className="flex gap-0.5 text-[9px] text-muted-foreground">
                                        {dailyUsage.slice(-14).map((day, idx) => (
                                            <div key={idx} className="flex-1 text-center truncate">
                                                {idx === 0 || idx === dailyUsage.slice(-14).length - 1
                                                    ? new Date(day.day).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                                                    : ''}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Top Storage Consumers */}
                    {topUsage.length > 0 && (
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <TrendingDown className="h-5 w-5" />
                                    Top Storage Consumers
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b text-muted-foreground">
                                                <th className="text-left py-2 px-2">#</th>
                                                <th className="text-left py-2 px-2">Module</th>
                                                <th className="text-left py-2 px-2">Action</th>
                                                <th className="text-right py-2 px-2">Size</th>
                                                <th className="text-left py-2 px-2">File / Record</th>
                                                <th className="text-left py-2 px-2">
                                                    <Clock className="h-3.5 w-3.5 inline" /> Time
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {topUsage.map((item, idx) => (
                                                <tr key={idx} className="border-b last:border-0 hover:bg-muted/50">
                                                    <td className="py-2 px-2 text-muted-foreground">{idx + 1}</td>
                                                    <td className="py-2 px-2">
                                                        <Badge variant="outline" className="text-xs">
                                                            {formatModuleName(item.module)}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-2 px-2">
                                                        <Badge
                                                            variant={item.action === 'upload' ? 'default' : 'secondary'}
                                                            className="text-xs"
                                                        >
                                                            {item.action}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-2 px-2 text-right font-mono font-semibold">
                                                        {formatSize(item.sizeKB)}
                                                    </td>
                                                    <td className="py-2 px-2 text-xs text-muted-foreground max-w-[200px] truncate">
                                                        {item.filePath || item.recordId || '—'}
                                                    </td>
                                                    <td className="py-2 px-2 text-xs text-muted-foreground">
                                                        {new Date(item.createdAt).toLocaleString('en-IN', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}
