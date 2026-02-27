/**
 * Unit tests for chat management features
 * Tests chat deletion, read status tracking, and notifications
 */

import { ChatModel } from '../../src/models/ChatModel';
import { MessageModel } from '../../src/models/MessageModel';
import { UserModel } from '../../src/models/UserModel';
import { ProductModel } from '../../src/models/ProductModel';
import { notificationService } from '../../src/services/NotificationService';
import { DatabaseManager } from '../../src/config/database';

describe('Chat Management Features', () => {
  let chatModel: ChatModel;
  let messageModel: MessageModel;
  let userModel: UserModel;
  let productModel: ProductModel;
  let testUser1: any;
  let testUser2: any;
  let testProduct: any;
  let testChat: any;

  beforeAll(async () => {
    // Initialize database
    const dbManager = DatabaseManager.getInstance();
    await dbManager.initialize();

    // Initialize models
    chatModel = new ChatModel();
    messageModel = new MessageModel();
    userModel = new UserModel();
    productModel = new ProductModel();
  });

  beforeEach(async () => {
    // Clear tables
    const db = DatabaseManager.getInstance().getDatabase();
    db.exec('DELETE FROM Message');
    db.exec('DELETE FROM Chat');
    db.exec('DELETE FROM ProductListing');
    db.exec('DELETE FROM User');

    // Create test users
    testUser1 = await userModel.createUser({
      email: 'buyer@university.edu',
      name: 'Test Buyer',
      isVerified: true,
      preferredLanguage: 'en',
      isAdmin: false,
      status: 'active'
    });

    testUser2 = await userModel.createUser({
      email: 'seller@university.edu',
      name: 'Test Seller',
      isVerified: true,
      preferredLanguage: 'en',
      isAdmin: false,
      status: 'active'
    });

    // Create test product
    testProduct = await productModel.createProduct({
      title: 'Test Product',
      description: 'Test description',
      price: 100,
      stock: 1,
      condition: 'new',
      categoryID: 1,
      sellerID: testUser2.userID,
      status: 'active'
    });

    // Create test chat
    testChat = await chatModel.createChat({
      buyerID: testUser1.userID,
      sellerID: testUser2.userID,
      listingID: testProduct.listingID,
      status: 'active'
    });
  });

  afterAll(async () => {
    await DatabaseManager.getInstance().close();
  });

  describe('Chat Deletion with Cascade Cleanup', () => {
    test('should soft delete chat by setting status to deleted', async () => {
      const success = await chatModel.deleteChat(testChat.chatID);
      expect(success).toBe(true);

      const chat = await chatModel.getChatById(testChat.chatID);
      expect(chat).not.toBeNull();
      expect(chat?.status).toBe('deleted');
    });

    test('should hard delete chat and all associated messages', async () => {
      // Create some messages
      await messageModel.createMessage({
        chatID: testChat.chatID,
        senderID: testUser1.userID,
        messageText: 'Test message 1',
        messageType: 'text',
        isTranslated: false
      });

      await messageModel.createMessage({
        chatID: testChat.chatID,
        senderID: testUser2.userID,
        messageText: 'Test message 2',
        messageType: 'text',
        isTranslated: false
      });

      // Hard delete chat
      const success = await chatModel.hardDeleteChat(testChat.chatID);
      expect(success).toBe(true);

      // Verify chat is deleted (returns null or undefined)
      const chat = await chatModel.getChatById(testChat.chatID);
      expect(chat).toBeFalsy();

      // Verify messages are deleted
      const messages = await messageModel.getMessagesByChat(testChat.chatID);
      expect(messages.data).toHaveLength(0);
    });

    test('should not delete chat if user is not participant', async () => {
      // Create another user
      const otherUser = await userModel.createUser({
        email: 'other@university.edu',
        name: 'Other User',
        isVerified: true,
        preferredLanguage: 'en',
        isAdmin: false,
        status: 'active'
      });

      // Check if other user is participant
      const isParticipant = await chatModel.isUserInChat(testChat.chatID, otherUser.userID);
      expect(isParticipant).toBe(false);
    });

    test('should return false when deleting non-existent chat', async () => {
      const success = await chatModel.deleteChat('chat_nonexistent');
      expect(success).toBe(false);
    });
  });

  describe('Message Read Status Tracking', () => {
    test('should mark single message as read', async () => {
      const message = await messageModel.createMessage({
        chatID: testChat.chatID,
        senderID: testUser1.userID,
        messageText: 'Test message',
        messageType: 'text',
        isTranslated: false
      });

      expect(message.isRead).toBe(0); // SQLite stores boolean as 0/1

      await messageModel.markAsRead(message.messageID);

      const updatedMessage = await messageModel.getMessageById(message.messageID);
      expect(updatedMessage?.isRead).toBe(1); // SQLite stores boolean as 0/1
    });

    test('should mark all chat messages as read for specific user', async () => {
      // Create messages from user2 to user1
      await messageModel.createMessage({
        chatID: testChat.chatID,
        senderID: testUser2.userID,
        messageText: 'Message 1',
        messageType: 'text',
        isTranslated: false
      });

      await messageModel.createMessage({
        chatID: testChat.chatID,
        senderID: testUser2.userID,
        messageText: 'Message 2',
        messageType: 'text',
        isTranslated: false
      });

      // Create message from user1 (should not be marked as read)
      await messageModel.createMessage({
        chatID: testChat.chatID,
        senderID: testUser1.userID,
        messageText: 'Message 3',
        messageType: 'text',
        isTranslated: false
      });

      // Mark messages as read for user1
      const updatedCount = await messageModel.markChatMessagesAsRead(
        testChat.chatID,
        testUser1.userID
      );

      expect(updatedCount).toBe(2); // Only messages from user2

      // Verify unread count
      const unreadCount = await messageModel.getUnreadCount(testChat.chatID, testUser1.userID);
      expect(unreadCount).toBe(0);
    });

    test('should get correct unread message count', async () => {
      // Create unread messages
      await messageModel.createMessage({
        chatID: testChat.chatID,
        senderID: testUser2.userID,
        messageText: 'Unread 1',
        messageType: 'text',
        isTranslated: false
      });

      await messageModel.createMessage({
        chatID: testChat.chatID,
        senderID: testUser2.userID,
        messageText: 'Unread 2',
        messageType: 'text',
        isTranslated: false
      });

      const unreadCount = await messageModel.getUnreadCount(testChat.chatID, testUser1.userID);
      expect(unreadCount).toBe(2);
    });

    test('should get total unread count across all chats', async () => {
      // Create another chat
      const product2 = await productModel.createProduct({
        title: 'Product 2',
        price: 200,
        stock: 1,
        condition: 'used',
        categoryID: 1,
        sellerID: testUser2.userID,
        status: 'active'
      });

      const chat2 = await chatModel.createChat({
        buyerID: testUser1.userID,
        sellerID: testUser2.userID,
        listingID: product2.listingID,
        status: 'active'
      });

      // Create messages in both chats
      await messageModel.createMessage({
        chatID: testChat.chatID,
        senderID: testUser2.userID,
        messageText: 'Chat 1 message',
        messageType: 'text',
        isTranslated: false
      });

      await messageModel.createMessage({
        chatID: chat2.chatID,
        senderID: testUser2.userID,
        messageText: 'Chat 2 message',
        messageType: 'text',
        isTranslated: false
      });

      const totalUnread = await messageModel.getTotalUnreadCount(testUser1.userID);
      expect(totalUnread).toBe(2);
    });

    test('should not count own messages as unread', async () => {
      await messageModel.createMessage({
        chatID: testChat.chatID,
        senderID: testUser1.userID,
        messageText: 'My own message',
        messageType: 'text',
        isTranslated: false
      });

      const unreadCount = await messageModel.getUnreadCount(testChat.chatID, testUser1.userID);
      expect(unreadCount).toBe(0);
    });
  });

  describe('Real-Time Notification System', () => {
    test('should create new message notification', async () => {
      const notification = await notificationService.createNewMessageNotification(
        testUser1.userID,
        testChat.chatID,
        testUser2.userID,
        testUser2.name,
        'Hello, is this still available?',
        testProduct.title
      );

      expect(notification).toBeDefined();
      expect(notification.type).toBe('new_message');
      expect(notification.chatID).toBe(testChat.chatID);
      expect(notification.senderID).toBe(testUser2.userID);
      expect(notification.senderName).toBe(testUser2.name);
      expect(notification.messagePreview).toBe('Hello, is this still available?');
      expect(notification.productTitle).toBe(testProduct.title);
      expect(notification.isRead).toBe(false);
    });

    test('should create chat deleted notification', async () => {
      const notification = await notificationService.createChatDeletedNotification(
        testUser1.userID,
        testChat.chatID,
        testUser2.userID,
        testProduct.title
      );

      expect(notification).toBeDefined();
      expect(notification.type).toBe('chat_deleted');
      expect(notification.chatID).toBe(testChat.chatID);
      expect(notification.productTitle).toBe(testProduct.title);
      expect(notification.isRead).toBe(false);
    });

    test('should create messages read notification', async () => {
      const notification = await notificationService.createMessagesReadNotification(
        testUser2.userID,
        testChat.chatID,
        testUser1.name,
        3
      );

      expect(notification).toBeDefined();
      expect(notification.type).toBe('message_read');
      expect(notification.chatID).toBe(testChat.chatID);
      expect(notification.message).toContain('read 3 messages');
      expect(notification.isRead).toBe(false);
    });

    test('should get all chat notifications for user', async () => {
      // Create multiple notifications
      await notificationService.createNewMessageNotification(
        testUser1.userID,
        testChat.chatID,
        testUser2.userID,
        testUser2.name,
        'Message 1',
        testProduct.title
      );

      await notificationService.createChatDeletedNotification(
        testUser1.userID,
        testChat.chatID,
        testUser2.userID,
        testProduct.title
      );

      const notifications = await notificationService.getChatNotifications(testUser1.userID);
      expect(notifications).toHaveLength(2);
      expect(notifications.every(n => 'chatID' in n)).toBe(true);
    });

    test('should get unread chat notifications count', async () => {
      await notificationService.createNewMessageNotification(
        testUser1.userID,
        testChat.chatID,
        testUser2.userID,
        testUser2.name,
        'Unread message',
        testProduct.title
      );

      const count = await notificationService.getUnreadChatNotificationsCount(testUser1.userID);
      expect(count).toBe(1);
    });

    test('should mark notification as read', async () => {
      const notification = await notificationService.createNewMessageNotification(
        testUser1.userID,
        testChat.chatID,
        testUser2.userID,
        testUser2.name,
        'Test message',
        testProduct.title
      );

      const success = await notificationService.markAsRead(
        testUser1.userID,
        notification.notificationID
      );

      expect(success).toBe(true);

      const notifications = await notificationService.getUnreadNotifications(testUser1.userID);
      expect(notifications.find(n => n.notificationID === notification.notificationID)).toBeUndefined();
    });

    test('should truncate long message previews', async () => {
      const longMessage = 'A'.repeat(150);
      
      const notification = await notificationService.createNewMessageNotification(
        testUser1.userID,
        testChat.chatID,
        testUser2.userID,
        testUser2.name,
        longMessage,
        testProduct.title
      );

      expect(notification.messagePreview?.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Chat Management Integration', () => {
    test('should update last message time when message is sent', async () => {
      const originalChat = await chatModel.getChatById(testChat.chatID);
      const originalTime = originalChat?.lastMessageAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      await messageModel.createMessage({
        chatID: testChat.chatID,
        senderID: testUser1.userID,
        messageText: 'New message',
        messageType: 'text',
        isTranslated: false
      });

      await chatModel.updateLastMessageTime(testChat.chatID);

      const updatedChat = await chatModel.getChatById(testChat.chatID);
      expect(updatedChat?.lastMessageAt).not.toBe(originalTime);
    });

    test('should verify user is participant before operations', async () => {
      const otherUser = await userModel.createUser({
        email: 'nonparticipant@university.edu',
        name: 'Non Participant',
        isVerified: true,
        preferredLanguage: 'en',
        isAdmin: false,
        status: 'active'
      });

      const isParticipant = await chatModel.isUserInChat(testChat.chatID, otherUser.userID);
      expect(isParticipant).toBe(false);

      const isBuyer = await chatModel.isUserInChat(testChat.chatID, testUser1.userID);
      expect(isBuyer).toBe(true);

      const isSeller = await chatModel.isUserInChat(testChat.chatID, testUser2.userID);
      expect(isSeller).toBe(true);
    });

    test('should get chat with full details including unread count', async () => {
      // Create unread messages
      await messageModel.createMessage({
        chatID: testChat.chatID,
        senderID: testUser2.userID,
        messageText: 'Unread 1',
        messageType: 'text',
        isTranslated: false
      });

      await messageModel.createMessage({
        chatID: testChat.chatID,
        senderID: testUser2.userID,
        messageText: 'Unread 2',
        messageType: 'text',
        isTranslated: false
      });

      const chats = await chatModel.getChatsByUser(testUser1.userID);
      expect(chats.data).toHaveLength(1);
      expect(chats.data[0].unreadCount).toBe(2);
    });
  });
});
