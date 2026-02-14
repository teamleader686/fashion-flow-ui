import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Notification,
  NotificationModule,
  NotificationRole,
  NotificationStats,
  NotificationStatus,
} from '@/types/notifications';
import { toast } from 'sonner';

interface UseNotificationsOptions {
  userId: string;
  role: NotificationRole;
  module?: NotificationModule;
  autoRefresh?: boolean;
}

export function useNotifications({
  userId,
  role,
  module,
  autoRefresh = true,
}: UseNotificationsOptions) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    byModule: {
      order: 0,
      shipping: 0,
      instagram: 0,
      affiliate: 0,
      system: 0,
    },
    byPriority: {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        // Temporarily removed role filter until database is fixed
        // .eq('role', role)
        .order('created_at', { ascending: false })
        .limit(100);

      // Temporarily removed module filter until database is fixed
      // if (module) {
      //   query = query.eq('module', module);
      // }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const notificationData = (data || []) as Notification[];
      setNotifications(notificationData);

      // Calculate stats based on ALL notifications
      const unreadCount = notificationData.filter((n) => n.status === 'unread').length;
      const byModule = notificationData.reduce(
        (acc, n) => {
          const mod = n.module || 'system';
          acc[mod] = (acc[mod] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );
      const byPriority = notificationData.reduce(
        (acc, n) => {
          const prio = n.priority || 'medium';
          acc[prio] = (acc[prio] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      setStats({
        total: notificationData.length,
        unread: unreadCount,
        byModule: {
          order: byModule.order || 0,
          shipping: byModule.shipping || 0,
          instagram: byModule.instagram || 0,
          affiliate: byModule.affiliate || 0,
          system: byModule.system || 0,
        },
        byPriority: {
          low: byPriority.low || 0,
          medium: byPriority.medium || 0,
          high: byPriority.high || 0,
          urgent: byPriority.urgent || 0,
        },
      });
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setError(err.message || 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [userId, role, module]);

  useEffect(() => {
    fetchNotifications();

    if (!autoRefresh) return;

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`notifications_${userId}_${role}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Notification change:', payload);
          fetchNotifications();

          // Show toast for new notifications
          if (payload.eventType === 'INSERT') {
            const newNotification = payload.new as Notification;
            if (newNotification.priority === 'urgent' || newNotification.priority === 'high') {
              toast.info(newNotification.title, {
                description: newNotification.message,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId, role, module, autoRefresh, fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          status: 'read',
          read_at: new Date().toISOString(),
        })
        .eq('id', notificationId);

      if (error) throw error;

      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId
            ? { ...n, status: 'read' as NotificationStatus, read_at: new Date().toISOString() }
            : n
        )
      );

      setStats((prev) => ({
        ...prev,
        unread: Math.max(0, prev.unread - 1),
      }));
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          status: 'read',
          read_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        // Temporarily removed role filter until database is fixed
        // .eq('role', role)
        .eq('status', 'unread');

      if (error) throw error;

      await fetchNotifications();
      toast.success('All notifications marked as read');
    } catch (err: any) {
      console.error('Error marking all as read:', err);
      toast.error('Failed to mark all as read');
    }
  };

  const archiveNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          status: 'archived',
          archived_at: new Date().toISOString(),
        })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      toast.success('Notification archived');
    } catch (err: any) {
      console.error('Error archiving notification:', err);
      toast.error('Failed to archive notification');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      toast.success('Notification deleted');
    } catch (err: any) {
      console.error('Error deleting notification:', err);
      toast.error('Failed to delete notification');
    }
  };

  const filteredNotifications = useMemo(() => {
    if (!module) return notifications;
    return notifications.filter(n => (n.module || 'system') === module);
  }, [notifications, module]);

  return {
    notifications: filteredNotifications,
    allNotifications: notifications,
    stats,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
    refetch: fetchNotifications,
  };
}
