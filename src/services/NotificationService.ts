/**
 * NotificationService - Handles system notifications
 * 
 * This service provides a comprehensive notification system for:
 * - Product status changes
 * - Chat messages
 * - Chat deletions
 * - System alerts
 * 
 * In a production environment, this would integrate with:
 * - WebSocket/Socket.IO for real-time notifications
 * - Email service for email notifications
 * - Push notification service for mobile notifications
 */

export interface StatusChangeNotification {
  notificationID: string;
  userID: string;
  productID: string;
  productTitle: string;
  oldStatus: string;
  newStatus: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

export interface ChatNotification {
  notificationID: string;
  userID: string;
  chatID: string;
  type: 'new_message' | 'chat_deleted' | 'message_read';
  senderID?: string;
  senderName?: string;
  messagePreview?: string;
  productTitle?: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

export type Notification = StatusChangeNotification | ChatNotification;

export class NotificationService {
  // In-memory storage for notifications (in production, use database or message queue)
  private notifications: Map<string, Notification[]> = new Map();

  /**
   * Generate a unique notification ID
   */
  private generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create a notification for product status change
   */
  async createStatusChangeNotification(
    userID: string,
    productID: string,
    productTitle: string,
    oldStatus: string,
    newStatus: string
  ): Promise<StatusChangeNotification> {
    const notification: StatusChangeNotification = {
      notificationID: this.generateNotificationId(),
      userID,
      productID,
      productTitle,
      oldStatus,
      newStatus,
      message: this.generateStatusChangeMessage(productTitle, oldStatus, newStatus),
      timestamp: new Date().toISOString(),
      isRead: false
    };

    // Store notification for user
    const userNotifications = this.notifications.get(userID) || [];
    userNotifications.push(notification);
    this.notifications.set(userID, userNotifications);

    // Log notification (in production, this would trigger real-time delivery)
    console.log(`[Notification] Created for user ${userID}: ${notification.message}`);

    return notification;
  }

  /**
   * Generate a human-readable message for status change
   */
  private generateStatusChangeMessage(
    productTitle: string,
    oldStatus: string,
    newStatus: string
  ): string {
    const statusMessages: Record<string, string> = {
      'active_to_sold': `Your product "${productTitle}" has been marked as sold.`,
      'active_to_inactive': `Your product "${productTitle}" has been deactivated.`,
      'inactive_to_active': `Your product "${productTitle}" has been reactivated.`,
      'sold_to_active': `Your product "${productTitle}" has been relisted as active.`
    };

    const key = `${oldStatus}_to_${newStatus}`;
    return statusMessages[key] || `Your product "${productTitle}" status changed from ${oldStatus} to ${newStatus}.`;
  }

  /**
   * Create a notification for new chat message
   */
  async createNewMessageNotification(
    userID: string,
    chatID: string,
    senderID: string,
    senderName: string,
    messagePreview: string,
    productTitle?: string
  ): Promise<ChatNotification> {
    const notification: ChatNotification = {
      notificationID: this.generateNotificationId(),
      userID,
      chatID,
      type: 'new_message',
      senderID,
      senderName,
      messagePreview: messagePreview.substring(0, 100), // Limit preview length
      ...(productTitle && { productTitle }),
      message: `New message from ${senderName}${productTitle ? ` about "${productTitle}"` : ''}`,
      timestamp: new Date().toISOString(),
      isRead: false
    };

    // Store notification for user
    const userNotifications = this.notifications.get(userID) || [];
    userNotifications.push(notification);
    this.notifications.set(userID, userNotifications);

    console.log(`[Notification] New message notification for user ${userID} from ${senderName}`);

    return notification;
  }

  /**
   * Create a notification for chat deletion
   */
  async createChatDeletedNotification(
    userID: string,
    chatID: string,
    _deletedBy: string,
    productTitle?: string
  ): Promise<ChatNotification> {
    const notification: ChatNotification = {
      notificationID: this.generateNotificationId(),
      userID,
      chatID,
      type: 'chat_deleted',
      ...(productTitle && { productTitle }),
      message: `A chat${productTitle ? ` about "${productTitle}"` : ''} has been deleted`,
      timestamp: new Date().toISOString(),
      isRead: false
    };

    // Store notification for user
    const userNotifications = this.notifications.get(userID) || [];
    userNotifications.push(notification);
    this.notifications.set(userID, userNotifications);

    console.log(`[Notification] Chat deleted notification for user ${userID}`);

    return notification;
  }

  /**
   * Create a notification for messages being read
   */
  async createMessagesReadNotification(
    userID: string,
    chatID: string,
    readerName: string,
    messageCount: number
  ): Promise<ChatNotification> {
    const notification: ChatNotification = {
      notificationID: this.generateNotificationId(),
      userID,
      chatID,
      type: 'message_read',
      message: `${readerName} read ${messageCount} message${messageCount > 1 ? 's' : ''}`,
      timestamp: new Date().toISOString(),
      isRead: false
    };

    // Store notification for user
    const userNotifications = this.notifications.get(userID) || [];
    userNotifications.push(notification);
    this.notifications.set(userID, userNotifications);

    console.log(`[Notification] Messages read notification for user ${userID}`);

    return notification;
  }

  /**
   * Get all notifications for a user
   */
  async getUserNotifications(userID: string): Promise<Notification[]> {
    return this.notifications.get(userID) || [];
  }

  /**
   * Get unread notifications for a user
   */
  async getUnreadNotifications(userID: string): Promise<Notification[]> {
    const userNotifications = this.notifications.get(userID) || [];
    return userNotifications.filter(n => !n.isRead);
  }

  /**
   * Get chat notifications for a user
   */
  async getChatNotifications(userID: string): Promise<ChatNotification[]> {
    const userNotifications = this.notifications.get(userID) || [];
    return userNotifications.filter(n => 'chatID' in n) as ChatNotification[];
  }

  /**
   * Get unread chat notifications count
   */
  async getUnreadChatNotificationsCount(userID: string): Promise<number> {
    const chatNotifications = await this.getChatNotifications(userID);
    return chatNotifications.filter(n => !n.isRead).length;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(userID: string, notificationID: string): Promise<boolean> {
    const userNotifications = this.notifications.get(userID) || [];
    const notification = userNotifications.find(n => n.notificationID === notificationID);
    
    if (notification) {
      notification.isRead = true;
      return true;
    }
    
    return false;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userID: string): Promise<number> {
    const userNotifications = this.notifications.get(userID) || [];
    let count = 0;
    
    userNotifications.forEach(notification => {
      if (!notification.isRead) {
        notification.isRead = true;
        count++;
      }
    });
    
    return count;
  }

  /**
   * Clear all notifications for a user
   */
  async clearUserNotifications(userID: string): Promise<void> {
    this.notifications.delete(userID);
  }

  /**
   * Get notification count for a user
   */
  async getNotificationCount(userID: string): Promise<{ total: number; unread: number }> {
    const userNotifications = this.notifications.get(userID) || [];
    const unread = userNotifications.filter(n => !n.isRead).length;
    
    return {
      total: userNotifications.length,
      unread
    };
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
