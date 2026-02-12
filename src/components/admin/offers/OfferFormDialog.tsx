import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useOffers } from '@/hooks/useOffers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Offer, OfferFormData } from '@/types/offer';

interface Props {
  open: boolean;
  onClose: () => void;
  offer: Offer | null;
}

export default function OfferFormDialog({ open, onClose, offer }: Props) {
  const { createOffer, updateOffer } = useOffers();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<OfferFormData>({
    title: '',
    type: 'flat',
    discount_value: 0,
    max_discount: null,
    min_order_amount: 0,
    scope_type: 'all',
    start_datetime: new Date().toISOString().slice(0, 16),
    end_datetime: '',
    badge_text: 'Special Offer',
    badge_color: '#FF6B6B',
    status: 'active',
    priority: 1,
    stock_limit: null,
    product_ids: [],
    category_ids: []
  });

  useEffect(() => {
    if (offer) {
      setFormData({
        title: offer.title,
        type: offer.type,
        discount_value: offer.discount_value,
        max_discount: offer.max_discount,
        min_order_amount: offer.min_order_amount,
        scope_type: offer.scope_type,
        start_datetime: offer.start_datetime.slice(0, 16),
        end_datetime: offer.end_datetime.slice(0, 16),
        badge_text: offer.badge_text,
        badge_color: offer.badge_color,
        status: offer.status,
        priority: offer.priority,
        stock_limit: offer.stock_limit,
        product_ids: [],
        category_ids: []
      });
    } else {
      setFormData({
        title: '',
        type: 'flat',
        discount_value: 0,
        max_discount: null,
        min_order_amount: 0,
        scope_type: 'all',
        start_datetime: new Date().toISOString().slice(0, 16),
        end_datetime: '',
        badge_text: 'Special Offer',
        badge_color: '#FF6B6B',
        status: 'active',
        priority: 1,
        stock_limit: null,
        product_ids: [],
        category_ids: []
      });
    }
  }, [offer, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (offer) {
        await updateOffer(offer.id, formData);
      } else {
        await createOffer(formData);
      }
      onClose();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">
            {offer ? 'Edit Offer' : 'Create New Offer'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <Label htmlFor="title">Offer Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Summer Sale 2024"
              required
            />
          </div>

          {/* Type & Discount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Offer Type *</Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-md"
                required
              >
                <option value="flat">Flat Discount (₹)</option>
                <option value="percentage">Percentage (%)</option>
                <option value="bogo">Buy 1 Get 1 (BOGO)</option>
                <option value="flash_sale">Flash Sale</option>
                <option value="category">Category Offer</option>
              </select>
            </div>

            <div>
              <Label htmlFor="discount_value">
                Discount Value * {formData.type === 'percentage' && '(%)'}
              </Label>
              <Input
                id="discount_value"
                type="number"
                step="0.01"
                value={formData.discount_value}
                onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) })}
                required
              />
            </div>
          </div>

          {/* Min Order & Max Discount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="min_order">Minimum Order Amount (₹)</Label>
              <Input
                id="min_order"
                type="number"
                step="0.01"
                value={formData.min_order_amount}
                onChange={(e) => setFormData({ ...formData, min_order_amount: parseFloat(e.target.value) })}
              />
            </div>

            {formData.type === 'percentage' && (
              <div>
                <Label htmlFor="max_discount">Maximum Discount (₹)</Label>
                <Input
                  id="max_discount"
                  type="number"
                  step="0.01"
                  value={formData.max_discount || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    max_discount: e.target.value ? parseFloat(e.target.value) : null 
                  })}
                  placeholder="Optional"
                />
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_datetime">Start Date & Time *</Label>
              <Input
                id="start_datetime"
                type="datetime-local"
                value={formData.start_datetime}
                onChange={(e) => setFormData({ ...formData, start_datetime: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="end_datetime">End Date & Time *</Label>
              <Input
                id="end_datetime"
                type="datetime-local"
                value={formData.end_datetime}
                onChange={(e) => setFormData({ ...formData, end_datetime: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Badge */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="badge_text">Badge Text</Label>
              <Input
                id="badge_text"
                value={formData.badge_text}
                onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                placeholder="Hot Deal"
              />
            </div>

            <div>
              <Label htmlFor="badge_color">Badge Color</Label>
              <div className="flex gap-2">
                <Input
                  id="badge_color"
                  type="color"
                  value={formData.badge_color}
                  onChange={(e) => setFormData({ ...formData, badge_color: e.target.value })}
                  className="w-20"
                />
                <Input
                  type="text"
                  value={formData.badge_color}
                  onChange={(e) => setFormData({ ...formData, badge_color: e.target.value })}
                  placeholder="#FF6B6B"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Scope & Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="scope_type">Applicable To</Label>
              <select
                id="scope_type"
                value={formData.scope_type}
                onChange={(e) => setFormData({ ...formData, scope_type: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="all">All Products</option>
                <option value="products">Specific Products</option>
                <option value="categories">Specific Categories</option>
              </select>
            </div>

            <div>
              <Label htmlFor="priority">Priority (Higher = First)</Label>
              <Input
                id="priority"
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                min="1"
              />
            </div>
          </div>

          {/* Flash Sale Stock */}
          {formData.type === 'flash_sale' && (
            <div>
              <Label htmlFor="stock_limit">Stock Limit</Label>
              <Input
                id="stock_limit"
                type="number"
                value={formData.stock_limit || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  stock_limit: e.target.value ? parseInt(e.target.value) : null 
                })}
                placeholder="Limited stock for flash sale"
              />
            </div>
          )}

          {/* Status */}
          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'Saving...' : offer ? 'Update Offer' : 'Create Offer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
