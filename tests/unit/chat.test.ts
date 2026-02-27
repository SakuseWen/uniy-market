import { ChatModel } from '../../src/models/ChatModel';
import { MessageModel } from '../../src/models/MessageModel';
import { UserModel } from '../../src/models/UserModel';
import { ProductModel } from '../../src/models/ProductModel';
import { DatabaseManager } from '../../src/config/database';

describe('Chat Functionality Tests', () => {
  let chatModel: ChatModel;
  let messageModel: MessageModel;
  let userModel: UserModel;
  let productModel: ProductModel;
  let testUser1: any;
  let testUser2: any;
  let testProduct: any;

  beforeAll(async () => {
    // Initialize database
    const dbManager = DatabaseManager.getInstance();
    await dbManager.initialize();

    chatModel = new ChatModel();
    messageModel = new MessageModel();
    userModel = new UserModel();
    productModel = new ProductModel();

    // Create test users
    testUser1 = await userModel.createUser({
      email: 'buyer@test.com',
      name: 'Test Buyer',
      isVerified: true,
      preferredLanguage: 'en',
      isAdmin: false,
      status: 'active'
    });

    testUser2 = await userModel.createUser({
      email: 'seller@test.com',
      name: 'Test Seller',
      isVerified: true,
      preferredLanguage: 'en',
      isAdmin: false,
      status: 'active'
    });

    // Create test product
    testProduct = await productModel.createProduct({
      title: 'Test Product for Chat',
      description: 'A product to test chat functionality',
      price: 100,
      stock: 1,
      condition: 'used',
      categoryID: 1,
      sellerID: testUser2.userID,
      status: 'active'
    });
  });

  afterAll(async () => {
    const dbManager = DatabaseManager.getInstance();
    await dbManager.close();
  });

  describe('Chat Creation and Management', () => {
    test('should create a new chat between buyer and seller', async () => {
      const chat = await chatModel.createChat({
        buyerID: testUser1.userID,
        sellerID: testUser2.userID,
        listingID: testProduct.listingID,
        status: 'active'
      });

      expect(chat).toBeDefined();
      expect(chat.chatID).toBeDefined();
      expect(chat.buyerID).toBe(testUser1.userID);
      expect(chat.sellerID).toBe(testUser2.userID);
      expect(chat.listingID).toBe(testProduct.listingID);
      expect(chat.status).toBe('active');
    });

    test('should return existing chat if one already exists', async () => {
      const chat1 = await chatModel.createChat({
        buyerID: testUser1.userID,
        sellerID: testUser2.userID,
        listingID: testProduct.listingID,
        status: 'active'
      });

      const chat2 = await chatModel.createChat({
        buyerID: testUser1.userID,
        sellerID: testUser2.userID,
        listingID: testProduct.listingID,
        status: 'active'
      });

      expect(chat1.chatID).toBe(chat2.chatID);
    });

    test('should get chat by ID', async () => {
      const chat = await chatModel.createChat({
        buyerID: testUser1.userID,
        sellerID: testUser2.userID,
        listingID: testProduct.listingID,
        status: 'active'
      });

      const retrievedChat = await chatModel.getChatById(chat.chatID);

      expect(retrievedChat).toBeDefined();
      expect(retrievedChat?.chatID).toBe(chat.chatID);
    });

    test('should get chat with details including product and user info', async () => {
      const chat = await chatModel.createChat({
        buyerID: testUser1.userID,
        sellerID: testUser2.userID,
        listingID: testProduct.listingID,
        status: 'active'
      });

      const chatWithDetails = await chatModel.getChatWithDetails(chat.chatID);

      expect(chatWithDetails).toBeDefined();
      expect(chatWithDetails.productTitle).toBe(testProduct.title);
      expect(chatWithDetails.buyerName).toBe(testUser1.name);
      expect(chatWithDetails.sellerName).toBe(testUser2.name);
    });

    test('should get all chats for a user', async () => {
      const result = await chatModel.getChatsByUser(testUser1.userID);

      expect(result).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.pagination).toBeDefined();
      expect(result.data.length).toBeGreaterThan(0);
    });

    test('should verify if user is participant in chat', async () => {
      const chat = await chatModel.createChat({
        buyerID: testUser1.userID,
        sellerID: testUser2.userID,
        listingID: testProduct.listingID,
        status: 'active'
      });

      const isBuyerParticipant = await chatModel.isUserInChat(chat.chatID, testUser1.userID);
      const isSellerParticipant = await chatModel.isUserInChat(chat.chatID, testUser2.userID);
      const isOtherUserParticipant = await chatModel.isUserInChat(chat.chatID, 'random_user_id');

      expect(isBuyerParticipant).toBe(true);
      expect(isSellerParticipant).toBe(true);
      expect(isOtherUserParticipant).toBe(false);
    });

    test('should delete chat (soft delete)', async () => {
      const chat = await chatModel.createChat({
        buyerID: testUser1.userID,
        sellerID: testUser2.userID,
        listingID: testProduct.listingID,
        status: 'active'
      });

      const success = await chatModel.deleteChat(chat.chatID);
      expect(success).toBe(true);

      const deletedChat = await chatModel.getChatById(chat.chatID);
      expect(deletedChat?.status).toBe('deleted');
    });
  });

  describe('Message Sending and Receiving', () => {
    let testChat: any;

    beforeEach(async () => {
      testChat = await chatModel.createChat({
        buyerID: testUser1.userID,
        sellerID: testUser2.userID,
        listingID: testProduct.listingID,
        status: 'active'
      });
    });

    test('should send a text message', async () => {
      const message = await messageModel.createMessage({
        chatID: testChat.chatID,
        senderID: testUser1.userID,
        messageText: 'Hello, is this item still available?',
        messageType: 'text',
        isTranslated: false
      });

      expect(message).toBeDefined();
      expect(message.messageID).toBeDefined();
      expect(message.chatID).toBe(testChat.chatID);
      expect(message.senderID).toBe(testUser1.userID);
      expect(message.messageText).toBe('Hello, is this item still available?');
      expect(message.messageType).toBe('text');
      expect(message.isRead).toBeFalsy(); // SQLite returns 0 for false
    });

    test('should send an image message', async () => {
      const message = await messageModel.createMessage({
        chatID: testChat.chatID,
        senderID: testUser2.userID,
        messageText: '/uploads/messages/test-image.jpg',
        messageType: 'image',
        isTranslated: false
      });

      expect(message).toBeDefined();
      expect(message.messageType).toBe('image');
      expect(message.messageText).toContain('/uploads/messages/');
    });

    test('should get messages for a chat', async () => {
      // Send multiple messages
      await messageModel.createMessage({
        chatID: testChat.chatID,
        senderID: testUser1.userID,
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

      const result = await messageModel.getMessagesByChat(testChat.chatID);

      expect(result).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThanOrEqual(2);
      expect(result.pagination).toBeDefined();
    });

    test('should get message with sender details', async () => {
      const message = await messageModel.createMessage({
        chatID: testChat.chatID,
        senderID: testUser1.userID,
        messageText: 'Test message',
        messageType: 'text',
        isTranslated: false
      });

      const messageWithDetails = await messageModel.getMessageWithDetails(message.messageID);

      expect(messageWithDetails).toBeDefined();
      expect(messageWithDetails.senderName).toBe(testUser1.name);
      expect(messageWithDetails.messageText).toBe('Test message');
    });

    test('should mark message as read', async () => {
      const message = await messageModel.createMessage({
        chatID: testChat.chatID,
        senderID: testUser1.userID,
        messageText: 'Test message',
        messageType: 'text',
        isTranslated: false
      });

      expect(message.isRead).toBeFalsy(); // SQLite returns 0 for false

      await messageModel.markAsRead(message.messageID);

      const updatedMessage = await messageModel.getMessageById(message.messageID);
      expect(updatedMessage?.isRead).toBeTruthy(); // SQLite returns 1 for true
    });

    test('should mark all chat messages as read for a user', async () => {
      // User 1 sends messages
      await messageModel.createMessage({
        chatID: testChat.chatID,
        senderID: testUser1.userID,
        messageText: 'Message 1',
        messageType: 'text',
        isTranslated: false
      });

      await messageModel.createMessage({
        chatID: testChat.chatID,
        senderID: testUser1.userID,
        messageText: 'Message 2',
        messageType: 'text',
        isTranslated: false
      });

      // User 2 marks them as read
      const updatedCount = await messageModel.markChatMessagesAsRead(testChat.chatID, testUser2.userID);

      expect(updatedCount).toBeGreaterThanOrEqual(2);
    });

    test('should get unread message count', async () => {
      // User 1 sends messages
      await messageModel.createMessage({
        chatID: testChat.chatID,
        senderID: testUser1.userID,
        messageText: 'Unread message 1',
        messageType: 'text',
        isTranslated: false
      });

      await messageModel.createMessage({
        chatID: testChat.chatID,
        senderID: testUser1.userID,
        messageText: 'Unread message 2',
        messageType: 'text',
        isTranslated: false
      });

      const unreadCount = await messageModel.getUnreadCount(testChat.chatID, testUser2.userID);

      expect(unreadCount).toBeGreaterThanOrEqual(2);
    });

    test('should get total unread count for user across all chats', async () => {
      const unreadCount = await messageModel.getTotalUnreadCount(testUser2.userID);

      expect(unreadCount).toBeGreaterThanOrEqual(0);
      expect(typeof unreadCount).toBe('number');
    });

    test('should update chat last message time when message is sent', async () => {
      const chatBefore = await chatModel.getChatById(testChat.chatID);
      const timeBefore = chatBefore?.lastMessageAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));

      await messageModel.createMessage({
        chatID: testChat.chatID,
        senderID: testUser1.userID,
        messageText: 'New message',
        messageType: 'text',
        isTranslated: false
      });

      await chatModel.updateLastMessageTime(testChat.chatID);

      const chatAfter = await chatModel.getChatById(testChat.chatID);
      const timeAfter = chatAfter?.lastMessageAt;

      expect(timeAfter).not.toBe(timeBefore);
    });

    test('should get last message for a chat', async () => {
      await messageModel.createMessage({
        chatID: testChat.chatID,
        senderID: testUser1.userID,
        messageText: 'First message',
        messageType: 'text',
        isTranslated: false
      });

      // Add a small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      await messageModel.createMessage({
        chatID: testChat.chatID,
        senderID: testUser2.userID,
        messageText: 'Last message',
        messageType: 'text',
        isTranslated: false
      });

      const lastMessage = await messageModel.getLastMessage(testChat.chatID);

      expect(lastMessage).toBeDefined();
      expect(lastMessage?.messageText).toBe('Last message');
    });
  });

  describe('Message Translation Support', () => {
    let testChat: any;

    beforeEach(async () => {
      testChat = await chatModel.createChat({
        buyerID: testUser1.userID,
        sellerID: testUser2.userID,
        listingID: testProduct.listingID,
        status: 'active'
      });
    });

    test('should store translated message', async () => {
      const message = await messageModel.createMessage({
        chatID: testChat.chatID,
        senderID: testUser1.userID,
        messageText: 'Hello',
        messageType: 'text',
        isTranslated: true,
        originalLanguage: 'en',
        translatedText: 'สวัสดี'
      });

      expect(message.isTranslated).toBeTruthy(); // SQLite returns 1 for true
      expect(message.originalLanguage).toBe('en');
      expect(message.translatedText).toBe('สวัสดี');
    });

    test('should update message with translation', async () => {
      const message = await messageModel.createMessage({
        chatID: testChat.chatID,
        senderID: testUser1.userID,
        messageText: 'Hello',
        messageType: 'text',
        isTranslated: false
      });

      const updatedMessage = await messageModel.updateMessage(message.messageID, {
        isTranslated: true,
        originalLanguage: 'en',
        translatedText: '你好'
      });

      expect(updatedMessage.isTranslated).toBeTruthy(); // SQLite returns 1 for true
      expect(updatedMessage.translatedText).toBe('你好');
    });
  });

  describe('Chat Statistics', () => {
    let testChat: any;

    beforeEach(async () => {
      testChat = await chatModel.createChat({
        buyerID: testUser1.userID,
        sellerID: testUser2.userID,
        listingID: testProduct.listingID,
        status: 'active'
      });
    });

    test('should get message statistics for a chat', async () => {
      // Send different types of messages
      await messageModel.createMessage({
        chatID: testChat.chatID,
        senderID: testUser1.userID,
        messageText: 'Text message 1',
        messageType: 'text',
        isTranslated: false
      });

      await messageModel.createMessage({
        chatID: testChat.chatID,
        senderID: testUser1.userID,
        messageText: 'Text message 2',
        messageType: 'text',
        isTranslated: true,
        originalLanguage: 'en',
        translatedText: 'Translated'
      });

      await messageModel.createMessage({
        chatID: testChat.chatID,
        senderID: testUser2.userID,
        messageText: '/uploads/messages/image.jpg',
        messageType: 'image',
        isTranslated: false
      });

      const stats = await messageModel.getChatMessageStats(testChat.chatID);

      expect(stats.totalMessages).toBeGreaterThanOrEqual(3);
      expect(stats.textMessages).toBeGreaterThanOrEqual(2);
      expect(stats.imageMessages).toBeGreaterThanOrEqual(1);
      expect(stats.translatedMessages).toBeGreaterThanOrEqual(1);
    });

    test('should get active chats count for user', async () => {
      const count = await chatModel.getActiveChatsCount(testUser1.userID);

      expect(count).toBeGreaterThanOrEqual(0);
      expect(typeof count).toBe('number');
    });
  });

  describe('Edge Cases', () => {
    test('should handle non-existent chat ID', async () => {
      const chat = await chatModel.getChatById('non_existent_id');
      expect(chat).toBeFalsy(); // Can be null or undefined
    });

    test('should handle non-existent message ID', async () => {
      const message = await messageModel.getMessageById('non_existent_id');
      expect(message).toBeFalsy(); // Can be null or undefined
    });

    test('should handle empty chat (no messages)', async () => {
      // Create a new product for this test
      const newProduct = await productModel.createProduct({
        title: 'Empty Chat Test Product',
        description: 'Product for empty chat test',
        price: 50,
        stock: 1,
        condition: 'new',
        categoryID: 1,
        sellerID: testUser2.userID,
        status: 'active'
      });

      const newChat = await chatModel.createChat({
        buyerID: testUser1.userID,
        sellerID: testUser2.userID,
        listingID: newProduct.listingID,
        status: 'active'
      });

      const result = await messageModel.getMessagesByChat(newChat.chatID);

      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBe(0);
    });
  });
});
