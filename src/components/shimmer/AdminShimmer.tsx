import { Shimmer, ShimmerText, ShimmerCard } from '@/components/ui/shimmer';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Reusable stat card shimmer
export function StatsCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-${Math.min(count, 6)} gap-3 sm:gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <ShimmerText className="w-20 h-3 mb-2" />
            <Shimmer className="w-16 h-7 rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Dashboard shimmer with cards + charts
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {Array.from({ length: 7 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
              <ShimmerText className="w-20 h-3" />
              <Shimmer className="w-5 h-5 rounded" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <ShimmerText className="w-16 h-7" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <ShimmerText className="w-32 h-5" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <ShimmerCard key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader><ShimmerText className="w-40 h-5" /></CardHeader>
          <CardContent><Shimmer className="w-full h-64 rounded-lg" /></CardContent>
        </Card>
        <Card>
          <CardHeader><ShimmerText className="w-40 h-5" /></CardHeader>
          <CardContent><Shimmer className="w-full h-64 rounded-lg" /></CardContent>
        </Card>
      </div>
    </div>
  );
}

// Generic table shimmer
export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {Array.from({ length: cols }).map((_, i) => (
                <TableHead key={i}>
                  <ShimmerText className="w-20 h-4" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }).map((_, ri) => (
              <TableRow key={ri}>
                {Array.from({ length: cols }).map((_, ci) => (
                  <TableCell key={ci}>
                    <ShimmerText className={`h-4 ${ci === 0 ? 'w-32' : 'w-20'}`} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between">
                <ShimmerText className="w-32 h-5" />
                <ShimmerCard className="w-16 h-6 rounded-full" />
              </div>
              <ShimmerText className="w-full h-4" />
              <ShimmerText className="w-2/3 h-4" />
              <div className="flex gap-2">
                <Shimmer className="h-8 w-20 rounded-md" />
                <Shimmer className="h-8 w-20 rounded-md" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

// Order card shimmer
export function OrderCardsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <ShimmerText className="w-28 h-5" />
                <ShimmerText className="w-36 h-3" />
              </div>
              <ShimmerCard className="w-20 h-6 rounded-full" />
            </div>
            <div className="flex items-center gap-3">
              <Shimmer className="w-16 h-16 rounded" />
              <div className="flex-1 space-y-2">
                <ShimmerText className="w-3/4 h-4" />
                <ShimmerText className="w-1/2 h-3" />
              </div>
            </div>
            <div className="flex justify-between">
              <ShimmerText className="w-20 h-4" />
              <ShimmerText className="w-16 h-4" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Customer list shimmer
export function CustomerListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="grid gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex justify-between">
              <ShimmerText className="w-32 h-5" />
              <ShimmerCard className="w-16 h-6 rounded-full" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <ShimmerText className="w-48 h-4" />
            <ShimmerText className="w-32 h-4" />
            <ShimmerText className="w-40 h-4" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Cancellation request shimmer
export function CancellationSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="divide-y">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 sm:p-6 space-y-3">
          <div className="flex justify-between">
            <div className="space-y-2">
              <ShimmerText className="w-36 h-5" />
              <ShimmerText className="w-48 h-3" />
            </div>
            <Shimmer className="h-8 w-20 rounded-md" />
          </div>
          <ShimmerText className="w-full h-4" />
          <ShimmerText className="w-1/3 h-3" />
        </div>
      ))}
    </div>
  );
}
