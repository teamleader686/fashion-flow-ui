import { supabase } from './supabase';
import {
  Notification,
  NotificationModule,
  NotificationRole,
  NotificationType,
  NotificationPriority,
} from '@/types/notifications';

interface CreateNotificationParams {
  userId: string;
  role: NotificationRole;
  module: NotificationModule;
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  referenceId?: string;
  referenceType?: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
}

class NotificationService {
  /**
   * Create a new notification
   */
  async createNotification(params: CreateNotificationParams): Promise<Notification | null> {
    try {
      const notification = {
        user_id: params.userId,
        role: params.role,
        module: params.module,
        type: params.type,
        title: params.title,
        message: params.message,
        status: 'unread',
        priority: params.priority || 'medium',
        reference_id: params.referenceId,
        reference_type: params.referenceType,
        action_url: params.actionUrl,
        action_label: params.actionLabel,
        metadata: params.metadata,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('notifications')
        .insert(notification)
        .select()
        .single();

      if (error) throw error;

      return data as Notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }

  /**
   * Order Notifications
   */
  async notifyOrderPlaced(orderId: string, userId: string, orderNumber: string) {
    // Notify user
    await this.createNotification({
      userId,
      role: 'user',
      module: 'order',
      type: 'order_placed',
      title: 'Order Placed Successfully',
      message: `Your order #${orderNumber} has been placed successfully.`,
      priority: 'high',
      referenceId: orderId,
      referenceType: 'order',
      actionUrl: `/account?tab=orders`,
      actionLabel: 'View Order',
    });

    // Notify admin
    const { data: admins } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('is_active', true);

    if (admins) {
      for (const admin of admins) {
        await this.createNotification({
          userId: admin.user_id,
          role: 'admin',
          module: 'order',
          type: 'order_placed',
          title: 'New Order Received',
          message: `New order #${orderNumber} has been placed.`,
          priority: 'high',
          referenceId: orderId,
          referenceType: 'order',
          actionUrl: `/admin/orders`,
          actionLabel: 'View Orders',
        });
      }
    }
  }

  async notifyOrderStatusChange(
    orderId: string,
    userId: string,
    orderNumber: string,
    status: string
  ) {
    const statusMessages: Record<string, { title: string; message: string; type: NotificationType }> = {
      confirmed: {
        title: 'Order Confirmed',
        message: `Your order #${orderNumber} has been confirmed.`,
        type: 'order_confirmed',
      },
      processing: {
        title: 'Order Processing',
        message: `Your order #${orderNumber} is being processed.`,
        type: 'order_processing',
      },
      shipped: {
        title: 'Order Shipped',
        message: `Your order #${orderNumber} has been shipped.`,
        type: 'order_shipped',
      },
      delivered: {
        title: 'Order Delivered',
        message: `Your order #${orderNumber} has been delivered.`,
        type: 'order_delivered',
      },
      cancelled: {
        title: 'Order Cancelled',
        message: `Your order #${orderNumber} has been cancelled.`,
        type: 'order_cancelled',
      },
    };

    const statusInfo = statusMessages[status];
    if (statusInfo) {
      await this.createNotification({
        userId,
        role: 'user',
        module: 'order',
        type: statusInfo.type,
        title: statusInfo.title,
        message: statusInfo.message,
        priority: status === 'delivered' ? 'high' : 'medium',
        referenceId: orderId,
        referenceType: 'order',
        actionUrl: `/account?tab=orders`,
        actionLabel: 'View Order',
      });
    }
  }

  async notifyOrderCancelled(orderId: string, orderNumber: string) {
    // Notify admin
    const { data: admins } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('is_active', true);

    if (admins) {
      for (const admin of admins) {
        await this.createNotification({
          userId: admin.user_id,
          role: 'admin',
          module: 'order',
          type: 'order_cancelled',
          title: 'Order Cancelled',
          message: `Order #${orderNumber} has been cancelled by customer.`,
          priority: 'medium',
          referenceId: orderId,
          referenceType: 'order',
          actionUrl: `/admin/orders`,
          actionLabel: 'View Orders',
        });
      }
    }
  }

  async notifyReturnRequest(orderId: string, orderNumber: string) {
    // Notify admin
    const { data: admins } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('is_active', true);

    if (admins) {
      for (const admin of admins) {
        await this.createNotification({
          userId: admin.user_id,
          role: 'admin',
          module: 'order',
          type: 'order_returned',
          title: 'Return Request Submitted',
          message: `Return request for order #${orderNumber} has been submitted.`,
          priority: 'high',
          referenceId: orderId,
          referenceType: 'order',
          actionUrl: `/admin/orders`,
          actionLabel: 'View Returns',
        });
      }
    }
  }

  async notifyReturnStatus(
    orderId: string,
    userId: string,
    orderNumber: string,
    approved: boolean
  ) {
    await this.createNotification({
      userId,
      role: 'user',
      module: 'order',
      type: approved ? 'return_approved' : 'return_rejected',
      title: approved ? 'Return Approved' : 'Return Rejected',
      message: approved
        ? `Your return request for order #${orderNumber} has been approved.`
        : `Your return request for order #${orderNumber} has been rejected.`,
      priority: 'high',
      referenceId: orderId,
      referenceType: 'order',
      actionUrl: `/account?tab=orders`,
      actionLabel: 'View Order',
    });
  }

  async notifyRefundCompleted(orderId: string, userId: string, orderNumber: string, amount: number) {
    await this.createNotification({
      userId,
      role: 'user',
      module: 'order',
      type: 'refund_completed',
      title: 'Refund Completed',
      message: `Refund of ₹${amount} for order #${orderNumber} has been processed.`,
      priority: 'high',
      referenceId: orderId,
      referenceType: 'order',
      actionUrl: `/account?tab=orders`,
      actionLabel: 'View Order',
    });
  }

  /**
   * Shipping Notifications
   */
  async notifyCourierAssigned(
    orderId: string,
    userId: string,
    orderNumber: string,
    courier: string
  ) {
    await this.createNotification({
      userId,
      role: 'user',
      module: 'shipping',
      type: 'courier_assigned',
      title: 'Courier Assigned',
      message: `${courier} has been assigned for your order #${orderNumber}.`,
      priority: 'medium',
      referenceId: orderId,
      referenceType: 'shipment',
      actionUrl: `/account?tab=orders`,
      actionLabel: 'Track Order',
    });
  }

  async notifyTrackingGenerated(
    orderId: string,
    userId: string,
    orderNumber: string,
    trackingNumber: string
  ) {
    await this.createNotification({
      userId,
      role: 'user',
      module: 'shipping',
      type: 'tracking_generated',
      title: 'Tracking Number Generated',
      message: `Tracking number ${trackingNumber} generated for order #${orderNumber}.`,
      priority: 'high',
      referenceId: orderId,
      referenceType: 'shipment',
      actionUrl: `/account?tab=orders`,
      actionLabel: 'Track Order',
    });
  }

  async notifyShippingStatus(
    orderId: string,
    userId: string,
    orderNumber: string,
    status: string
  ) {
    const statusMessages: Record<string, { title: string; message: string; type: NotificationType }> = {
      picked_up: {
        title: 'Package Picked Up',
        message: `Your order #${orderNumber} has been picked up by courier.`,
        type: 'picked_up',
      },
      in_transit: {
        title: 'Package In Transit',
        message: `Your order #${orderNumber} is on the way.`,
        type: 'in_transit',
      },
      out_for_delivery: {
        title: 'Out for Delivery',
        message: `Your order #${orderNumber} is out for delivery today.`,
        type: 'out_for_delivery',
      },
      delivered: {
        title: 'Package Delivered',
        message: `Your order #${orderNumber} has been delivered.`,
        type: 'delivered',
      },
    };

    const statusInfo = statusMessages[status];
    if (statusInfo) {
      await this.createNotification({
        userId,
        role: 'user',
        module: 'shipping',
        type: statusInfo.type,
        title: statusInfo.title,
        message: statusInfo.message,
        priority: status === 'out_for_delivery' || status === 'delivered' ? 'high' : 'medium',
        referenceId: orderId,
        referenceType: 'shipment',
        actionUrl: `/account?tab=orders`,
        actionLabel: 'Track Order',
      });
    }
  }

  async notifyDeliveryFailed(orderId: string, orderNumber: string, reason: string) {
    // Notify admin
    const { data: admins } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('is_active', true);

    if (admins) {
      for (const admin of admins) {
        await this.createNotification({
          userId: admin.user_id,
          role: 'admin',
          module: 'shipping',
          type: 'delivery_failed',
          title: 'Delivery Failed',
          message: `Delivery failed for order #${orderNumber}. Reason: ${reason}`,
          priority: 'urgent',
          referenceId: orderId,
          referenceType: 'shipment',
          actionUrl: `/admin/shipping`,
          actionLabel: 'View Shipments',
        });
      }
    }
  }

  /**
   * Instagram Marketing Notifications
   */
  async notifyCampaignCreated(campaignId: string, campaignTitle: string) {
    const { data: admins } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('is_active', true);

    if (admins) {
      for (const admin of admins) {
        await this.createNotification({
          userId: admin.user_id,
          role: 'admin',
          module: 'instagram',
          type: 'campaign_created',
          title: 'New Campaign Created',
          message: `Campaign "${campaignTitle}" has been created.`,
          priority: 'medium',
          referenceId: campaignId,
          referenceType: 'campaign',
          actionUrl: `/admin/instagram-marketing`,
          actionLabel: 'View Campaign',
        });
      }
    }
  }

  async notifyStoryAssigned(
    instagramUserId: string,
    campaignTitle: string,
    assignmentId: string
  ) {
    await this.createNotification({
      userId: instagramUserId,
      role: 'instagram_user',
      module: 'instagram',
      type: 'story_assigned',
      title: 'New Story Assignment',
      message: `You have been assigned to campaign "${campaignTitle}".`,
      priority: 'high',
      referenceId: assignmentId,
      referenceType: 'assignment',
      actionUrl: `/instagram-dashboard`,
      actionLabel: 'View Assignment',
    });
  }

  async notifyCoinsEarned(instagramUserId: string, coins: number, reason: string) {
    await this.createNotification({
      userId: instagramUserId,
      role: 'instagram_user',
      module: 'instagram',
      type: 'coins_earned',
      title: 'Coins Earned',
      message: `You earned ${coins} coins! ${reason}`,
      priority: 'high',
      referenceId: instagramUserId,
      referenceType: 'coins',
      actionUrl: `/instagram-dashboard`,
      actionLabel: 'View Balance',
    });
  }

  /**
   * Affiliate Notifications
   */
  async notifyCommissionEarned(
    affiliateId: string,
    amount: number,
    orderId: string
  ) {
    await this.createNotification({
      userId: affiliateId,
      role: 'affiliate',
      module: 'affiliate',
      type: 'commission_earned',
      title: 'Commission Earned',
      message: `You earned ₹${amount} commission from a new sale.`,
      priority: 'high',
      referenceId: orderId,
      referenceType: 'commission',
      actionUrl: `/affiliate-dashboard`,
      actionLabel: 'View Earnings',
    });
  }

  async notifyCommissionStatus(
    affiliateId: string,
    amount: number,
    approved: boolean
  ) {
    await this.createNotification({
      userId: affiliateId,
      role: 'affiliate',
      module: 'affiliate',
      type: approved ? 'commission_approved' : 'commission_rejected',
      title: approved ? 'Commission Approved' : 'Commission Rejected',
      message: approved
        ? `Your commission of ₹${amount} has been approved.`
        : `Your commission of ₹${amount} has been rejected.`,
      priority: 'high',
      referenceId: affiliateId,
      referenceType: 'commission',
      actionUrl: `/affiliate-dashboard`,
      actionLabel: 'View Details',
    });
  }

  async notifyPayoutProcessed(affiliateId: string, amount: number) {
    await this.createNotification({
      userId: affiliateId,
      role: 'affiliate',
      module: 'affiliate',
      type: 'payout_processed',
      title: 'Payout Processed',
      message: `Your payout of ₹${amount} has been processed successfully.`,
      priority: 'urgent',
      referenceId: affiliateId,
      referenceType: 'payout',
      actionUrl: `/affiliate-dashboard`,
      actionLabel: 'View Payouts',
    });
  }

  async notifyAffiliateRegistered(affiliateId: string, affiliateName: string) {
    const { data: admins } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('is_active', true);

    if (admins) {
      for (const admin of admins) {
        await this.createNotification({
          userId: admin.user_id,
          role: 'admin',
          module: 'affiliate',
          type: 'affiliate_registered',
          title: 'New Affiliate Registered',
          message: `${affiliateName} has registered as an affiliate.`,
          priority: 'medium',
          referenceId: affiliateId,
          referenceType: 'affiliate',
          actionUrl: `/admin/affiliate-marketing`,
          actionLabel: 'View Affiliates',
        });
      }
    }
  }

  async notifyPayoutRequest(affiliateId: string, affiliateName: string, amount: number) {
    const { data: admins } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('is_active', true);

    if (admins) {
      for (const admin of admins) {
        await this.createNotification({
          userId: admin.user_id,
          role: 'admin',
          module: 'affiliate',
          type: 'payout_requested',
          title: 'Payout Request',
          message: `${affiliateName} requested payout of ₹${amount}.`,
          priority: 'high',
          referenceId: affiliateId,
          referenceType: 'payout',
          actionUrl: `/admin/affiliate-marketing`,
          actionLabel: 'Process Payout',
        });
      }
    }
  }

  /**
   * Cancellation Request Notifications
   */
  async notifyCancellationRequested(
    orderId: string,
    orderNumber: string,
    userId: string,
    reason: string
  ) {
    // Notify admin
    const { data: admins } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('is_active', true);

    if (admins) {
      for (const admin of admins) {
        await this.createNotification({
          userId: admin.user_id,
          role: 'admin',
          module: 'order',
          type: 'order_cancelled',
          title: 'Cancellation Request',
          message: `Cancellation request for order #${orderNumber}. Reason: ${reason}`,
          priority: 'high',
          referenceId: orderId,
          referenceType: 'order',
          actionUrl: `/admin/cancellation-requests`,
          actionLabel: 'Review Request',
        });
      }
    }

    // Notify user
    await this.createNotification({
      userId,
      role: 'user',
      module: 'order',
      type: 'order_cancelled',
      title: 'Cancellation Request Submitted',
      message: `Your cancellation request for order #${orderNumber} is under review.`,
      priority: 'medium',
      referenceId: orderId,
      referenceType: 'order',
      actionUrl: `/my-orders`,
      actionLabel: 'View Order',
    });
  }

  async notifyCancellationApproved(
    orderId: string,
    userId: string,
    orderNumber: string
  ) {
    await this.createNotification({
      userId,
      role: 'user',
      module: 'order',
      type: 'order_cancelled',
      title: 'Cancellation Approved',
      message: `Your cancellation request for order #${orderNumber} has been approved. Refund will be processed soon.`,
      priority: 'high',
      referenceId: orderId,
      referenceType: 'order',
      actionUrl: `/my-orders`,
      actionLabel: 'View Order',
    });
  }

  async notifyCancellationRejected(
    orderId: string,
    userId: string,
    orderNumber: string,
    rejectionReason: string
  ) {
    await this.createNotification({
      userId,
      role: 'user',
      module: 'order',
      type: 'order_cancelled',
      title: 'Cancellation Rejected',
      message: `Your cancellation request for order #${orderNumber} has been rejected. Reason: ${rejectionReason}`,
      priority: 'high',
      referenceId: orderId,
      referenceType: 'order',
      actionUrl: `/my-orders`,
      actionLabel: 'View Order',
    });
  }
}

export const notificationService = new NotificationService();
