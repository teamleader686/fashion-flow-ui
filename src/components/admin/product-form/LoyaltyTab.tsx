import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Coins } from 'lucide-react';

type LoyaltyTabProps = {
  reward: number;
  price: number | null;
  onRewardChange: (value: number) => void;
  onPriceChange: (value: number | null) => void;
};

const LoyaltyTab = ({ reward, price, onRewardChange, onPriceChange }: LoyaltyTabProps) => {
  return (
    <div className="space-y-6 py-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-yellow-500" />
            <CardTitle>Loyalty Coins Configuration</CardTitle>
          </div>
          <CardDescription>
            Configure how customers earn and redeem loyalty coins for this product.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          <div className="grid gap-6 md:grid-cols-2">
            {/* Coins Earned (Reward) */}
            <div className="space-y-2">
              <Label htmlFor="loyalty_reward">Coins Earned (Reward)</Label>
              <Input
                id="loyalty_reward"
                type="number"
                min="0"
                value={reward}
                onChange={(e) => onRewardChange(parseInt(e.target.value) || 0)}
                placeholder="0"
              />
              <p className="text-sm text-muted-foreground">
                Coins the customer earns when purchasing this product.
              </p>
            </div>

            {/* Coins Price (Redeem) */}
            <div className="space-y-2">
              <Label htmlFor="loyalty_price">Coins Price (Redeem)</Label>
              <Input
                id="loyalty_price"
                type="number"
                min="0"
                value={price || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  onPriceChange(val === '' ? null : parseInt(val));
                }}
                placeholder="Leave empty to disable"
              />
              <p className="text-sm text-muted-foreground">
                Coins required to purchase this product fully with coins. Leave empty to disable coin purchase.
              </p>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Summary</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>
                {reward > 0
                  ? `✓ Customer will earn ${reward} coins on purchase.`
                  : '• No coins earned on purchase.'}
              </li>
              <li>
                {price && price > 0
                  ? `✓ Customer can buy this product for ${price} coins.`
                  : '• Product cannot be purchased with coins alone.'}
              </li>
            </ul>
          </div>

        </CardContent>
      </Card>
    </div>
  );
};

export default LoyaltyTab;
