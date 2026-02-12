import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Coins } from 'lucide-react';

type LoyaltyTabProps = {
  config: any;
  setConfig: (config: any) => void;
};

const LoyaltyTab = ({ config, setConfig }: LoyaltyTabProps) => {
  const handleChange = (field: string, value: any) => {
    setConfig({ ...config, [field]: value });
  };

  return (
    <div className="space-y-6 py-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-yellow-500" />
            <CardTitle>Loyalty Coins Configuration</CardTitle>
          </div>
          <CardDescription>
            Configure how customers earn and redeem loyalty coins for this product
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="loyalty_enabled">Enable Loyalty Coins</Label>
              <p className="text-sm text-gray-500">
                Allow customers to earn and redeem coins
              </p>
            </div>
            <Switch
              id="loyalty_enabled"
              checked={config.is_enabled}
              onCheckedChange={(checked) => handleChange('is_enabled', checked)}
            />
          </div>

          {config.is_enabled && (
            <>
              {/* Coins Earned Per Purchase */}
              <div className="space-y-2">
                <Label htmlFor="coins_earned">Coins Earned Per Purchase</Label>
                <Input
                  id="coins_earned"
                  type="number"
                  value={config.coins_earned_per_purchase}
                  onChange={(e) =>
                    handleChange('coins_earned_per_purchase', parseInt(e.target.value) || 0)
                  }
                  placeholder="10"
                />
                <p className="text-sm text-gray-500">
                  Number of coins customer earns when they purchase this product
                </p>
              </div>

              {/* Coins Required for Redemption */}
              <div className="space-y-2">
                <Label htmlFor="coins_required">Coins Required for Redemption</Label>
                <Input
                  id="coins_required"
                  type="number"
                  value={config.coins_required_for_redemption}
                  onChange={(e) =>
                    handleChange('coins_required_for_redemption', parseInt(e.target.value) || 0)
                  }
                  placeholder="100"
                />
                <p className="text-sm text-gray-500">
                  Minimum coins needed to redeem for discount on this product
                </p>
              </div>

              {/* Max Coins Usable Per Order */}
              <div className="space-y-2">
                <Label htmlFor="max_coins">Max Coins Usable Per Order</Label>
                <Input
                  id="max_coins"
                  type="number"
                  value={config.max_coins_usable_per_order}
                  onChange={(e) =>
                    handleChange('max_coins_usable_per_order', parseInt(e.target.value) || 0)
                  }
                  placeholder="500"
                />
                <p className="text-sm text-gray-500">
                  Maximum coins that can be used in a single order
                </p>
              </div>

              {/* Preview */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Preview</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>
                    ✓ Customer earns <strong>{config.coins_earned_per_purchase} coins</strong> on
                    purchase
                  </li>
                  <li>
                    ✓ Needs <strong>{config.coins_required_for_redemption} coins</strong> to redeem
                  </li>
                  <li>
                    ✓ Can use up to <strong>{config.max_coins_usable_per_order} coins</strong> per
                    order
                  </li>
                  <li>
                    ✓ 1 coin = ₹1 discount (configurable in settings)
                  </li>
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoyaltyTab;
