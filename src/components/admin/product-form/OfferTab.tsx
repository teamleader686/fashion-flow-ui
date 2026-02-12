import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gift, Calendar } from 'lucide-react';

type OfferTabProps = {
  offer: any;
  setOffer: (offer: any) => void;
};

const OfferTab = ({ offer, setOffer }: OfferTabProps) => {
  const handleChange = (field: string, value: any) => {
    setOffer({ ...offer, [field]: value });
  };

  const calculateDiscountedPrice = (price: number) => {
    if (offer.offer_type === 'percentage_discount') {
      return price - (price * offer.discount_value) / 100;
    } else if (offer.offer_type === 'flat_discount') {
      return price - offer.discount_value;
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
              <Label htmlFor="offer_enabled">Enable Product Offer</Label>
              <p className="text-sm text-gray-500">
                Activate special pricing for this product
              </p>
            </div>
            <Switch
              id="offer_enabled"
              checked={offer.is_enabled}
              onCheckedChange={(checked) => handleChange('is_enabled', checked)}
            />
          </div>

          {offer.is_enabled && (
            <>
              {/* Offer Type */}
              <div className="space-y-3">
                <Label>Offer Type</Label>
                <RadioGroup
                  value={offer.offer_type}
                  onValueChange={(value) => handleChange('offer_type', value)}
                >
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="percentage_discount" id="percentage_discount" />
                    <Label htmlFor="percentage_discount" className="cursor-pointer flex-1">
                      <div className="font-medium">Percentage Discount</div>
                      <div className="text-sm text-gray-500">e.g., 20% OFF</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="flat_discount" id="flat_discount" />
                    <Label htmlFor="flat_discount" className="cursor-pointer flex-1">
                      <div className="font-medium">Flat Discount</div>
                      <div className="text-sm text-gray-500">e.g., ₹200 OFF</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="bogo" id="bogo" />
                    <Label htmlFor="bogo" className="cursor-pointer flex-1">
                      <div className="font-medium">Buy One Get One</div>
                      <div className="text-sm text-gray-500">BOGO offer</div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Discount Value */}
              {offer.offer_type !== 'bogo' && (
                <div className="space-y-2">
                  <Label htmlFor="discount_value">
                    Discount Value{' '}
                    {offer.offer_type === 'percentage_discount' ? '(%)' : '(₹)'}
                  </Label>
                  <Input
                    id="discount_value"
                    type="number"
                    value={offer.discount_value}
                    onChange={(e) =>
                      handleChange('discount_value', parseFloat(e.target.value) || 0)
                    }
                    placeholder={offer.offer_type === 'percentage_discount' ? '20' : '200'}
                    step={offer.offer_type === 'percentage_discount' ? '1' : '10'}
                  />
                </div>
              )}

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Start Date
                  </Label>
                  <Input
                    id="start_date"
                    type="datetime-local"
                    value={offer.start_date}
                    onChange={(e) => handleChange('start_date', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    End Date
                  </Label>
                  <Input
                    id="end_date"
                    type="datetime-local"
                    value={offer.end_date}
                    onChange={(e) => handleChange('end_date', e.target.value)}
                  />
                </div>
              </div>

              {/* Banner Tag */}
              <div className="space-y-2">
                <Label htmlFor="banner_tag">Banner Tag</Label>
                <Input
                  id="banner_tag"
                  value={offer.banner_tag}
                  onChange={(e) => handleChange('banner_tag', e.target.value)}
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
                    <strong>₹999</strong>
                  </div>
                  {offer.offer_type !== 'bogo' && (
                    <>
                      <div className="flex justify-between">
                        <span>Discount:</span>
                        <strong className="text-red-600">
                          {offer.offer_type === 'percentage_discount'
                            ? `${offer.discount_value}%`
                            : `₹${offer.discount_value}`}
                        </strong>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-green-300">
                        <span>Final Price:</span>
                        <strong className="text-lg text-green-700">
                          ₹{calculateDiscountedPrice(999).toFixed(2)}
                        </strong>
                      </div>
                    </>
                  )}
                  {offer.offer_type === 'bogo' && (
                    <div className="text-center py-2 bg-green-100 rounded">
                      <strong className="text-lg">Buy 1 Get 1 Free!</strong>
                    </div>
                  )}
                  {offer.banner_tag && (
                    <div className="mt-3 pt-3 border-t border-green-300">
                      <div className="inline-block bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                        {offer.banner_tag}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Auto-Apply Rules</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>✓ Offer activates automatically on start date</li>
                  <li>✓ Discounted price shown instantly on product page</li>
                  <li>✓ Offer expires automatically on end date</li>
                  <li>✓ Banner tag displayed prominently</li>
                  <li>✓ Original price shown with strikethrough</li>
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OfferTab;
