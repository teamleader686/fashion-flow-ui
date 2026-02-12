import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { Users, Image, Coins, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';

type Stats = {
  total_users: number;
  active_users: number;
  total_campaigns: number;
  active_campaigns: number;
  total_assignments: number;
  active_assignments: number;
  expired_assignments: number;
  completed_assignments: number;
  total_coins_distributed: number;
};

const InstagramAnalytics = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_instagram_marketing_stats');
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setStats(data[0]);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Instagram Users',
      value: stats?.total_users || 0,
      subtitle: `${stats?.active_users || 0} active`,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Total Campaigns',
      value: stats?.total_campaigns || 0,
      subtitle: `${stats?.active_campaigns || 0} active`,
      icon: Image,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Active Stories',
      value: stats?.active_assignments || 0,
      subtitle: `${stats?.total_assignments || 0} total assigned`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Completed Stories',
      value: stats?.completed_assignments || 0,
      subtitle: 'Successfully completed',
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      title: 'Expired Stories',
      value: stats?.expired_assignments || 0,
      subtitle: 'Past deadline',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Total Coins Distributed',
      value: stats?.total_coins_distributed || 0,
      subtitle: 'Loyalty coins earned',
      icon: Coins,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Completion Rate */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Story Completion Rate</span>
                <span className="font-medium">
                  {stats?.total_assignments
                    ? Math.round(((stats.completed_assignments || 0) / stats.total_assignments) * 100)
                    : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${
                      stats?.total_assignments
                        ? ((stats.completed_assignments || 0) / stats.total_assignments) * 100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Expiry Rate */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Story Expiry Rate</span>
                <span className="font-medium">
                  {stats?.total_assignments
                    ? Math.round(((stats.expired_assignments || 0) / stats.total_assignments) * 100)
                    : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-orange-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${
                      stats?.total_assignments
                        ? ((stats.expired_assignments || 0) / stats.total_assignments) * 100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Active Rate */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Currently Active</span>
                <span className="font-medium">
                  {stats?.total_assignments
                    ? Math.round(((stats.active_assignments || 0) / stats.total_assignments) * 100)
                    : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${
                      stats?.total_assignments
                        ? ((stats.active_assignments || 0) / stats.total_assignments) * 100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">User Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Users</span>
                <span className="font-semibold text-green-600">
                  {stats?.active_users || 0} / {stats?.total_users || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg Coins per User</span>
                <span className="font-semibold">
                  {stats?.total_users
                    ? Math.round((stats.total_coins_distributed || 0) / stats.total_users)
                    : 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Campaign Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Campaigns</span>
                <span className="font-semibold text-purple-600">
                  {stats?.active_campaigns || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg Assignments per Campaign</span>
                <span className="font-semibold">
                  {stats?.total_campaigns
                    ? Math.round((stats.total_assignments || 0) / stats.total_campaigns)
                    : 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InstagramAnalytics;
