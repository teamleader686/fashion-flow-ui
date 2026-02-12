import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

type AffiliateTabProps = {
  config: any;
  setConfig: (config: any) => void;
};

const AffiliateTab = ({ config, setConfig }: AffiliateTabProps) => {
  const handleChange = (field: string, value: any) => {
    setConfig({ ...config, [field]: value });
  };

  const calculateCommission = (price: number) => {
    if (config.commission_type === 'percentage') {
      return (price * config.commission_value) / 100;
    }
    return config.commission_value;
  };

  return (
    <div className="space-y-6 py-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-500" />
            <CardTitle>Affiliate Marketing Configuration</CardTitle>
          </div>
          <CardDescription>
            Set up commission structure for affiliates promoting this product
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="affiliate_enabled">Enable Affiliate Commission</Label>
              <p className="text-sm text-gray-500">
                Allow affiliates to earn commission on this product
              </p>
            </div>
            <Switch
              id="affiliate_enabled"
              checked={config.is_enabled}
              onCheckedChange={(checked) => handleChange('is_enabled', checked)}
            />
          </div>

          {config.is_enabled && (
            <>
              {/* Commission Type */}
              <div className="space-y-3">
                <Label>Commission Type</Label>
                <RadioGroup
                  value={config.commission_type}
                  onValueChange={(value) => handleChange('commission_type', value)}
                >
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="percentage" id="percentage" />
                    <Label htmlFor="percentage" className="cursor-pointer flex-1">
                      <div className="font-medium">Percentage</div>
                      <div className="text-sm text-gray-500">
                        Commission as % of product price
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="fixed" id="fixed" />
                    <Label htmlFor="fixed" className="cursor-pointer flex-1">
                      <div className="font-medium">Fixed Amount</div>
                      <div className="text-sm text-gray-500">
                        Fixed commission per sale
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Commission Value */}
              <div className="space-y-2">
                <Label htmlFor="commission_value">
                  Commission Value {config.commission_type === 'percentage' ? '(%)' : '(₹)'}
                </Label>
                <Input
                  id="commission_value"
                  type="number"
                  value={config.commission_value}
                  onChange={(e) =>
                    handleChange('commission_value', parseFloat(e.target.value) || 0)
                  }
                  placeholder={config.commission_type === 'percentage' ? '10' : '100'}
                  step={config.commission_type === 'percentage' ? '0.1' : '1'}
                />
                <p className="text-sm text-gray-500">
                  {config.commission_type === 'percentage'
                    ? 'Percentage of product price'
                    : 'Fixed amount per sale'}
                </p>
              </div>

              {/* Preview */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-medium text-purple-900 mb-2">Commission Preview</h4>
                <div className="space-y-2 text-sm text-purple-800">
                  <div className="flex justify-between">
                    <span>Product Price:</span>
                    <strong>₹999</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Commission Type:</span>
                    <strong className="capitalize">{config.commission_type}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Commission Rate:</span>
                    <strong>
                      {config.commission_type === 'percentage'
                        ? `${config.commission_value}%`
                        : `₹${config.commission_value}`}
                    </strong>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-purple-300">
                    <span>Affiliate Earns:</span>
                    <strong className="text-lg">₹{calculateCommission(999).toFixed(2)}</strong>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">How it works</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>✓ Affiliate shares product link with unique code</li>
                  <li>✓ Customer purchases through affiliate link</li>
                  <li>✓ Commission automatically calculated and recorded</li>
                  <li>✓ Affiliate can track earnings in their dashboard</li>
                  <li>✓ Admin approves and processes payouts</li>
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AffiliateTab;
