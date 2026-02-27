import TranslationService from '../../src/services/TranslationService';

/**
 * Unit tests for Translation Service / 翻译服务单元测试
 * 
 * Tests the Google Cloud Translation API integration with caching
 * 测试 Google 云翻译 API 集成和缓存功能
 * 
 * Note: These tests require GOOGLE_TRANSLATE_API_KEY to be set in .env
 * 注意：这些测试需要在 .env 中设置 GOOGLE_TRANSLATE_API_KEY
 */

// Skip tests if API key is not configured / 如果未配置 API 密钥则跳过测试
const describeIfApiKey = process.env['GOOGLE_TRANSLATE_API_KEY'] ? describe : describe.skip;

describeIfApiKey('TranslationService - Integration Tests', () => {
  beforeEach(() => {
    // Clear cache before each test / 每个测试前清除缓存
    TranslationService.clearCache();
  });

  describe('translateText', () => {
    it('should translate text from English to Chinese', async () => {
      const text = 'Hello, world!';
      const result = await TranslationService.translateText(text, 'zh');

      expect(result).toBeDefined();
      expect(result.translatedText).toBeDefined();
      expect(result.translatedText.length).toBeGreaterThan(0);
      expect(result.targetLanguage).toBe('zh-CN');
      expect(result.sourceLanguage).toBeDefined();
    }, 10000);

    it('should translate text from English to Thai', async () => {
      const text = 'Good morning';
      const result = await TranslationService.translateText(text, 'th');

      expect(result).toBeDefined();
      expect(result.translatedText).toBeDefined();
      expect(result.translatedText.length).toBeGreaterThan(0);
      expect(result.targetLanguage).toBe('th');
    }, 10000);

    it('should translate text from Chinese to English', async () => {
      const text = '你好，世界！';
      const result = await TranslationService.translateText(text, 'en', 'zh');

      expect(result).toBeDefined();
      expect(result.translatedText).toBeDefined();
      expect(result.translatedText.length).toBeGreaterThan(0);
      expect(result.targetLanguage).toBe('en');
      expect(result.sourceLanguage).toBe('zh-CN');
    }, 10000);

    it('should translate text from Thai to English', async () => {
      const text = 'สวัสดีตอนเช้า';
      const result = await TranslationService.translateText(text, 'en', 'th');

      expect(result).toBeDefined();
      expect(result.translatedText).toBeDefined();
      expect(result.translatedText.length).toBeGreaterThan(0);
      expect(result.targetLanguage).toBe('en');
    }, 10000);

    it('should auto-detect source language when not specified', async () => {
      const text = 'Bonjour le monde';
      const result = await TranslationService.translateText(text, 'en');

      expect(result).toBeDefined();
      expect(result.translatedText).toBeDefined();
      expect(result.sourceLanguage).toBeDefined();
      expect(result.sourceLanguage).not.toBe('unknown');
    }, 10000);

    it('should throw error for empty text', async () => {
      await expect(
        TranslationService.translateText('', 'en')
      ).rejects.toThrow('Text to translate cannot be empty');
    });

    it('should throw error for whitespace-only text', async () => {
      await expect(
        TranslationService.translateText('   ', 'en')
      ).rejects.toThrow('Text to translate cannot be empty');
    });

    it('should use cache for repeated translations', async () => {
      const text = 'Hello, world!';
      
      // First translation - should hit API / 第一次翻译 - 应该调用 API
      const result1 = await TranslationService.translateText(text, 'zh');
      
      // Second translation - should use cache / 第二次翻译 - 应该使用缓存
      const result2 = await TranslationService.translateText(text, 'zh');

      expect(result1.translatedText).toBe(result2.translatedText);
      expect(result1.targetLanguage).toBe(result2.targetLanguage);
      
      // Verify cache is being used / 验证缓存正在使用
      const stats = TranslationService.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);
    }, 10000);

    it('should handle special characters and punctuation', async () => {
      const text = 'Hello! How are you? I\'m fine, thanks.';
      const result = await TranslationService.translateText(text, 'zh');

      expect(result).toBeDefined();
      expect(result.translatedText).toBeDefined();
      expect(result.translatedText.length).toBeGreaterThan(0);
    }, 10000);

    it('should handle numbers in text', async () => {
      const text = 'I have 5 apples and 3 oranges';
      const result = await TranslationService.translateText(text, 'zh');

      expect(result).toBeDefined();
      expect(result.translatedText).toBeDefined();
      expect(result.translatedText).toContain('5');
      expect(result.translatedText).toContain('3');
    }, 10000);
  });

  describe('detectLanguage', () => {
    it('should detect English language', async () => {
      const text = 'This is an English sentence';
      const result = await TranslationService.detectLanguage(text);

      expect(result).toBeDefined();
      expect(result.language).toBe('en');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    }, 10000);

    it('should detect Chinese language', async () => {
      const text = '这是一个中文句子';
      const result = await TranslationService.detectLanguage(text);

      expect(result).toBeDefined();
      expect(result.language).toMatch(/zh/);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    }, 10000);

    it('should detect Thai language', async () => {
      const text = 'นี่คือประโยคภาษาไทย';
      const result = await TranslationService.detectLanguage(text);

      expect(result).toBeDefined();
      expect(result.language).toBe('th');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    }, 10000);

    it('should throw error for empty text', async () => {
      await expect(
        TranslationService.detectLanguage('')
      ).rejects.toThrow('Text for language detection cannot be empty');
    });

    it('should throw error for whitespace-only text', async () => {
      await expect(
        TranslationService.detectLanguage('   ')
      ).rejects.toThrow('Text for language detection cannot be empty');
    });

    it('should detect language with high confidence for clear text', async () => {
      const text = 'The quick brown fox jumps over the lazy dog';
      const result = await TranslationService.detectLanguage(text);

      expect(result).toBeDefined();
      expect(result.language).toBe('en');
      expect(result.confidence).toBeGreaterThan(0.5);
    }, 10000);
  });

  describe('translateBatch', () => {
    it('should translate multiple texts', async () => {
      const texts = ['Hello', 'Good morning', 'Thank you'];
      const results = await TranslationService.translateBatch(texts, 'zh');

      expect(results).toBeDefined();
      expect(results.length).toBe(3);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.length).toBeGreaterThan(0);
      });
    }, 10000);

    it('should return empty array for empty input', async () => {
      const results = await TranslationService.translateBatch([], 'en');
      expect(results).toEqual([]);
    });

    it('should handle mixed language texts', async () => {
      const texts = ['Hello', '你好', 'สวัสดี'];
      const results = await TranslationService.translateBatch(texts, 'en');

      expect(results).toBeDefined();
      expect(results.length).toBe(3);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.length).toBeGreaterThan(0);
      });
    }, 10000);

    it('should use cache for batch translations', async () => {
      const texts = ['Hello', 'World'];
      
      // First batch translation / 第一次批量翻译
      const results1 = await TranslationService.translateBatch(texts, 'zh');
      
      // Second batch translation - should use cache / 第二次批量翻译 - 应该使用缓存
      const results2 = await TranslationService.translateBatch(texts, 'zh');

      expect(results1).toEqual(results2);
      
      // Verify cache is being used / 验证缓存正在使用
      const stats = TranslationService.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);
    }, 10000);

    it('should handle single text in array', async () => {
      const texts = ['Hello, world!'];
      const results = await TranslationService.translateBatch(texts, 'zh');

      expect(results).toBeDefined();
      expect(results.length).toBe(1);
      expect(results[0]).toBeDefined();
      if (results[0]) {
        expect(results[0].length).toBeGreaterThan(0);
      }
    }, 10000);
  });

  describe('Cache Management', () => {
    it('should clear cache', async () => {
      // Add some translations to cache / 添加一些翻译到缓存
      await TranslationService.translateText('Hello', 'zh');
      await TranslationService.translateText('World', 'zh');

      let stats = TranslationService.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);

      // Clear cache / 清除缓存
      TranslationService.clearCache();

      stats = TranslationService.getCacheStats();
      expect(stats.size).toBe(0);
    }, 10000);

    it('should return cache statistics', () => {
      const stats = TranslationService.getCacheStats();

      expect(stats).toBeDefined();
      expect(stats.size).toBeDefined();
      expect(stats.maxSize).toBeDefined();
      expect(stats.maxAge).toBeDefined();
      expect(stats.size).toBeGreaterThanOrEqual(0);
      expect(stats.maxSize).toBeGreaterThan(0);
      expect(stats.maxAge).toBeGreaterThan(0);
    });

    it('should increment cache size when adding translations', async () => {
      const initialStats = TranslationService.getCacheStats();
      const initialSize = initialStats.size;

      await TranslationService.translateText('Hello', 'zh');

      const newStats = TranslationService.getCacheStats();
      expect(newStats.size).toBe(initialSize + 1);
    }, 10000);
  });

  describe('Edge Cases', () => {
    it('should handle very long text', async () => {
      const longText = 'This is a very long sentence. '.repeat(50);
      const result = await TranslationService.translateText(longText, 'zh');

      expect(result).toBeDefined();
      expect(result.translatedText).toBeDefined();
      expect(result.translatedText.length).toBeGreaterThan(0);
    }, 15000);

    it('should handle text with emojis', async () => {
      const text = 'Hello 👋 World 🌍';
      const result = await TranslationService.translateText(text, 'zh');

      expect(result).toBeDefined();
      expect(result.translatedText).toBeDefined();
    }, 10000);

    it('should handle text with URLs', async () => {
      const text = 'Visit https://example.com for more information';
      const result = await TranslationService.translateText(text, 'zh');

      expect(result).toBeDefined();
      expect(result.translatedText).toBeDefined();
      expect(result.translatedText).toContain('https://example.com');
    }, 10000);

    it('should normalize Chinese language code', async () => {
      const text = 'Hello';
      const result = await TranslationService.translateText(text, 'zh');

      expect(result.targetLanguage).toBe('zh-CN');
    }, 10000);

    it('should handle same source and target language', async () => {
      const text = 'Hello, world!';
      const result = await TranslationService.translateText(text, 'en', 'en');

      expect(result).toBeDefined();
      expect(result.translatedText).toBeDefined();
      // Translation might return the same text or slightly modified
      expect(result.translatedText.length).toBeGreaterThan(0);
    }, 10000);
  });
});
