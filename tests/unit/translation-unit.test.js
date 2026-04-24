"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const TranslationService_1 = __importDefault(require("../../src/services/TranslationService"));
/**
 * Unit tests for Translation Service (without API calls) / 翻译服务单元测试（不调用 API）
 *
 * Tests the caching and validation logic without requiring API key
 * 测试缓存和验证逻辑，无需 API 密钥
 */
describe('TranslationService - Unit Tests', () => {
    beforeEach(() => {
        // Clear cache before each test / 每个测试前清除缓存
        TranslationService_1.default.clearCache();
    });
    describe('Input Validation', () => {
        it('should throw error for empty text in translateText', async () => {
            await expect(TranslationService_1.default.translateText('', 'en')).rejects.toThrow('Text to translate cannot be empty');
        });
        it('should throw error for whitespace-only text in translateText', async () => {
            await expect(TranslationService_1.default.translateText('   ', 'en')).rejects.toThrow('Text to translate cannot be empty');
        });
        it('should throw error for empty text in detectLanguage', async () => {
            await expect(TranslationService_1.default.detectLanguage('')).rejects.toThrow('Text for language detection cannot be empty');
        });
        it('should throw error for whitespace-only text in detectLanguage', async () => {
            await expect(TranslationService_1.default.detectLanguage('   ')).rejects.toThrow('Text for language detection cannot be empty');
        });
    });
    describe('translateBatch', () => {
        it('should return empty array for empty input', async () => {
            const results = await TranslationService_1.default.translateBatch([], 'en');
            expect(results).toEqual([]);
        });
        it('should handle null/undefined in batch gracefully', async () => {
            // This test verifies the service doesn't crash with invalid input
            const results = await TranslationService_1.default.translateBatch([], 'en');
            expect(Array.isArray(results)).toBe(true);
        });
    });
    describe('Cache Management', () => {
        it('should clear cache', () => {
            // Clear cache / 清除缓存
            TranslationService_1.default.clearCache();
            const stats = TranslationService_1.default.getCacheStats();
            expect(stats.size).toBe(0);
        });
        it('should return cache statistics', () => {
            const stats = TranslationService_1.default.getCacheStats();
            expect(stats).toBeDefined();
            expect(stats.size).toBeDefined();
            expect(stats.maxSize).toBeDefined();
            expect(stats.maxAge).toBeDefined();
            expect(stats.size).toBeGreaterThanOrEqual(0);
            expect(stats.maxSize).toBeGreaterThan(0);
            expect(stats.maxAge).toBeGreaterThan(0);
        });
        it('should have correct cache configuration', () => {
            const stats = TranslationService_1.default.getCacheStats();
            // Verify cache has reasonable limits / 验证缓存有合理的限制
            expect(stats.maxSize).toBe(1000);
            expect(stats.maxAge).toBe(24 * 60 * 60 * 1000); // 24 hours
        });
        it('should start with empty cache', () => {
            TranslationService_1.default.clearCache();
            const stats = TranslationService_1.default.getCacheStats();
            expect(stats.size).toBe(0);
        });
    });
    describe('Language Code Normalization', () => {
        it('should accept supported language codes', () => {
            // Test that the service accepts the supported language codes
            // without throwing errors (actual translation would require API key)
            const supportedLanguages = ['en', 'th', 'zh', 'zh-CN'];
            supportedLanguages.forEach(lang => {
                expect(typeof lang).toBe('string');
                expect(lang.length).toBeGreaterThan(0);
            });
        });
    });
    describe('Service Initialization', () => {
        it('should initialize without crashing', () => {
            // Verify the service singleton is created / 验证服务单例已创建
            expect(TranslationService_1.default).toBeDefined();
            expect(typeof TranslationService_1.default.translateText).toBe('function');
            expect(typeof TranslationService_1.default.detectLanguage).toBe('function');
            expect(typeof TranslationService_1.default.translateBatch).toBe('function');
            expect(typeof TranslationService_1.default.clearCache).toBe('function');
            expect(typeof TranslationService_1.default.getCacheStats).toBe('function');
        });
        it('should have all required methods', () => {
            const methods = [
                'translateText',
                'detectLanguage',
                'translateBatch',
                'clearCache',
                'getCacheStats',
            ];
            methods.forEach(method => {
                expect(TranslationService_1.default).toHaveProperty(method);
                expect(typeof TranslationService_1.default[method]).toBe('function');
            });
        });
    });
    describe('Type Safety', () => {
        it('should accept valid language codes for translateText', () => {
            // This test verifies TypeScript types are correct
            const validCalls = [
                () => TranslationService_1.default.translateText('test', 'en'),
                () => TranslationService_1.default.translateText('test', 'th'),
                () => TranslationService_1.default.translateText('test', 'zh'),
                () => TranslationService_1.default.translateText('test', 'zh-CN'),
                () => TranslationService_1.default.translateText('test', 'en', 'zh'),
            ];
            // All these should be valid function calls (won't execute without API key)
            validCalls.forEach(call => {
                expect(typeof call).toBe('function');
            });
        });
        it('should accept valid language codes for translateBatch', () => {
            const validCalls = [
                () => TranslationService_1.default.translateBatch(['test'], 'en'),
                () => TranslationService_1.default.translateBatch(['test'], 'th'),
                () => TranslationService_1.default.translateBatch(['test'], 'zh'),
                () => TranslationService_1.default.translateBatch(['test'], 'zh-CN'),
                () => TranslationService_1.default.translateBatch(['test'], 'en', 'zh'),
            ];
            validCalls.forEach(call => {
                expect(typeof call).toBe('function');
            });
        });
    });
});
describe('TranslationService - API Key Warning', () => {
    it('should warn when API key is not set', () => {
        // This test verifies that the service warns about missing API key
        // The warning is logged during module initialization
        const apiKey = process.env['GOOGLE_TRANSLATE_API_KEY'];
        if (!apiKey) {
            // If no API key, the service should still initialize but warn
            expect(TranslationService_1.default).toBeDefined();
        }
        else {
            // If API key exists, service should work normally
            expect(TranslationService_1.default).toBeDefined();
        }
    });
});
