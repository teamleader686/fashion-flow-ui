import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationModule } from '@/types/notifications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import NotificationItem from '@/components/notifications/NotificationItem';
import {
  Bell,
  CheckCheck,
  Package,
  Truck,
  Instagram,
  TrendingUp,
  Filter,
  ArrowLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedModule, setSelectedModule] = useState<NotificationModule | undefined>(
    undefined
  );

  const { notifications, stats, loading, markAllAsRead } = useNotifications({
    userId: user?.id || '',
    role: 'user',
    module: selectedModule,
    autoRefresh: true,
  });

  const modules: { value: NotificationModule | 'all'; label: string; icon: any }[] = [
    { value: 'all', label: 'All', icon: Filter },
    { value: 'order', label: 'Orders', icon: Package },
    { value: 'shipping', label: 'Shipping', icon: Truck },
    { value: 'instagram', label: 'Instagram', icon: Instagram },
    { value: 'affiliate', label: 'Affiliate', icon: TrendingUp },
  ];

  const handleModuleChange = (value: string) => {
    setSelectedModule(value === 'all' ? undefined : (value as NotificationModule));
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please login to view notifications</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center gap-3 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Notifications</h1>
            <p className="text-xs text-muted-foreground">
              {stats.unread} unread
            </p>
          </div>
          {stats.unread > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Desktop/Tablet Layout */}
      <div className="container max-w-4xl mx-auto p-4 lg:p-6">
        <Card className="hidden lg:block mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Bell className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Notifications</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {stats.unread} unread notifications
                  </p>
                </div>
              </div>
              {stats.unread > 0 && (
                <Button variant="outline" onClick={markAllAsRead}>
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Mark all as read
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Package className="h-4 w-4 text-blue-600" />
                <p className="text-xs text-muted-foreground">Orders</p>
              </div>
              <p className="text-2xl font-bold">{stats.byModule.order}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Truck className="h-4 w-4 text-green-600" />
                <p className="text-xs text-muted-foreground">Shipping</p>
              </div>
              <p className="text-2xl font-bold">{stats.byModule.shipping}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Instagram className="h-4 w-4 text-pink-600" />
                <p className="text-xs text-muted-foreground">Instagram</p>
              </div>
              <p className="text-2xl font-bold">{stats.byModule.instagram}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <p className="text-xs text-muted-foreground">Affiliate</p>
              </div>
              <p className="text-2xl font-bold">{stats.byModule.affiliate}</p>
            </CardContent>
          </Card>
        </div>

        {/* Notifications List */}
        <Card>
          <CardContent className="p-0">
            <Tabs
              defaultValue="all"
              onValueChange={handleModuleChange}
              className="w-full"
            >
              <div className="p-4 border-b">
                <TabsList className="w-full grid grid-cols-5">
                  {modules.map((module) => {
                    const Icon = module.icon;
                    const count =
                      module.value === 'all'
                        ? stats.total
                        : stats.byModule[module.value as NotificationModule];

                    return (
                      <TabsTrigger
                        key={module.value}
                        value={module.value}
                        className="flex flex-col sm:flex-row items-center gap-1 text-xs"
                      >
                        <Icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{module.label}</span>
                        {count > 0 && (
                          <span className="text-xs">({count})</span>
                        )}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </div>

              <ScrollArea className="h-[calc(100vh-400px)] lg:h-[600px]">
                {loading ? (
                  <div className="p-4 space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-20 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                      <Bell className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold mb-1">No notifications</h3>
                    <p className="text-sm text-muted-foreground">
                      You're all caught up!
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {notifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
