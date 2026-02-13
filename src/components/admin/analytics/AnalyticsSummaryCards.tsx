import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';

type SummaryData = {
  totalRevenue: number;
  totalExpenses: number;
  totalProfit: number;
  totalLoss: number;
  profitMargin: number;
};

type AnalyticsSummaryCardsProps = {
  data: SummaryData;
  loading?: boolean;
};

export default function AnalyticsSummaryCards({ data, loading }: AnalyticsSummaryCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-24"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Revenue',
      value: `₹${data.totalRevenue.toLocaleString('en-IN')}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: '+12.5%',
      trendUp: true,
    },
    {
      title: 'Total Expenses',
      value: `₹${data.totalExpenses.toLocaleString('en-IN')}`,
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      trend: '+8.2%',
      trendUp: false,
    },
    {
      title: 'Net Profit',
      value: `₹${data.totalProfit.toLocaleString('en-IN')}`,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: '+15.3%',
      trendUp: true,
    },
    {
      title: 'Profit Margin',
      value: `${data.profitMargin.toFixed(1)}%`,
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      trend: '+2.1%',
      trendUp: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-start justify-between mb-2">
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
                <span
                  className={`text-xs font-medium ${
                    card.trendUp ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {card.trend}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-1">{card.title}</p>
              <p className="text-lg sm:text-xl font-bold">{card.value}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
