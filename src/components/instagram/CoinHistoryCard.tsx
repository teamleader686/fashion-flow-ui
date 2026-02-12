import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useInstagramCoinLogs } from '@/hooks/useInstagramMarketing';
import { Award } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  userId: string;
}

export default function CoinHistoryCard({ userId }: Props) {
  const { coinLogs, loading } = useInstagramCoinLogs(userId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-600" />
          Coin History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : coinLogs.length > 0 ? (
          <div className="space-y-3">
            {coinLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium">{log.reason}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(log.assigned_date), { addSuffix: true })}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant={log.coins > 0 ? 'default' : 'secondary'} className="mb-1">
                    {log.coins > 0 ? '+' : ''}{log.coins}
                  </Badge>
                  <div className="text-xs text-muted-foreground">
                    Balance: {log.running_balance}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No coin history yet
          </div>
        )}
      </CardContent>
    </Card>
  );
}
