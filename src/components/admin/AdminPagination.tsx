import { Pagination, PaginationCompact } from '@/components/ui/pagination';

interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  startIndex: number;
  endIndex: number;
  totalItems: number;
  label?: string;
}

export default function AdminPagination({
  currentPage,
  totalPages,
  onPageChange,
  startIndex,
  endIndex,
  totalItems,
  label = 'items',
}: AdminPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-6 space-y-3">
      <div className="hidden sm:block">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </div>
      <div className="sm:hidden">
        <PaginationCompact
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </div>
      <div className="text-center text-sm text-muted-foreground">
        Showing {startIndex} to {endIndex} of {totalItems} {label}
      </div>
    </div>
  );
}
