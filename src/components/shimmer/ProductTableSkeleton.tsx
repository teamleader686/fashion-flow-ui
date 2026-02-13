import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ProductTableSkeletonProps {
  rows?: number;
}

export default function ProductTableSkeleton({ rows = 10 }: ProductTableSkeletonProps) {
  return (
    <div className="hidden lg:block overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Features</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, index) => (
            <TableRow key={index}>
              {/* Product */}
              <TableCell>
                <div className="flex items-center gap-3">
                  <Skeleton className="w-12 h-12 rounded" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </TableCell>
              {/* SKU */}
              <TableCell>
                <Skeleton className="h-6 w-20 rounded" />
              </TableCell>
              {/* Price */}
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
              {/* Stock */}
              <TableCell>
                <Skeleton className="h-6 w-12 rounded-full" />
              </TableCell>
              {/* Status */}
              <TableCell>
                <Skeleton className="h-6 w-16 rounded-full" />
              </TableCell>
              {/* Features */}
              <TableCell>
                <div className="flex gap-1">
                  <Skeleton className="h-5 w-16 rounded" />
                  <Skeleton className="h-5 w-16 rounded" />
                </div>
              </TableCell>
              {/* Actions */}
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
