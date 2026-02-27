/**
 * Unit tests for chat message translation integration
 * Tests automatic translation and manual translation features
 */

import { ChatModel } from '../../src/models/ChatModel';
import { MessageModel } from '../../src/models/MessageModel';
import { UserModel } from '../../src/models/UserModel';
import { ProductModel } from '../../src/models/ProductModel';
import translationService from '../../src/services/TranslationService';
import { DatabaseManager } from '../../src/config/database';

describe('Chat Message Translation Integration', () => {
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

    // Create test users with different language preferences
    testUser1 = await userModel.createUser({
      email: 'english@university.edu',
      name: 'English User',
      isVerified: true,
      preferredLanguage: 'en',
      isAdmin: false,
      status: 'active'
    });

    testUser2 = await userModel.createUser({
      email: 'thai@university.edu',
      name: 'Thai User',
      isVerified: true,
      preferredLanguage: 'th',
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

  describe('Message Storage with Translation', () => {
    test('should store message with translation data', async () => {
      const message = await messageModel.createMessage({
        chatID: testChat.chatID,
        senderID: testUser1.userID,
        messageText: 'Hello, is this available?',
        messageType: 'text',
        isTranslated: true,
        originalLanguage: 'en',
        translatedText: 'สวัสดี สินค้านี้ยังมีอยู่ไหม'
      });

      expect(message.isTranslated).toBe(1); // SQLite stores boolean as 0/1
      expect(message.originalLanguage).toBe('en');
      expect(message.translatedText).toBe('สวัสดี สินค้านี้ยังมีอยู่ไหม');
    });

    test('should store message without translation', async () => {
      const message = await messageModel.createMessage({
        chatID: testChat.chatID,
        senderID: testUser1.userID,
        messageText: 'Hello',
        messageType: 'text',
        isTranslated: false
      });

      expect(message.isTranslated).toBe(0);
      expect(message.originalLanguage).toBeNull();
      expect(message.translatedText).toBeNull();
    });

    test('should retrieve message with translation details', async () => {
      await messageModel.createMessage({
        chatID: testChat.chatID,
        senderID: testUser1.userID,
        messageText: 'Original text',
        messageType: 'text',
        isTranslated: true,
        originalLanguage: 'en',
        translatedText: 'Translated text'
      });

      const messages = await messageModel.getMessagesByChat(testChat.chatID);
      expect(messages.data).toHaveLength(1);
      expect(messages.data[0].isTranslated).toBe(1);
      expect(messages.data[0].originalLanguage).toBe('en');
      expect(messages.data[0].translatedText).toBe('Translated text');
    });
  });

  describe('Translation Service Integration', () => {
    // Skip tests that require real Google Translate API
    test.skip('should detect language of text', async () => {
      const detection = await translationService.detectLanguage('Hello, how are you?');
      
      expect(detection).toBeDefined();
      expect(detection.language).toBeDefined();
      expect(detection.confidence).toBeGreaterThanOrEqual(0);
    });

    test.skip('should translate text between languages', async () => {
      const translation = await translationService.translateText(
        'Hello',
        'th',
        'en'
      );

      expect(translation).toBeDefined();
      expect(translation.translatedText).toBeDefined();
      expect(translation.sourceLanguage).toBe('en');
      expect(translation.targetLanguage).toBe('th');
    });

    test.skip('should use cache for repeated translations', async () => {
      const text = 'Hello, world!';
      
      // First translation
      const translation1 = await translationService.translateText(text, 'th', 'en');
      
      // Second translation (should use cache)
      const translation2 = await translationService.translateText(text, 'th', 'en');

      expect(translation1.translatedText).toBe(translation2.translatedText);
      
      const stats = translationService.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);
    });

    test('should handle translation errors gracefully', async () => {
      await expect(
        translationService.translateText('', 'th', 'en')
      ).rejects.toThrow('Text to translate cannot be empty');
    });

    test.skip('should translate batch of texts', async () => {
      const texts = ['Hello', 'Goodbye', 'Thank you'];
      
      const translations = await translationService.translateBatch(texts, 'th', 'en');

      expect(translations).toHaveLength(3);
      translations.forEach(translation => {
        expect(translation).toBeDefined();
        expect(translation.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Automatic Translation Workflow', () => {
    test.skip('should create message with automatic translation based on user preference', async () => {
      // Simulate sending message from English user to Thai user
      const originalText = 'Is this product still available?';
      
      // Detect language
      const detection = await translationService.detectLanguage(originalText);
      
      // Translate to recipient's language
      const translation = await translationService.translateText(
        originalText,
        testUser2.preferredLanguage as any,
        detection.language as any
      );

      // Create message with translation
      const message = await messageModel.createMessage({
        chatID: testChat.chatID,
        senderID: testUser1.userID,
        messageText: originalText,
        messageType: 'text',
        isTranslated: true,
        originalLanguage: detection.language,
        translatedText: translation.translatedText
      });

      expect(message.isTranslated).toBe(1);
      expect(message.originalLanguage).toBe(detection.language);
      expect(message.translatedText).toBeDefined();
    });

    test('should not translate if sender and recipient have same language preference', async () => {
      // Update user2 to have same language as user1
      await userModel.updateUser(testUser2.userID, {
        preferredLanguage: 'en'
      });

      const updatedUser2 = await userModel.getUserById(testUser2.userID);
      
      // If languages are the same, no translation needed
      const shouldTranslate = testUser1.preferredLanguage !== updatedUser2?.preferredLanguage;
      
      expect(shouldTranslate).toBe(false);
    });

    test.skip('should handle multiple messages with different translations', async () => {
      const messages = [
        { text: 'Hello', lang: 'en' },
        { text: 'สวัสดี', lang: 'th' },
        { text: '你好', lang: 'zh' }
      ];

      for (const msg of messages) {
        const translation = await translationService.translateText(
          msg.text,
          'en',
          msg.lang as any
        );

        await messageModel.createMessage({
          chatID: testChat.chatID,
          senderID: testUser1.userID,
          messageText: msg.text,
          messageType: 'text',
          isTranslated: true,
          originalLanguage: msg.lang,
          translatedText: translation.translatedText
        });
      }

      const allMessages = await messageModel.getMessagesByChat(testChat.chatID);
      expect(allMessages.data).toHaveLength(3);
      expect(allMessages.data.every(m => m.isTranslated === 1)).toBe(true);
    });
  });

  describe('Translation Cache Management', () => {
    test.skip('should cache translations', async () => {
      const text = 'Test message for caching';
      
      // Clear cache first
      translationService.clearCache();
      
      // First translation
      await translationService.translateText(text, 'th', 'en');
      
      const stats = translationService.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);
    });

    test.skip('should clear cache', async () => {
      await translationService.translateText('Test', 'th', 'en');
      
      translationService.clearCache();
      
      const stats = translationService.getCacheStats();
      expect(stats.size).toBe(0);
    });

    test('should provide cache statistics', async () => {
      const stats = translationService.getCacheStats();
      
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('maxSize');
      expect(stats).toHaveProperty('maxAge');
      expect(typeof stats.size).toBe('number');
      expect(typeof stats.maxSize).toBe('number');
      expect(typeof stats.maxAge).toBe('number');
    });
  });

  describe('Message Translation Retrieval', () => {
    test('should retrieve messages with both original and translated text', async () => {
      await messageModel.createMessage({
        chatID: testChat.chatID,
        senderID: testUser1.userID,
        messageText: 'Hello',
        messageType: 'text',
        isTranslated: true,
        originalLanguage: 'en',
        translatedText: 'สวัสดี'
      });

      const messages = await messageModel.getMessagesByChat(testChat.chatID);
      const message = messages.data[0];

      expect(message.messageText).toBe('Hello');
      expect(message.translatedText).toBe('สวัสดี');
      expect(message.originalLanguage).toBe('en');
    });

    test('should get message statistics including translated messages', async () => {
      // Create mix of translated and non-translated messages
      await messageModel.createMessage({
        chatID: testChat.chatID,
        senderID: testUser1.userID,
        messageText: 'Hello',
        messageType: 'text',
        isTranslated: true,
        originalLanguage: 'en',
        translatedText: 'สวัสดี'
      });

      await messageModel.createMessage({
        chatID: testChat.chatID,
        senderID: testUser2.userID,
        messageText: 'Hi',
        messageType: 'text',
        isTranslated: false
      });

      const stats = await messageModel.getChatMessageStats(testChat.chatID);
      
      expect(stats.totalMessages).toBe(2);
      expect(stats.textMessages).toBe(2);
      expect(stats.translatedMessages).toBe(1);
    });
  });
});
