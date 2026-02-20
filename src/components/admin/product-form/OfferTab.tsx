import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gift, Calendar } from 'lucide-react';

type OfferTabProps = {
  productData: any;
  onChange: (field: string, value: any) => void;
};

const OfferTab = ({ productData, onChange }: OfferTabProps) => {
  const calculateDiscountedPrice = (price: number) => {
    if (productData.offer_type === 'percentage') {
      return price - (price * productData.offer_value) / 100;
    } else if (productData.offer_type === 'flat') {
      return price - productData.offer_value;
    }
    return price;
  };

  return (
    <div className="space-y-6 py-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-green-500" />
            <CardTitle>Product Offer Configuration</CardTitle>
          </div>
          <CardDescription>
            Create time-limited offers and discounts for this product
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="is_offer_active">Enable Product Offer</Label>
              <p className="text-sm text-gray-500">
                Activate special pricing for this product
              </p>
            </div>
            <Switch
              id="is_offer_active"
              checked={productData.is_offer_active}
              onCheckedChange={(checked) => onChange('is_offer_active', checked)}
            />
          </div>

          {productData.is_offer_active && (
            <>
              {/* Offer Type */}
              <div className="space-y-3">
                <Label>Offer Type</Label>
                <RadioGroup
                  value={productData.offer_type}
                  onValueChange={(value) => onChange('offer_type', value)}
                >
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="percentage" id="percentage" />
                    <Label htmlFor="percentage" className="cursor-pointer flex-1">
                      <div className="font-medium">Percentage Discount</div>
                      <div className="text-sm text-gray-500">e.g., 20% OFF</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="flat" id="flat" />
                    <Label htmlFor="flat" className="cursor-pointer flex-1">
                      <div className="font-medium">Flat Discount</div>
                      <div className="text-sm text-gray-500">e.g., ₹200 OFF</div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Discount Value */}
              <div className="space-y-2">
                <Label htmlFor="offer_value">
                  Discount Value{' '}
                  {productData.offer_type === 'percentage' ? '(%)' : '(₹)'}
                </Label>
                <Input
                  id="offer_value"
                  type="number"
                  value={productData.offer_value}
                  onChange={(e) =>
                    onChange('offer_value', parseFloat(e.target.value) || 0)
                  }
                  placeholder={productData.offer_type === 'percentage' ? '20' : '200'}
                  step={productData.offer_type === 'percentage' ? '1' : '10'}
                />
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="offer_start_date">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Start Date
                  </Label>
                  <Input
                    id="offer_start_date"
                    type="datetime-local"
                    value={productData.offer_start_date || ''}
                    onChange={(e) => onChange('offer_start_date', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="offer_end_date">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    End Date
                  </Label>
                  <Input
                    id="offer_end_date"
                    type="datetime-local"
                    value={productData.offer_end_date || ''}
                    onChange={(e) => onChange('offer_end_date', e.target.value)}
                  />
                </div>
              </div>

              {/* Banner Tag */}
              <div className="space-y-2">
                <Label htmlFor="banner_tag">Banner Tag</Label>
                <Input
                  id="banner_tag"
                  value={productData.banner_tag || ''}
                  onChange={(e) => onChange('banner_tag', e.target.value)}
                  placeholder="Limited Offer, Hot Deal, 50% OFF"
                />
                <p className="text-sm text-gray-500">
                  This text will be displayed as a badge on the product
                </p>
              </div>

              {/* Preview */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-3">Offer Preview</h4>
                <div className="space-y-2 text-sm text-green-800">
                  <div className="flex justify-between">
                    <span>Original Price:</span>
                    <strong>₹{productData.price || 0}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <strong className="text-red-600">
                      {productData.offer_type === 'percentage'
                        ? `${productData.offer_value}%`
                        : `₹${productData.offer_value}`}
                    </strong>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-green-300">
                    <span>Final Price:</span>
                    <strong className="text-lg text-green-700">
                      ₹{calculateDiscountedPrice(productData.price || 0).toFixed(2)}
                    </strong>
                  </div>
                  {productData.banner_tag && (
                    <div className="mt-3 pt-3 border-t border-green-300">
                      <div className="inline-block bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                        {productData.banner_tag}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OfferTab;
