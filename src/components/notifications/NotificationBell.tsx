import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationRole } from '@/types/notifications';
import NotificationList from './NotificationList';
import { useAuth } from '@/contexts/AuthContext';

interface NotificationBellProps {
  role: NotificationRole;
  className?: string;
}

export default function NotificationBell({ role, className }: NotificationBellProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const { stats, loading } = useNotifications({
    userId: user?.id || '',
    role,
    autoRefresh: true,
  });

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`relative h-9 w-9 ${className}`}
        >
          <Bell className="h-5 w-5" />
          {stats.unread > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {stats.unread > 99 ? '99+' : stats.unread}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[90vw] sm:w-96 p-0"
        align="end"
        sideOffset={8}
      >
        <NotificationList
          userId={user.id}
          role={role}
          onClose={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}
