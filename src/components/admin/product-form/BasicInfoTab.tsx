import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase, Category } from '@/lib/supabase';

type BasicInfoTabProps = {
  formData: any;
  setFormData: (data: any) => void;
};

const BasicInfoTab = ({ formData, setFormData }: BasicInfoTabProps) => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('name');
    if (data) setCategories(data);
  };

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
      {/* Left Column - Main Details */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-4">Product Details</h3>

          <div className="space-y-4">
            {/* Product Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-700">Product Name <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  handleChange('name', e.target.value);
                  if (!formData.slug) {
                    handleChange('slug', generateSlug(e.target.value));
                  }
                }}
                placeholder="Ex: Floral Print Anarkali Kurti"
                required
                className="h-11 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug" className="text-gray-700">URL Slug <span className="text-red-500">*</span></Label>
              <div className="flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-200 bg-gray-50 text-gray-500 text-sm">
                  /product/
                </span>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleChange('slug', e.target.value)}
                  placeholder="floral-print-anarkali-kurti"
                  required
                  className="rounded-l-none h-11 border-gray-200 focus:border-purple-500 focus:ring-purple-500 font-mono text-sm"
                />
              </div>
            </div>

            {/* Short Description */}
            <div className="space-y-2">
              <Label htmlFor="short_description" className="text-gray-700">Short Summary</Label>
              <Textarea
                id="short_description"
                value={formData.short_description}
                onChange={(e) => handleChange('short_description', e.target.value)}
                placeholder="Brief summary for cards and SEO..."
                rows={3}
                className="resize-none border-gray-200 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-700">Full Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Detailed product information, material, care instructions..."
                rows={8}
                className="border-gray-200 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Inventory Card - Left col for consistency or wider space */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-4">Inventory & Identification</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* SKU */}
            <div className="space-y-2">
              <Label htmlFor="sku" className="text-gray-700">SKU (Stock Keeping Unit)</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => handleChange('sku', e.target.value)}
                placeholder="KRT-001"
                className="h-11 border-gray-200"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category" className="text-gray-700">Category <span className="text-red-500">*</span></Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => handleChange('category_id', value)}
              >
                <SelectTrigger className="h-11 border-gray-200">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Stock Quantity */}
            <div className="space-y-2">
              <Label htmlFor="stock_quantity" className="text-gray-700">Stock Quantity <span className="text-red-500">*</span></Label>
              <Input
                id="stock_quantity"
                type="number"
                value={formData.stock_quantity}
                onChange={(e) => handleChange('stock_quantity', parseInt(e.target.value) || 0)}
                placeholder="100"
                required
                className="h-11 border-gray-200"
              />
            </div>

            {/* Low Stock Threshold */}
            <div className="space-y-2">
              <Label htmlFor="low_stock_threshold" className="text-gray-700">Low Stock Alert Level</Label>
              <Input
                id="low_stock_threshold"
                type="number"
                value={formData.low_stock_threshold}
                onChange={(e) => handleChange('low_stock_threshold', parseInt(e.target.value) || 5)}
                placeholder="5"
                className="h-11 border-gray-200"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Status, Price, etc. */}
      <div className="space-y-6">
        {/* Status Card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Visibility Status</h3>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="is_active" className="text-base font-medium">Active</Label>
              <p className="text-xs text-muted-foreground">Show on store</p>
            </div>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleChange('is_active', checked)}
            />
          </div>

          <hr className="border-gray-100" />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="is_featured" className="text-base font-medium">Featured</Label>
              <p className="text-xs text-muted-foreground">Promote on home</p>
            </div>
            <Switch
              id="is_featured"
              checked={formData.is_featured}
              onCheckedChange={(checked) => handleChange('is_featured', checked)}
            />
          </div>

          <hr className="border-gray-100" />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="is_new_arrival" className="text-base font-medium">New Arrival</Label>
              <p className="text-xs text-muted-foreground">Mark as new</p>
            </div>
            <Switch
              id="is_new_arrival"
              checked={formData.is_new_arrival}
              onCheckedChange={(checked) => handleChange('is_new_arrival', checked)}
            />
          </div>
        </div>

        {/* Pricing Card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-4">Pricing</h3>

          <div className="space-y-4">
            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="price" className="text-gray-700">Selling Price (₹) <span className="text-red-500">*</span></Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">₹</span>
                </div>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  required
                  className="pl-8 h-11 border-gray-200 text-lg font-medium"
                />
              </div>
            </div>

            {/* Compare Price */}
            <div className="space-y-2">
              <Label htmlFor="compare_at_price" className="text-gray-700">Original Price (₹)</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">₹</span>
                </div>
                <Input
                  id="compare_at_price"
                  type="number"
                  value={formData.compare_at_price}
                  onChange={(e) => handleChange('compare_at_price', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="pl-8 h-11 border-gray-200"
                />
              </div>
              <p className="text-xs text-muted-foreground">Strike-through price for sales</p>
            </div>
          </div>
        </div>

        {/* Shipping Card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-4">Shipping</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shipping_charge" className="text-gray-700">Shipping Charge (₹)</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">₹</span>
                </div>
                <Input
                  id="shipping_charge"
                  type="number"
                  value={formData.shipping_charge}
                  onChange={(e) => handleChange('shipping_charge', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="pl-8 h-11 border-gray-200"
                />
              </div>
              <p className="text-xs text-muted-foreground">Set to 0 for free delivery</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicInfoTab;
