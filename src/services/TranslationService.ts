import { v2 } from '@google-cloud/translate';

/**
 * Translation Service / 翻译服务
 * 
 * Provides automatic translation using Google Cloud Translation API
 * with caching to reduce API calls and costs.
 * 
 * 使用 Google 云翻译 API 提供自动翻译，
 * 带缓存以减少 API 调用和成本。
 */

// Supported languages / 支持的语言
export type SupportedLanguage = 'en' | 'th' | 'zh' | 'zh-CN';

// Translation result interface / 翻译结果接口
export interface TranslationResult {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence?: number;
}

// Language detection result / 语言检测结果
export interface LanguageDetectionResult {
  language: string;
  confidence: number;
}

// Translation cache entry / 翻译缓存条目
interface CacheEntry {
  translatedText: string;
  sourceLanguage: string;
  timestamp: number;
}

class TranslationService {
  private translate: v2.Translate;
  private cache: Map<string, CacheEntry>;
  private cacheMaxAge: number = 24 * 60 * 60 * 1000; // 24 hours in milliseconds / 24小时（毫秒）
  private cacheMaxSize: number = 1000; // Maximum cache entries / 最大缓存条目数

  constructor() {
    // Initialize Google Cloud Translation client / 初始化 Google 云翻译客户端
    const apiKey = process.env['GOOGLE_TRANSLATE_API_KEY'];
    
    if (!apiKey) {
      console.warn('GOOGLE_TRANSLATE_API_KEY not set. Translation service will not work.');
    }

    this.translate = new v2.Translate({
      key: apiKey || '',
    });

    this.cache = new Map();
  }

  /**
   * Generate cache key for translation / 生成翻译缓存键
   */
  private getCacheKey(text: string, targetLanguage: string, sourceLanguage?: string): string {
    const source = sourceLanguage || 'auto';
    return `${source}:${targetLanguage}:${text}`;
  }

  /**
   * Get translation from cache / 从缓存获取翻译
   */
  private getFromCache(cacheKey: string): string | null {
    const entry = this.cache.get(cacheKey);
    
    if (!entry) {
      return null;
    }

    // Check if cache entry is expired / 检查缓存条目是否过期
    const now = Date.now();
    if (now - entry.timestamp > this.cacheMaxAge) {
      this.cache.delete(cacheKey);
      return null;
    }

    return entry.translatedText;
  }

  /**
   * Save translation to cache / 保存翻译到缓存
   */
  private saveToCache(cacheKey: string, translatedText: string, sourceLanguage: string): void {
    // If cache is full, remove oldest entries / 如果缓存已满，删除最旧的条目
    if (this.cache.size >= this.cacheMaxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(cacheKey, {
      translatedText,
      sourceLanguage,
      timestamp: Date.now(),
    });
  }

  /**
   * Translate text to target language / 将文本翻译为目标语言
   * 
   * @param text - Text to translate / 要翻译的文本
   * @param targetLanguage - Target language code / 目标语言代码
   * @param sourceLanguage - Source language code (optional, auto-detect if not provided) / 源语言代码（可选，如果未提供则自动检测）
   * @returns Translation result / 翻译结果
   */
  async translateText(
    text: string,
    targetLanguage: SupportedLanguage,
    sourceLanguage?: SupportedLanguage
  ): Promise<TranslationResult> {
    // Validate input / 验证输入
    if (!text || text.trim().length === 0) {
      throw new Error('Text to translate cannot be empty');
    }

    // Normalize Chinese language code / 规范化中文语言代码
    const normalizedTarget = targetLanguage === 'zh' ? 'zh-CN' : targetLanguage;
    const normalizedSource = sourceLanguage === 'zh' ? 'zh-CN' : sourceLanguage;

    // Check cache first / 首先检查缓存
    const cacheKey = this.getCacheKey(text, normalizedTarget, normalizedSource);
    const cachedTranslation = this.getFromCache(cacheKey);

    if (cachedTranslation) {
      return {
        translatedText: cachedTranslation,
        sourceLanguage: normalizedSource || 'auto',
        targetLanguage: normalizedTarget,
      };
    }

    try {
      // Perform translation / 执行翻译
      const options: { from?: string; to: string } = {
        to: normalizedTarget,
      };
      
      if (normalizedSource) {
        options.from = normalizedSource;
      }

      const [translations, metadata] = await this.translate.translate([text], options);

      const translation = translations[0] || '';
      const detectedSourceLanguage = normalizedSource || metadata?.data?.translations?.[0]?.detectedSourceLanguage || 'unknown';

      // Save to cache / 保存到缓存
      this.saveToCache(cacheKey, translation, detectedSourceLanguage);

      return {
        translatedText: translation,
        sourceLanguage: detectedSourceLanguage,
        targetLanguage: normalizedTarget,
      };
    } catch (error) {
      console.error('Translation error:', error);
      throw new Error('Failed to translate text');
    }
  }

  /**
   * Detect language of text / 检测文本语言
   * 
   * @param text - Text to detect language / 要检测语言的文本
   * @returns Language detection result / 语言检测结果
   */
  async detectLanguage(text: string): Promise<LanguageDetectionResult> {
    // Validate input / 验证输入
    if (!text || text.trim().length === 0) {
      throw new Error('Text for language detection cannot be empty');
    }

    try {
      const [detection] = await this.translate.detect(text);
      
      // Handle both single detection and array of detections
      const result = Array.isArray(detection) ? detection[0] : detection;

      return {
        language: result.language,
        confidence: result.confidence || 0,
      };
    } catch (error) {
      console.error('Language detection error:', error);
      throw new Error('Failed to detect language');
    }
  }

  /**
   * Translate multiple texts in batch / 批量翻译多个文本
   * 
   * @param texts - Array of texts to translate / 要翻译的文本数组
   * @param targetLanguage - Target language code / 目标语言代码
   * @param sourceLanguage - Source language code (optional) / 源语言代码（可选）
   * @returns Array of translated texts / 翻译后的文本数组
   */
  async translateBatch(
    texts: string[],
    targetLanguage: SupportedLanguage,
    sourceLanguage?: SupportedLanguage
  ): Promise<string[]> {
    // Validate input / 验证输入
    if (!texts || texts.length === 0) {
      return [];
    }

    // Normalize Chinese language code / 规范化中文语言代码
    const normalizedTarget = targetLanguage === 'zh' ? 'zh-CN' : targetLanguage;
    const normalizedSource = sourceLanguage === 'zh' ? 'zh-CN' : sourceLanguage;

    try {
      // Check cache for each text / 检查每个文本的缓存
      const results: (string | undefined)[] = new Array(texts.length);
      const textsToTranslate: string[] = [];
      const indices: number[] = [];

      for (let i = 0; i < texts.length; i++) {
        const text = texts[i];
        if (!text) continue;
        
        const cacheKey = this.getCacheKey(text, normalizedTarget, normalizedSource);
        const cachedTranslation = this.getFromCache(cacheKey);

        if (cachedTranslation) {
          results[i] = cachedTranslation;
        } else {
          textsToTranslate.push(text);
          indices.push(i);
        }
      }

      // Translate uncached texts / 翻译未缓存的文本
      if (textsToTranslate.length > 0) {
        const options: { from?: string; to: string } = {
          to: normalizedTarget,
        };
        
        if (normalizedSource) {
          options.from = normalizedSource;
        }

        const [translations] = await this.translate.translate(textsToTranslate, options);

        const translationArray = Array.isArray(translations) ? translations : [translations];

        // Save translations to cache and results / 保存翻译到缓存和结果
        translationArray.forEach((translation, idx) => {
          const originalIndex = indices[idx];
          const originalText = textsToTranslate[idx];
          if (!originalText || originalIndex === undefined) return;
          
          const cacheKey = this.getCacheKey(originalText, normalizedTarget, normalizedSource);
          
          this.saveToCache(cacheKey, translation, normalizedSource || 'auto');
          results[originalIndex] = translation;
        });
      }

      return results.filter((r): r is string => r !== undefined);
    } catch (error) {
      console.error('Batch translation error:', error);
      throw new Error('Failed to translate texts in batch');
    }
  }

  /**
   * Clear translation cache / 清除翻译缓存
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics / 获取缓存统计信息
   */
  getCacheStats(): { size: number; maxSize: number; maxAge: number } {
    return {
      size: this.cache.size,
      maxSize: this.cacheMaxSize,
      maxAge: this.cacheMaxAge,
    };
  }
}

// Export singleton instance / 导出单例实例
export default new TranslationService();
