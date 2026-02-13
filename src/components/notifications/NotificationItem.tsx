import { Notification } from '@/types/notifications';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  Truck,
  Instagram,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface NotificationItemProps {
  notification: Notification;
  onClose?: () => void;
}

export default function NotificationItem({
  notification,
  onClose,
}: NotificationItemProps) {
  const navigate = useNavigate();
  const { markAsRead, deleteNotification } = useNotifications({
    userId: notification.user_id,
    role: notification.role,
    autoRefresh: false,
  });

  const getModuleIcon = () => {
    switch (notification.module) {
      case 'order':
        return Package;
      case 'shipping':
        return Truck;
      case 'instagram':
        return Instagram;
      case 'affiliate':
        return TrendingUp;
      default:
        return AlertCircle;
    }
  };

  const getPriorityColor = () => {
    switch (notification.priority) {
      case 'urgent':
        return 'bg-red-100 border-red-200';
      case 'high':
        return 'bg-orange-100 border-orange-200';
      case 'medium':
        return 'bg-blue-100 border-blue-200';
      case 'low':
        return 'bg-gray-100 border-gray-200';
      default:
        return 'bg-gray-100 border-gray-200';
    }
  };

  const handleClick = async () => {
    if (notification.status === 'unread') {
      await markAsRead(notification.id);
    }

    if (notification.action_url) {
      navigate(notification.action_url);
      onClose?.();
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteNotification(notification.id);
  };

  const Icon = getModuleIcon();

  return (
    <div
      className={cn(
        'p-3 sm:p-4 hover:bg-muted/50 transition-colors cursor-pointer border-l-4',
        notification.status === 'unread' ? 'bg-blue-50/50' : 'bg-background',
        getPriorityColor()
      )}
      onClick={handleClick}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div
          className={cn(
            'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
            notification.priority === 'urgent'
              ? 'bg-red-100'
              : notification.priority === 'high'
              ? 'bg-orange-100'
              : 'bg-blue-100'
          )}
        >
          <Icon
            className={cn(
              'h-5 w-5',
              notification.priority === 'urgent'
                ? 'text-red-600'
                : notification.priority === 'high'
                ? 'text-orange-600'
                : 'text-blue-600'
            )}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-semibold text-sm">{notification.title}</h4>
            {notification.status === 'unread' && (
              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-600"></div>
            )}
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-2">
            {notification.message}
          </p>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                {formatDistanceToNow(new Date(notification.created_at), {
                  addSuffix: true,
                })}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {notification.action_url && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleClick}
                >
                  {notification.action_label || 'View'}
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
