import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ChevronLeft, ChevronRight, Search, Trash2, Edit, Eye } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  title: string;
  data: any[];
  columns: Column[];
  loading: boolean;
  page: number;
  totalPages: number;
  onNextPage: () => void;
  onPrevPage: () => void;
  onDelete?: (id: string) => Promise<void>;
  onEdit?: (row: any) => void;
  onView?: (row: any) => void;
  searchable?: boolean;
}

export default function DataTable({
  title,
  data,
  columns,
  loading,
  page,
  totalPages,
  onNextPage,
  onPrevPage,
  onDelete,
  onEdit,
  onView,
  searchable = true,
}: DataTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filteredData = searchQuery
    ? data.filter((row) =>
        Object.values(row).some((value) =>
          String(value).toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : data;

  const handleDelete = async () => {
    if (!deleteId || !onDelete) return;

    try {
      setDeleting(true);
      await onDelete(deleteId);
      setDeleteId(null);
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>{title}</CardTitle>
            {searchable && (
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead key={column.key}>{column.label}</TableHead>
                  ))}
                  {(onEdit || onView || onDelete) && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length + 1}
                      className="text-center text-muted-foreground py-8"
                    >
                      No data found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((row, index) => (
                    <TableRow key={row.id || index}>
                      {columns.map((column) => (
                        <TableCell key={column.key}>
                          {column.render
                            ? column.render(row[column.key], row)
                            : row[column.key]}
                        </TableCell>
                      ))}
                      {(onEdit || onView || onDelete) && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {onView && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => onView(row)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            {onEdit && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => onEdit(row)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {onDelete && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setDeleteId(row.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {filteredData.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No data found
              </div>
            ) : (
              filteredData.map((row, index) => (
                <Card key={row.id || index}>
                  <CardContent className="p-4 space-y-2">
                    {columns.map((column) => (
                      <div key={column.key} className="flex justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                          {column.label}:
                        </span>
                        <span className="text-sm">
                          {column.render
                            ? column.render(row[column.key], row)
                            : row[column.key]}
                        </span>
                      </div>
                    ))}
                    {(onEdit || onView || onDelete) && (
                      <div className="flex items-center gap-2 pt-2 border-t">
                        {onView && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onView(row)}
                            className="flex-1"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        )}
                        {onEdit && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onEdit(row)}
                            className="flex-1"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeleteId(row.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onPrevPage}
                  disabled={page === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onNextPage}
                  disabled={page >= totalPages - 1}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the record
              from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
