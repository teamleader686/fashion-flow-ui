import { useState, useEffect } from 'react';
import CloudImage from '@/components/ui/CloudImage';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase, Product } from '@/lib/supabase';
import { Plus, Search, Edit, Trash2, Eye, EyeOff, Package } from 'lucide-react';
import { toast } from 'sonner';
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
import { useNavigate } from 'react-router-dom';
import ProductTableSkeleton from '@/components/shimmer/ProductTableSkeleton';
import ProductCardsSkeleton from '@/components/shimmer/ProductCardsSkeleton';
import { Pagination, PaginationCompact } from '@/components/ui/pagination';

const ITEMS_PER_PAGE = 10;

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();

    // Setup realtime subscription
    const subscription = supabase
      .channel('products_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          fetchProducts();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentPage, searchQuery]);

  const fetchProducts = async () => {
    try {
      setLoading(true);

      // Calculate range for pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      // Build query
      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name),
          product_images(id, image_url, is_primary),
          loyalty_config:product_loyalty_config(*),
          affiliate_config:product_affiliate_config(*),
          active_offer:product_offers(*)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      // Add search filter if query exists
      if (searchQuery.trim()) {
        query = query.or(`name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%`);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      setProducts(data || []);
      setTotalCount(count || 0);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 300);
    }
  };

  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !currentStatus })
        .eq('id', productId);

      if (error) throw error;

      toast.success(`Product ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchProducts();
    } catch (error: any) {
      toast.error('Failed to update product status');
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productToDelete);

      if (error) throw error;

      toast.success('Product deleted successfully');
      setDeleteDialogOpen(false);
      setProductToDelete(null);
      fetchProducts();
    } catch (error: any) {
      toast.error('Failed to delete product');
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page on search
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const getPrimaryImage = (product: Product) => {
    const primaryImage = product.product_images?.find(img => img.is_primary);
    return primaryImage?.image_url || product.product_images?.[0]?.image_url || '/placeholder.svg';
  };

  const getActiveOffer = (product: Product) => {
    if (!product.active_offer || !Array.isArray(product.active_offer)) return null;

    const now = new Date();
    return product.active_offer.find(offer => {
      const start = new Date(offer.start_date);
      const end = new Date(offer.end_date);
      return offer.is_active && now >= start && now <= end;
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Products</h1>
            <p className="text-gray-500 mt-1">Manage your product catalog</p>
          </div>
          <Button
            onClick={() => navigate('/admin/products/new')}
            className="bg-gradient-to-r from-pink-500 to-purple-600 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                Total Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{totalCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                Active Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-green-600">
                {products.filter(p => p.is_active).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                Low Stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-orange-600">
                {products.filter(p => p.stock_quantity <= p.low_stock_threshold).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                With Offers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-purple-600">
                {products.filter(p => getActiveOffer(p)).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products by name or SKU..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardContent className="pt-4 sm:pt-6">
            {loading ? (
              <>
                <ProductTableSkeleton rows={ITEMS_PER_PAGE} />
                <ProductCardsSkeleton count={ITEMS_PER_PAGE} />
              </>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">
                  {searchQuery ? 'No products found' : 'No products yet'}
                </p>
                <p className="text-gray-400 text-sm mb-4">
                  {searchQuery
                    ? 'Try adjusting your search'
                    : 'Start by adding your first product'}
                </p>
                {!searchQuery && (
                  <Button
                    onClick={() => navigate('/admin/products/new')}
                    variant="outline"
                    className="mt-2"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Product
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Shipping</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Variants</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Features</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => {
                        const activeOffer = getActiveOffer(product);
                        const hasLoyalty = product.loyalty_config?.[0]?.is_enabled;
                        const hasAffiliate = product.affiliate_config?.[0]?.is_enabled;
                        return (
                          <TableRow key={product.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <CloudImage
                                  src={getPrimaryImage(product)}
                                  alt={product.name}
                                  className="w-12 h-12 rounded shrink-0"
                                  imageClassName="w-full h-full object-cover"
                                />
                                <div>
                                  <div className="font-medium">{product.name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {product.category?.name || 'Uncategorized'}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {product.sku || 'N/A'}
                              </code>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">
                                ₹{product.price.toLocaleString()}
                              </div>
                              {activeOffer && (
                                <div className="text-xs text-green-600">
                                  {activeOffer.banner_tag}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {product.shipping_charge > 0 ? (
                                <span className="font-medium">₹{product.shipping_charge}</span>
                              ) : (
                                <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">Free</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  product.stock_quantity <= product.low_stock_threshold
                                    ? 'destructive'
                                    : 'secondary'
                                }
                              >
                                {product.stock_quantity}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {product.available_sizes && product.available_sizes.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {product.available_sizes.slice(0, 3).map((size: string) => (
                                      <Badge key={size} variant="outline" className="text-xs">
                                        {size}
                                      </Badge>
                                    ))}
                                    {product.available_sizes.length > 3 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{product.available_sizes.length - 3}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                                {product.available_colors && product.available_colors.length > 0 && (
                                  <div className="flex gap-1">
                                    {product.available_colors.slice(0, 4).map((color: any) => (
                                      <div
                                        key={color.name}
                                        className="w-5 h-5 rounded-full border border-gray-300"
                                        style={{ backgroundColor: color.hex }}
                                        title={color.name}
                                      />
                                    ))}
                                    {product.available_colors.length > 4 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{product.available_colors.length - 4}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                                {(!product.available_sizes || product.available_sizes.length === 0) &&
                                  (!product.available_colors || product.available_colors.length === 0) && (
                                    <span className="text-xs text-gray-400">No variants</span>
                                  )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={product.is_active ? 'default' : 'secondary'}>
                                {product.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {hasLoyalty && (
                                  <Badge variant="outline" className="text-xs">
                                    🪙 Loyalty
                                  </Badge>
                                )}
                                {hasAffiliate && (
                                  <Badge variant="outline" className="text-xs">
                                    🤝 Affiliate
                                  </Badge>
                                )}
                                {activeOffer && (
                                  <Badge variant="outline" className="text-xs text-green-600">
                                    🎁 Offer
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    toggleProductStatus(product.id, product.is_active)
                                  }
                                >
                                  {product.is_active ? (
                                    <Eye className="h-4 w-4" />
                                  ) : (
                                    <EyeOff className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    navigate(`/admin/products/edit/${product.id}`)
                                  }
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setProductToDelete(product.id);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile/Tablet Cards */}
                <div className="lg:hidden space-y-3">
                  {products.map((product) => {
                    const activeOffer = getActiveOffer(product);
                    const hasLoyalty = product.loyalty_config?.[0]?.is_enabled;
                    const hasAffiliate = product.affiliate_config?.[0]?.is_enabled;
                    return (
                      <div key={product.id} className="flex gap-3 p-3 border rounded-lg">
                        <CloudImage
                          src={getPrimaryImage(product)}
                          alt={product.name}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded shrink-0"
                          imageClassName="w-full h-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="font-medium truncate">{product.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {product.category?.name || 'Uncategorized'}
                              </p>
                            </div>
                            <Badge
                              variant={product.is_active ? 'default' : 'secondary'}
                              className="shrink-0 text-xs"
                            >
                              {product.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-2 text-sm">
                            <span className="font-semibold">
                              ₹{product.price.toLocaleString()}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {product.shipping_charge > 0
                                ? `+ ₹${product.shipping_charge} ship`
                                : 'Free shipping'}
                            </span>
                            <Badge
                              variant={
                                product.stock_quantity <= product.low_stock_threshold
                                  ? 'destructive'
                                  : 'secondary'
                              }
                              className="text-xs"
                            >
                              Stock: {product.stock_quantity}
                            </Badge>
                          </div>
                          {/* Variants Display */}
                          {((product.available_sizes && product.available_sizes.length > 0) ||
                            (product.available_colors && product.available_colors.length > 0)) && (
                              <div className="mt-2 space-y-1">
                                {product.available_sizes && product.available_sizes.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {product.available_sizes.slice(0, 4).map((size: string) => (
                                      <Badge key={size} variant="outline" className="text-xs">
                                        {size}
                                      </Badge>
                                    ))}
                                    {product.available_sizes.length > 4 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{product.available_sizes.length - 4}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                                {product.available_colors && product.available_colors.length > 0 && (
                                  <div className="flex gap-1">
                                    {product.available_colors.slice(0, 5).map((color: any) => (
                                      <div
                                        key={color.name}
                                        className="w-5 h-5 rounded-full border border-gray-300"
                                        style={{ backgroundColor: color.hex }}
                                        title={color.name}
                                      />
                                    ))}
                                    {product.available_colors.length > 5 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{product.available_colors.length - 5}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          {(hasLoyalty || hasAffiliate || activeOffer) && (
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {hasLoyalty && (
                                <Badge variant="outline" className="text-xs">
                                  🪙
                                </Badge>
                              )}
                              {hasAffiliate && (
                                <Badge variant="outline" className="text-xs">
                                  🤝
                                </Badge>
                              )}
                              {activeOffer && (
                                <Badge variant="outline" className="text-xs text-green-600">
                                  🎁
                                </Badge>
                              )}
                            </div>
                          )}
                          <div className="flex gap-1 mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleProductStatus(product.id, product.is_active)}
                            >
                              {product.is_active ? (
                                <EyeOff className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setProductToDelete(product.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 space-y-4">
                    {/* Desktop Pagination */}
                    <div className="hidden sm:block">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                      />
                    </div>

                    {/* Mobile Pagination */}
                    <div className="sm:hidden">
                      <PaginationCompact
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                      />
                    </div>

                    {/* Results Info */}
                    <div className="text-center text-sm text-muted-foreground">
                      Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
                      {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount}{' '}
                      products
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminProducts;
