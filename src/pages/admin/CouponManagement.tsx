import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Plus, Edit, Trash2, Eye, Search } from 'lucide-react';
import { useCoupons } from '@/hooks/useCoupons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import CouponFormDialog from '@/components/admin/coupons/CouponFormDialog';
import CouponUsageDialog from '@/components/admin/coupons/CouponUsageDialog';
import type { Coupon } from '@/types/coupon';
import { TableSkeleton } from '@/components/shimmer/AdminShimmer';
import AdminPagination from '@/components/admin/AdminPagination';
import { usePagination } from '@/hooks/usePagination';

const ITEMS_PER_PAGE = 10;

export default function CouponManagement() {
  const { coupons, loading, deleteCoupon } = useCoupons();
  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [usageOpen, setUsageOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  const filteredCoupons = coupons.filter(coupon =>
    coupon.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const { currentPage, totalPages, paginatedItems, handlePageChange, startIndex, endIndex, totalItems } = usePagination(filteredCoupons, { itemsPerPage: ITEMS_PER_PAGE });

  const handleEdit = (coupon: Coupon) => { setSelectedCoupon(coupon); setFormOpen(true); };
  const handleViewUsage = (coupon: Coupon) => { setSelectedCoupon(coupon); setUsageOpen(true); };
  const handleDelete = async (id: string) => { if (confirm('Are you sure?')) { try { await deleteCoupon(id); } catch (e: any) { alert(e.message); } } };
  const handleCloseForm = () => { setFormOpen(false); setSelectedCoupon(null); };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Coupon Management</h1>
            <p className="text-muted-foreground mt-1">Create and manage discount coupons</p>
          </div>
          <Button onClick={() => setFormOpen(true)} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" /> Create Coupon
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input placeholder="Search coupons..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>

        {loading ? (
          <TableSkeleton rows={ITEMS_PER_PAGE} cols={7} />
        ) : filteredCoupons.length === 0 ? (
          <Card><CardContent className="py-12 text-center"><p className="text-muted-foreground">No coupons found</p></CardContent></Card>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block">
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Code</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Discount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Usage</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Expiry</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {paginatedItems.map((coupon) => (
                          <tr key={coupon.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-6 py-4"><span className="font-mono font-semibold text-primary">{coupon.code}</span></td>
                            <td className="px-6 py-4 capitalize text-sm">{coupon.type}</td>
                            <td className="px-6 py-4 text-sm">
                              {coupon.type === 'flat' ? `₹${coupon.value}` : `${coupon.value}%`}
                              {coupon.max_discount && <span className="text-xs text-muted-foreground"> (max ₹{coupon.max_discount})</span>}
                            </td>
                            <td className="px-6 py-4 text-sm">{coupon.total_usage_count}{coupon.usage_limit && ` / ${coupon.usage_limit}`}</td>
                            <td className="px-6 py-4 text-sm">{new Date(coupon.expiry_date).toLocaleDateString()}</td>
                            <td className="px-6 py-4"><Badge variant={coupon.status === 'active' ? 'default' : 'secondary'}>{coupon.status}</Badge></td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" onClick={() => handleViewUsage(coupon)}><Eye className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(coupon)}><Edit className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(coupon.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Mobile/Tablet Cards */}
            <div className="lg:hidden space-y-3">
              {paginatedItems.map((coupon) => (
                <Card key={coupon.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="font-mono font-bold text-lg text-primary">{coupon.code}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-muted-foreground capitalize">{coupon.type}</span>
                          <Badge variant={coupon.status === 'active' ? 'default' : 'secondary'} className="text-xs">{coupon.status}</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{coupon.type === 'flat' ? `₹${coupon.value}` : `${coupon.value}%`}</div>
                        {coupon.max_discount && <div className="text-xs text-muted-foreground">max ₹{coupon.max_discount}</div>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      <div><span className="text-muted-foreground">Usage:</span><span className="ml-1 font-medium">{coupon.total_usage_count}{coupon.usage_limit && ` / ${coupon.usage_limit}`}</span></div>
                      <div><span className="text-muted-foreground">Expiry:</span><span className="ml-1 font-medium">{new Date(coupon.expiry_date).toLocaleDateString()}</span></div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewUsage(coupon)} className="flex-1"><Eye className="w-4 h-4 mr-1" /> Usage</Button>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(coupon)} className="flex-1"><Edit className="w-4 h-4 mr-1" /> Edit</Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(coupon.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <AdminPagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} startIndex={startIndex} endIndex={endIndex} totalItems={totalItems} label="coupons" />
          </>
        )}

        <CouponFormDialog open={formOpen} onClose={handleCloseForm} coupon={selectedCoupon} />
        <CouponUsageDialog open={usageOpen} onClose={() => { setUsageOpen(false); setSelectedCoupon(null); }} coupon={selectedCoupon} />
      </div>
    </AdminLayout>
  );
}
