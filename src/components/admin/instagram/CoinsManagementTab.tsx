import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useInstagramCoinLogs } from '@/hooks/useInstagramMarketing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AssignCoinsDialog from './AssignCoinsDialog';
import { formatDistanceToNow } from 'date-fns';

export default function CoinsManagementTab() {
  const { coinLogs, loading } = useInstagramCoinLogs();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Assign Coins
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading coin logs...</div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Coin Assignment History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {coinLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{log.user?.name}</span>
                      <span className="text-sm text-muted-foreground">
                        @{log.user?.instagram_username}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{log.reason}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(log.assigned_date), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={log.coins > 0 ? 'default' : 'secondary'} className="mb-2">
                      {log.coins > 0 ? '+' : ''}{log.coins} coins
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                      Balance: {log.running_balance}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {coinLogs.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No coin assignments yet
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <AssignCoinsDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
