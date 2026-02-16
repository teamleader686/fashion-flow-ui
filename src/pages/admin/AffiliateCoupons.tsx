import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase, AffiliateCoupon } from '@/lib/supabase';
import { Plus, Ticket, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const AffiliateCoupons = () => {
  const [coupons, setCoupons] = useState<AffiliateCoupon[]>([]);
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<AffiliateCoupon | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'flat',
    value: 0,
    affiliate_user_id: '',
    expiry_date: '',
    usage_limit: 0,
    status: 'active' as 'active' | 'inactive',
  });

  useEffect(() => {
    fetchCoupons();
    fetchAffiliates();
  }, []);

  const fetchCoupons = async () => {
    const { data } = await supabase
      .from('coupons')
      .select('*')
      .eq('is_affiliate_coupon', true)
      .order('created_at', { ascending: false });

    if (data) {
      // Fetch affiliate details for each coupon
      const couponsWithAffiliates = await Promise.all(
        data.map(async (coupon) => {
          if (coupon.affiliate_user_id) {
            const { data: affiliate } = await supabase
              .from('affiliates')
              .select('id, name, referral_code')
              .eq('id', coupon.affiliate_user_id)
              .single();
            return { ...coupon, affiliate };
          }
          return coupon;
        })
      );
      setCoupons(couponsWithAffiliates as any);
    }
  };

  const fetchAffiliates = async () => {
    const { data } = await supabase
      .from('affiliates')
      .select('*')
      .eq('status', 'active');

    if (data) setAffiliates(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const couponData = {
        ...formData,
        is_affiliate_coupon: true,
        // Remove any phantom fields that might cause 400
        coupon_title: undefined,
      };

      if (editingCoupon) {
        const { error } = await supabase
          .from('coupons')
          .update(couponData)
          .eq('id', editingCoupon.id);
        if (error) throw error;
        toast.success('Coupon updated successfully');
      } else {
        const { error } = await supabase
          .from('coupons')
          .insert([couponData]);
        if (error) throw error;
        toast.success('Coupon created successfully');
      }

      setDialogOpen(false);
      resetForm();
      fetchCoupons();
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message || 'Failed to save coupon');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      type: 'percentage',
      value: 0,
      affiliate_user_id: '',
      expiry_date: '',
      usage_limit: 0,
      status: 'active',
    });
    setEditingCoupon(null);
  };

  const handleEdit = (coupon: AffiliateCoupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      affiliate_user_id: coupon.affiliate_user_id || '',
      expiry_date: coupon.expiry_date || '',
      usage_limit: coupon.usage_limit || 0,
      status: coupon.status,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    try {
      const { error } = await supabase.from('coupons').delete().eq('id', id);
      if (error) throw error;
      toast.success('Coupon deleted');
      fetchCoupons();
    } catch (error) {
      toast.error('Failed to delete coupon');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Affiliate Coupons</h1>
            <p className="text-gray-500 mt-1">Manage affiliate-specific discount coupons</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={resetForm}
                className="bg-gradient-to-r from-pink-500 to-purple-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Coupon
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingCoupon ? 'Edit' : 'Create'} Affiliate Coupon
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Coupon Code</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="SAVE20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Affiliate</Label>
                  <Select
                    value={formData.affiliate_user_id}
                    onValueChange={(value) => setFormData({ ...formData, affiliate_user_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select affiliate" />
                    </SelectTrigger>
                    <SelectContent>
                      {affiliates.map((aff) => (
                        <SelectItem key={aff.id} value={aff.id}>
                          {aff.name} ({aff.referral_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Discount Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="flat">Fixed (Flat)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Value</Label>
                    <Input
                      type="number"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Expiry Date</Label>
                  <Input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Usage Limit</Label>
                  <Input
                    type="number"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({ ...formData, usage_limit: parseInt(e.target.value) })}
                    placeholder="0 = unlimited"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">
                  {editingCoupon ? 'Update' : 'Create'} Coupon
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Affiliate</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell>
                      <code className="bg-gray-100 px-2 py-1 rounded">
                        {coupon.code}
                      </code>
                    </TableCell>
                    <TableCell>{coupon.affiliate?.name || 'N/A'}</TableCell>
                    <TableCell>
                      {coupon.type === 'percentage'
                        ? `${coupon.value}%`
                        : `₹${coupon.value}`}
                    </TableCell>
                    <TableCell>
                      {coupon.total_usage_count} / {coupon.usage_limit || '∞'}
                    </TableCell>
                    <TableCell>
                      {coupon.expiry_date
                        ? new Date(coupon.expiry_date).toLocaleDateString()
                        : 'No expiry'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={coupon.status === 'active' ? 'default' : 'secondary'}>
                        {coupon.status === 'active' ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(coupon)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(coupon.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AffiliateCoupons;
