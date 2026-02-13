import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import CategoryDialog from '@/components/admin/CategoryDialog';
import { Plus, Search, Edit, Trash2, Package, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { ShimmerText, ShimmerCard } from '@/components/ui/shimmer';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  status: 'active' | 'inactive';
  display_order: number;
  created_at: string;
  updated_at: string;
  product_count?: number;
}

export default function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  useEffect(() => {
    fetchCategories();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('categories_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories',
        },
        () => {
          console.log('Category updated');
          fetchCategories();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);

      // Fetch categories with product count
      const { data, error } = await supabase
        .from('categories_with_count')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;

      setCategories(data || []);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedCategory(null);
    setDialogOpen(true);
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setDialogOpen(true);
  };

  const handleDelete = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;

    try {
      // Check if category has products
      if (categoryToDelete.product_count && categoryToDelete.product_count > 0) {
        toast.error(
          `Cannot delete category with ${categoryToDelete.product_count} products. Please reassign or delete products first.`
        );
        setDeleteDialogOpen(false);
        return;
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryToDelete.id);

      if (error) throw error;

      toast.success('Category deleted successfully');
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      fetchCategories();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast.error(error.message || 'Failed to delete category');
    }
  };

  const toggleStatus = async (category: Category) => {
    try {
      const newStatus = category.status === 'active' ? 'inactive' : 'active';

      const { error } = await supabase
        .from('categories')
        .update({ status: newStatus })
        .eq('id', category.id);

      if (error) throw error;

      toast.success(`Category ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      fetchCategories();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Category Management</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Manage product categories and assignments
            </p>
          </div>
          <Button onClick={handleCreate} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Package className="h-4 w-4 text-primary" />
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <p className="text-2xl font-bold">{categories.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Eye className="h-4 w-4 text-green-600" />
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
              <p className="text-2xl font-bold">
                {categories.filter((c) => c.status === 'active').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <EyeOff className="h-4 w-4 text-gray-600" />
                <p className="text-xs text-muted-foreground">Inactive</p>
              </div>
              <p className="text-2xl font-bold">
                {categories.filter((c) => c.status === 'inactive').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Package className="h-4 w-4 text-blue-600" />
                <p className="text-xs text-muted-foreground">Products</p>
              </div>
              <p className="text-2xl font-bold">
                {categories.reduce((sum, c) => sum + (c.product_count || 0), 0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Desktop Table */}
        <Card className="hidden md:block">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><ShimmerText className="w-32 h-4" /></TableCell>
                      <TableCell><ShimmerText className="w-24 h-4" /></TableCell>
                      <TableCell><ShimmerText className="w-16 h-4" /></TableCell>
                      <TableCell><ShimmerCard className="w-16 h-6 rounded-full" /></TableCell>
                      <TableCell><ShimmerText className="w-12 h-4" /></TableCell>
                      <TableCell><ShimmerText className="w-20 h-4" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No categories found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-sm">
                        {category.slug}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{category.product_count || 0}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={category.status === 'active' ? 'default' : 'secondary'}
                          className="cursor-pointer"
                          onClick={() => toggleStatus(category)}
                        >
                          {category.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{category.display_order}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(category)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(category)}
                            disabled={!!category.product_count && category.product_count > 0}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-3">
                  <ShimmerText className="w-32 h-5" />
                  <ShimmerText className="w-full h-4" />
                  <div className="flex gap-2">
                    <ShimmerCard className="w-16 h-6 rounded-full" />
                    <ShimmerCard className="w-16 h-6 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredCategories.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No categories found
              </CardContent>
            </Card>
          ) : (
            filteredCategories.map((category) => (
              <Card key={category.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold">{category.name}</h3>
                      <p className="text-sm text-muted-foreground font-mono">{category.slug}</p>
                    </div>
                    <Badge variant={category.status === 'active' ? 'default' : 'secondary'}>
                      {category.status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <span>{category.product_count || 0} products</span>
                    <span>Order: {category.display_order}</span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(category)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleStatus(category)}
                      className="flex-1"
                    >
                      {category.status === 'active' ? (
                        <><EyeOff className="h-4 w-4 mr-1" />Deactivate</>
                      ) : (
                        <><Eye className="h-4 w-4 mr-1" />Activate</>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(category)}
                      disabled={!!category.product_count && category.product_count > 0}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Category Dialog */}
      <CategoryDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setSelectedCategory(null);
        }}
        category={selectedCategory}
        onSuccess={fetchCategories}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{categoryToDelete?.name}"? This action cannot be
              undone.
              {categoryToDelete?.product_count && categoryToDelete.product_count > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  This category has {categoryToDelete.product_count} products assigned. Please
                  reassign or delete them first.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={!!categoryToDelete?.product_count && categoryToDelete.product_count > 0}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
