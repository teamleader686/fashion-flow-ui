import { useState, useEffect, useCallback, useRef } from 'react';
import CloudImage from '@/components/ui/CloudImage';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase, Product } from '@/lib/supabase';
import storageLogger from '@/lib/storageLogger';
import { Plus, Search, Edit, Trash2, Eye, EyeOff, Package, ExternalLink } from 'lucide-react';
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
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{ id: string; name: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    outOfStock: 0,
    withOffers: 0
  });
  const [totalCount, setTotalCount] = useState(0);
  const navigate = useNavigate();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search input — prevents API call on every keystroke
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      if (searchQuery !== debouncedSearch) return;

      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from('products')
        .select(`
            id,
            name,
            slug,
            sku,
            price,
            compare_at_price,
            stock_quantity,
            low_stock_threshold,
            is_active,
            is_featured,
            is_new_arrival,
            is_bestseller,
            description,
            short_description,
            created_at,
            updated_at,
            loyalty_coins_reward,
            shipping_charge,
            available_sizes,
            available_colors,
            category:categories(name),
            product_images(image_url, is_primary),
            is_offer_active,
            offer_type,
            offer_value,
            offer_start_date,
            offer_end_date,
            banner_tag,
            loyalty_config:product_loyalty_config(is_enabled),
            affiliate_config:product_affiliate_config(is_enabled)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (debouncedSearch.trim()) {
        query = query.or(`name.ilike.%${debouncedSearch}%,sku.ilike.%${debouncedSearch}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      setProducts((data || []) as any);
      setTotalCount(count || 0);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch]);

  useEffect(() => {
    let mounted = true;
    if (mounted) {
      fetchProducts();
      fetchStats();
    }

    let subscription: any;
    try {
      subscription = supabase
        .channel(`products_changes_admin_${Date.now()}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
          if (mounted) {
            fetchProducts();
            fetchStats();
          }
        })
        .subscribe((status, err) => {
          if (err) console.error("Realtime subscription error in admin products:", err);
        });
    } catch (e) {
      console.error("Failed to setup real-time subscription for admin products", e);
    }

    return () => {
      mounted = false;
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [fetchProducts]);

  const fetchStats = async () => {
    // Parallel fetching for stats
    const [total, active, outOfStock] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('stock_quantity', 0)
    ]);

    // For offers, we need a separate check
    const { count: withOffers } = await supabase
      .from('product_offers')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .gte('end_date', new Date().toISOString());

    setStats({
      total: total.count || 0,
      active: active.count || 0,
      outOfStock: outOfStock.count || 0,
      withOffers: withOffers || 0
    });
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
        .eq('id', productToDelete.id);

      if (error) throw error;

      toast.success('Product deleted successfully');
      storageLogger.logDelete('products', productToDelete.id, 2);
      setDeleteDialogOpen(false);
      setProductToDelete(null);
      fetchProducts();
      fetchStats();
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
    if (!product.is_offer_active) return null;

    const now = new Date();
    const start = product.offer_start_date ? new Date(product.offer_start_date) : null;
    const end = product.offer_end_date ? new Date(product.offer_end_date) : null;

    const isStarted = !start || now >= start;
    const isNotExpired = !end || now <= end;

    if (isStarted && isNotExpired) {
      return {
        banner_tag: product.banner_tag,
        offer_type: product.offer_type,
        offer_value: product.offer_value
      };
    }
    return null;
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
              <div className="text-xl sm:text-2xl font-bold">{stats.total}</div>
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
                {stats.active}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                Out of Stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-red-600">
                {stats.outOfStock}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">
                Active Offers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-purple-600">
                {stats.withOffers}
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
                        const isLowStock = product.stock_quantity <= product.low_stock_threshold;
                        const isOutOfStock = product.stock_quantity === 0;

                        return (
                          <TableRow key={product.id} className="group hover:bg-muted/30 transition-colors">
                            <TableCell className="min-w-[280px]">
                              <div className="flex items-center gap-4">
                                <div className="relative h-16 w-16 rounded-lg overflow-hidden border border-gray-200 shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                                  <CloudImage
                                    src={getPrimaryImage(product)}
                                    alt={product.name}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <span className="font-semibold text-gray-900 line-clamp-2 leading-tight">
                                    {product.name}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-[10px] px-1.5 h-5 font-normal text-muted-foreground border-gray-300">
                                      {product.category?.name || 'Uncategorized'}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground font-mono">
                                      {product.sku || '-'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="align-top py-4">
                              <span className="text-sm font-mono text-muted-foreground">
                                {product.sku || 'N/A'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <div className="flex items-baseline gap-1.5">
                                  <span className="font-semibold text-gray-900">
                                    ₹{product.price.toLocaleString()}
                                  </span>
                                  {product.compare_at_price && product.compare_at_price > product.price && (
                                    <span className="text-xs text-muted-foreground line-through">
                                      ₹{product.compare_at_price.toLocaleString()}
                                    </span>
                                  )}
                                </div>
                                {activeOffer && (
                                  <Badge variant="secondary" className="mt-1 w-fit text-[10px] bg-green-50 text-green-700 hover:bg-green-100 border-green-200">
                                    {activeOffer.banner_tag}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {product.shipping_charge > 0 ? (
                                <span className="text-sm font-medium text-gray-700">₹{product.shipping_charge}</span>
                              ) : (
                                <span className="text-sm text-green-600 font-medium">Free</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${isOutOfStock ? 'bg-red-500' : isLowStock ? 'bg-orange-500' : 'bg-emerald-500'
                                    }`} />
                                  <span className={`text-sm font-medium ${isOutOfStock ? 'text-red-700' : isLowStock ? 'text-orange-700' : 'text-emerald-700'
                                    }`}>
                                    {isOutOfStock ? 'Out of Stock' : product.stock_quantity + ' in stock'}
                                  </span>
                                </div>
                                {isLowStock && !isOutOfStock && (
                                  <span className="text-[10px] text-orange-600">
                                    Low stock warning
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1 max-w-[140px]">
                                {product.available_sizes?.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {product.available_sizes.slice(0, 3).map((size: string) => (
                                      <span key={size} className="text-[10px] border border-gray-200 bg-gray-50 px-1.5 py-0.5 rounded text-gray-600">
                                        {size}
                                      </span>
                                    ))}
                                    {product.available_sizes.length > 3 && (
                                      <span className="text-[10px] text-gray-400 px-1">
                                        +{product.available_sizes.length - 3}
                                      </span>
                                    )}
                                  </div>
                                )}
                                {product.available_sizes?.length > 0 && product.available_colors?.length > 0 && (
                                  <div className="h-px bg-gray-100 w-full my-0.5" />
                                )}
                                {product.available_colors?.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {product.available_colors.slice(0, 4).map((color: any) => (
                                      <div
                                        key={color.name}
                                        className="w-3 h-3 rounded-full border border-gray-200 shadow-sm"
                                        style={{ backgroundColor: color.hex }}
                                        title={color.name}
                                      />
                                    ))}
                                    {product.available_colors.length > 4 && (
                                      <span className="text-[10px] text-gray-400 px-1">
                                        +{product.available_colors.length - 4}
                                      </span>
                                    )}
                                  </div>
                                )}
                                {(!product.available_sizes?.length && !product.available_colors?.length) && (
                                  <span className="text-xs text-gray-400 italic">No variants</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${product.is_active
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-gray-100 text-gray-600 border-gray-200'
                                  }`}
                              >
                                {product.is_active ? 'Active' : 'Draft'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1 flex-wrap max-w-[140px]">
                                {product.is_featured && (
                                  <Badge variant="secondary" className="text-[10px] bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200">
                                    Feature
                                  </Badge>
                                )}
                                {product.is_new_arrival && (
                                  <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">
                                    New
                                  </Badge>
                                )}
                                {product.is_bestseller && (
                                  <Badge variant="secondary" className="text-[10px] bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200">
                                    Best
                                  </Badge>
                                )}
                                {hasLoyalty && (
                                  <div className="p-1 rounded bg-amber-50 text-amber-600 border border-amber-100" title="Loyalty Enabled">
                                    <span className="text-[10px] font-bold">🪙</span>
                                  </div>
                                )}
                                {hasAffiliate && (
                                  <div className="p-1 rounded bg-indigo-50 text-indigo-600 border border-indigo-100" title="Affiliate Enabled">
                                    <span className="text-[10px] font-bold">🤝</span>
                                  </div>
                                )}
                                {activeOffer && (
                                  <div className="p-1 rounded bg-rose-50 text-rose-600 border border-rose-100" title="Active Offer">
                                    <span className="text-[10px] font-bold">🎁</span>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                                  onClick={() => window.open(`/product/${product.slug}`, '_blank')}
                                  title="View on website"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-gray-100"
                                  onClick={() =>
                                    toggleProductStatus(product.id, product.is_active)
                                  }
                                  title={product.is_active ? "Deactivate" : "Activate"}
                                >
                                  {product.is_active ? (
                                    <Eye className="h-4 w-4 text-gray-500" />
                                  ) : (
                                    <EyeOff className="h-4 w-4 text-gray-400" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-orange-50 hover:text-orange-600"
                                  onClick={() =>
                                    navigate(`/admin/products/edit/${product.id}`)
                                  }
                                  title="Edit"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                                  onClick={() => {
                                    setProductToDelete({ id: product.id, name: product.name });
                                    setDeleteDialogOpen(true);
                                  }}
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4 text-gray-500 group-hover:text-red-600 transition-colors" />
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
                    const isLowStock = product.stock_quantity <= product.low_stock_threshold;
                    const isOutOfStock = product.stock_quantity === 0;

                    return (
                      <div key={product.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                        <div className="p-3">
                          <div className="flex gap-3">
                            <div className="relative h-20 w-20 shrink-0 rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
                              <CloudImage
                                src={getPrimaryImage(product)}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                              <div className="absolute top-0 right-0 p-1">
                                <div className={`w-2.5 h-2.5 rounded-full border-2 border-white ${product.is_active ? 'bg-green-500' : 'bg-gray-400'
                                  }`} />
                              </div>
                            </div>

                            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                              <div>
                                <div className="flex justify-between items-start gap-2">
                                  <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm leading-tight">
                                    {product.name}
                                  </h3>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 truncate">
                                  {product.category?.name || 'Uncategorized'} • {product.sku}
                                </p>
                              </div>

                              <div className="flex items-end justify-between mt-2">
                                <div>
                                  <div className="flex items-baseline gap-1.5">
                                    <span className="font-bold text-gray-900">
                                      ₹{product.price.toLocaleString()}
                                    </span>
                                    {product.compare_at_price && product.compare_at_price > product.price && (
                                      <span className="text-[10px] text-muted-foreground line-through">
                                        ₹{product.compare_at_price.toLocaleString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className={`text-xs px-2 py-0.5 rounded-full font-medium ${isOutOfStock
                                  ? 'bg-red-50 text-red-700'
                                  : isLowStock
                                    ? 'bg-orange-50 text-orange-700'
                                    : 'bg-emerald-50 text-emerald-700'
                                  }`}>
                                  {isOutOfStock ? '0 Stock' : `${product.stock_quantity} Stock`}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Variants & Tags - Collapsible or Compact */}
                          {(activeOffer || hasLoyalty || hasAffiliate) && (
                            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                              {activeOffer && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-100 whitespace-nowrap">
                                  🎁 {activeOffer.banner_tag}
                                </span>
                              )}
                              {hasLoyalty && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-100 whitespace-nowrap">
                                  🪙 Loyalty
                                </span>
                              )}
                              {hasAffiliate && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 whitespace-nowrap">
                                  🤝 Affiliate
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Actions Footer */}
                        <div className="grid grid-cols-4 border-t divide-x divide-gray-100 bg-gray-50/50">
                          <button
                            onClick={() => window.open(`/product/${product.slug}`, '_blank')}
                            className="flex flex-col items-center justify-center py-2.5 text-gray-600 hover:bg-white hover:text-blue-600 transition-colors"
                          >
                            <ExternalLink className="h-4 w-4" />
                            <span className="text-[10px] mt-1 font-medium">View</span>
                          </button>
                          <button
                            onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                            className="flex flex-col items-center justify-center py-2.5 text-gray-600 hover:bg-white hover:text-orange-600 transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                            <span className="text-[10px] mt-1 font-medium">Edit</span>
                          </button>
                          <button
                            onClick={() => toggleProductStatus(product.id, product.is_active)}
                            className={`flex flex-col items-center justify-center py-2.5 transition-colors hover:bg-white ${product.is_active ? 'text-gray-600 hover:text-gray-900' : 'text-gray-400 hover:text-gray-700'
                              }`}
                          >
                            {product.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            <span className="text-[10px] mt-1 font-medium">{product.is_active ? 'Active' : 'Draft'}</span>
                          </button>
                          <button
                            onClick={() => {
                              setProductToDelete({ id: product.id, name: product.name });
                              setDeleteDialogOpen(true);
                            }}
                            className="flex flex-col items-center justify-center py-2.5 text-gray-600 hover:bg-white hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="text-[10px] mt-1 font-medium">Delete</span>
                          </button>
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
              Are you sure you want to delete <strong>{productToDelete?.name}</strong>?
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
