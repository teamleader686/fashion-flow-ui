import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

type ChartData = {
  date: string;
  revenue: number;
  expenses: number;
};

type RevenueExpenseChartProps = {
  data: ChartData[];
  chartType?: 'line' | 'bar';
  loading?: boolean;
};

export default function RevenueExpenseChart({
  data,
  chartType = 'line',
  loading = false,
}: RevenueExpenseChartProps) {
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const totalExpenses = data.reduce((sum, item) => sum + item.expenses, 0);
  const netProfit = totalRevenue - totalExpenses;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue vs Expenses</CardTitle>
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
        <CardTitle className="text-base sm:text-lg">Revenue vs Expenses</CardTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 mt-4">
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-xs text-muted-foreground">Total Revenue</p>
            <p className="text-lg sm:text-xl font-bold text-green-600">
              ₹{totalRevenue.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="bg-red-50 p-3 rounded-lg">
            <p className="text-xs text-muted-foreground">Total Expenses</p>
            <p className="text-lg sm:text-xl font-bold text-red-600">
              ₹{totalExpenses.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-blue-50 p-3 rounded-lg">
            <p className="text-xs text-muted-foreground">Net Profit</p>
            <p
              className={`text-lg sm:text-xl font-bold flex items-center gap-1 ${
                netProfit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {netProfit >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              ₹{Math.abs(netProfit).toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300} className="sm:h-[350px] lg:h-[400px]">
          {chartType === 'line' ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                contentStyle={{ fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={2}
                name="Revenue"
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="#ef4444"
                strokeWidth={2}
                name="Expenses"
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          ) : (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                contentStyle={{ fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
              <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
