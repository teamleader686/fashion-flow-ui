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
    <div className="space-y-6 py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Product Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Product Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => {
              handleChange('name', e.target.value);
              if (!formData.slug) {
                handleChange('slug', generateSlug(e.target.value));
              }
            }}
            placeholder="Designer Kurti"
            required
          />
        </div>

        {/* Slug */}
        <div className="space-y-2">
          <Label htmlFor="slug">Slug *</Label>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) => handleChange('slug', e.target.value)}
            placeholder="designer-kurti"
            required
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.category_id}
            onValueChange={(value) => handleChange('category_id', value)}
          >
            <SelectTrigger>
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

        {/* SKU */}
        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
          <Input
            id="sku"
            value={formData.sku}
            onChange={(e) => handleChange('sku', e.target.value)}
            placeholder="KRT-001"
          />
        </div>

        {/* Price */}
        <div className="space-y-2">
          <Label htmlFor="price">Price (₹) *</Label>
          <Input
            id="price"
            type="number"
            value={formData.price}
            onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
            placeholder="999"
            required
          />
        </div>

        {/* Compare at Price */}
        <div className="space-y-2">
          <Label htmlFor="compare_at_price">Compare at Price (₹)</Label>
          <Input
            id="compare_at_price"
            type="number"
            value={formData.compare_at_price}
            onChange={(e) => handleChange('compare_at_price', parseFloat(e.target.value) || 0)}
            placeholder="1499"
          />
        </div>

        {/* Stock Quantity */}
        <div className="space-y-2">
          <Label htmlFor="stock_quantity">Stock Quantity *</Label>
          <Input
            id="stock_quantity"
            type="number"
            value={formData.stock_quantity}
            onChange={(e) => handleChange('stock_quantity', parseInt(e.target.value) || 0)}
            placeholder="100"
            required
          />
        </div>

        {/* Low Stock Threshold */}
        <div className="space-y-2">
          <Label htmlFor="low_stock_threshold">Low Stock Alert</Label>
          <Input
            id="low_stock_threshold"
            type="number"
            value={formData.low_stock_threshold}
            onChange={(e) => handleChange('low_stock_threshold', parseInt(e.target.value) || 5)}
            placeholder="5"
          />
        </div>

        {/* Shipping Charge */}
        <div className="space-y-2">
          <Label htmlFor="shipping_charge">Shipping Charge (₹)</Label>
          <Input
            id="shipping_charge"
            type="number"
            value={formData.shipping_charge}
            onChange={(e) => handleChange('shipping_charge', parseFloat(e.target.value) || 0)}
            placeholder="0"
          />
          <p className="text-xs text-muted-foreground">Set to 0 for free delivery</p>
        </div>
      </div>

      {/* Short Description */}
      <div className="space-y-2">
        <Label htmlFor="short_description">Short Description</Label>
        <Textarea
          id="short_description"
          value={formData.short_description}
          onChange={(e) => handleChange('short_description', e.target.value)}
          placeholder="Brief product description..."
          rows={2}
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Full Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Detailed product description..."
          rows={5}
        />
      </div>

      {/* Toggles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <Label htmlFor="is_active">Active</Label>
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => handleChange('is_active', checked)}
          />
        </div>
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <Label htmlFor="is_featured">Featured</Label>
          <Switch
            id="is_featured"
            checked={formData.is_featured}
            onCheckedChange={(checked) => handleChange('is_featured', checked)}
          />
        </div>
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <Label htmlFor="is_new_arrival">New Arrival</Label>
          <Switch
            id="is_new_arrival"
            checked={formData.is_new_arrival}
            onCheckedChange={(checked) => handleChange('is_new_arrival', checked)}
          />
        </div>
      </div>
    </div>
  );
};

export default BasicInfoTab;
