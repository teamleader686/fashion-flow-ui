import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

type ChartData = {
  date: string;
  profit: number;
  loss: number;
};

type ProfitLossChartProps = {
  data: ChartData[];
  loading?: boolean;
};

export default function ProfitLossChart({ data, loading = false }: ProfitLossChartProps) {
  const totalProfit = data.reduce((sum, item) => sum + item.profit, 0);
  const totalLoss = data.reduce((sum, item) => sum + item.loss, 0);
  const netMargin = totalProfit - totalLoss;
  const profitMarginPercent =
    totalProfit > 0 ? ((netMargin / totalProfit) * 100).toFixed(1) : '0';

  const pieData = [
    { name: 'Profit', value: totalProfit, color: '#10b981' },
    { name: 'Loss', value: totalLoss, color: '#ef4444' },
  ];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profit & Loss Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] sm:h-[350px] lg:h-[400px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Profit & Loss Analysis</CardTitle>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 mt-4">
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <p className="text-xs text-muted-foreground">Total Profit</p>
            </div>
            <p className="text-lg sm:text-xl font-bold text-green-600">
              ₹{totalProfit.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-red-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <p className="text-xs text-muted-foreground">Total Loss</p>
            </div>
            <p className="text-lg sm:text-xl font-bold text-red-600">
              ₹{totalLoss.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-blue-600" />
              <p className="text-xs text-muted-foreground">Net Margin</p>
            </div>
            <p
              className={`text-lg sm:text-xl font-bold ${
                netMargin >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              ₹{Math.abs(netMargin).toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {profitMarginPercent}% margin
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Area Chart */}
          <div>
            <h3 className="text-sm font-medium mb-2">Trend Over Time</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                  contentStyle={{ fontSize: '11px' }}
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  stackId="1"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.6}
                  name="Profit"
                />
                <Area
                  type="monotone"
                  dataKey="loss"
                  stackId="2"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.6}
                  name="Loss"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div>
            <h3 className="text-sm font-medium mb-2">Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                  contentStyle={{ fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
