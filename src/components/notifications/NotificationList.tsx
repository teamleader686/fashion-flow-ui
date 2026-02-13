import { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationRole, NotificationModule } from '@/types/notifications';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import NotificationItem from './NotificationItem';
import {
  CheckCheck,
  Package,
  Truck,
  Instagram,
  TrendingUp,
  Filter,
} from 'lucide-react';

interface NotificationListProps {
  userId: string;
  role: NotificationRole;
  onClose?: () => void;
}

export default function NotificationList({
  userId,
  role,
  onClose,
}: NotificationListProps) {
  const [selectedModule, setSelectedModule] = useState<NotificationModule | undefined>(
    undefined
  );

  const { notifications, stats, loading, markAllAsRead } = useNotifications({
    userId,
    role,
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

  return (
    <div className="flex flex-col h-full max-h-[600px]">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-base sm:text-lg">Notifications</h3>
          {stats.unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Module Tabs */}
        <Tabs
          defaultValue="all"
          onValueChange={handleModuleChange}
          className="w-full"
        >
          <TabsList className="w-full grid grid-cols-5 h-auto">
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
                  className="flex flex-col items-center gap-1 py-2 text-xs"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{module.label}</span>
                  {count > 0 && (
                    <span className="text-xs text-muted-foreground">({count})</span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </div>

      {/* Notification List */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3">
              <Filter className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No notifications</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClose={onClose}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            onClick={() => {
              window.location.href =
                role === 'admin' ? '/admin/notifications' : '/notifications';
              onClose?.();
            }}
          >
            View All Notifications
          </Button>
        </div>
      )}
    </div>
  );
}
