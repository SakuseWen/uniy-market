/**
 * Translation Service using Google Cloud Translation API v2 (REST)
 * 使用 Google Cloud Translation API v2 REST 接口的翻译服务
 *
 * Uses native fetch to call the REST endpoint directly — no SDK dependency.
 * 使用原生 fetch 直接调用 REST 端点，不依赖 SDK，避免版本兼容性问题。
 *
 * Endpoint: POST https://translation.googleapis.com/language/translate/v2
 * Auth: API Key via ?key= query param (read from GOOGLE_TRANSLATE_API_KEY env var)
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

// Google Translate v2 REST endpoint / Google Translate v2 REST 端点
const TRANSLATE_ENDPOINT = 'https://translation.googleapis.com/language/translate/v2';
const DETECT_ENDPOINT = 'https://translation.googleapis.com/language/translate/v2/detect';

class TranslationService {
  private cache: Map<string, CacheEntry>;
  private readonly cacheMaxAge: number = 24 * 60 * 60 * 1000; // 24 hours / 24小时
  private readonly cacheMaxSize: number = 1000; // Max cache entries / 最大缓存条目数

  constructor() {
    this.cache = new Map();

    // Warn at startup if API key is missing / 启动时若 Key 缺失则警告
    if (!process.env['GOOGLE_TRANSLATE_API_KEY']) {
      console.warn(
        '[TranslationService] GOOGLE_TRANSLATE_API_KEY is not set. Translation requests will fail.'
      );
    }
  }

  // ─── Cache helpers ────────────────────────────────────────────────────────

  /** Generate cache key / 生成缓存键 */
  private getCacheKey(text: string, targetLanguage: string, sourceLanguage?: string): string {
    return `${sourceLanguage ?? 'auto'}:${targetLanguage}:${text}`;
  }

  /** Get translation from cache / 从缓存获取翻译 */
  private getFromCache(key: string): string | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.cacheMaxAge) {
      this.cache.delete(key);
      return null;
    }
    return entry.translatedText;
  }

  /** Save translation to cache / 保存翻译到缓存 */
  private saveToCache(key: string, translatedText: string, sourceLanguage: string): void {
    // Evict oldest entry when full / 缓存满时淘汰最旧条目
    if (this.cache.size >= this.cacheMaxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(key, { translatedText, sourceLanguage, timestamp: Date.now() });
  }

  // ─── Core translation ─────────────────────────────────────────────────────

  /**
   * Translate text via Google Cloud Translation API v2 REST
   * 通过 Google Cloud Translation API v2 REST 翻译文本
   *
   * Request body: { q, target, format: 'text' }
   * Response: data.translations[0].translatedText
   */
  async translateText(
    text: string,
    targetLanguage: SupportedLanguage,
    sourceLanguage?: SupportedLanguage
  ): Promise<TranslationResult> {
    if (!text || text.trim().length === 0) {
      throw new Error('Text to translate cannot be empty');
    }

    const apiKey = process.env['GOOGLE_TRANSLATE_API_KEY'];
    if (!apiKey) {
      throw new Error(
        'GOOGLE_TRANSLATE_API_KEY is not configured. Translation service is unavailable.'
      );
    }

    // Normalise zh → zh-CN / 规范化 zh → zh-CN
    const normTarget = targetLanguage === 'zh' ? 'zh-CN' : targetLanguage;
    const normSource = sourceLanguage
      ? (sourceLanguage === 'zh' ? 'zh-CN' : sourceLanguage)
      : undefined;

    // Check cache first / 优先检查缓存
    const cacheKey = this.getCacheKey(text, normTarget, normSource);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return { translatedText: cached, sourceLanguage: normSource ?? 'auto', targetLanguage: normTarget };
    }

    // Call Google Cloud Translation API v2 REST / 调用 Google Cloud Translation API v2 REST
    const response = await fetch(`${TRANSLATE_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        target: normTarget,
        format: 'text', // Avoid HTML entities in response / 避免响应中包含 HTML 实体
        ...(normSource ? { source: normSource } : {}),
      }),
    });

    if (!response.ok) {
      // Log specific error for 403 (billing) or 400 (key/quota issues)
      // 记录 403（计费未启用）或 400（Key/配额问题）的具体错误
      const errBody = await response.text().catch(() => '');
      console.error(`[TranslationService] API error ${response.status}:`, errBody);
      throw new Error(`Google Translate API error ${response.status}: ${errBody}`);
    }

    // Parse standard v2 response: data.translations[0].translatedText
    // 解析标准 v2 响应结构
    const data = await response.json() as {
      data?: { translations?: Array<{ translatedText?: string; detectedSourceLanguage?: string }> };
    };

    const translatedText = data?.data?.translations?.[0]?.translatedText ?? '';
    const detectedSource = data?.data?.translations?.[0]?.detectedSourceLanguage ?? normSource ?? 'auto';

    if (!translatedText) {
      throw new Error('Google Translate API returned an empty translation');
    }

    this.saveToCache(cacheKey, translatedText, detectedSource);

    return {
      translatedText,
      sourceLanguage: detectedSource,
      targetLanguage: normTarget,
    };
  }

  /**
   * Detect language via Google Cloud Translation API v2 REST
   * 通过 Google Cloud Translation API v2 REST 检测文本语言
   */
  async detectLanguage(text: string): Promise<LanguageDetectionResult> {
    if (!text || text.trim().length === 0) {
      throw new Error('Text for language detection cannot be empty');
    }

    const apiKey = process.env['GOOGLE_TRANSLATE_API_KEY'];
    if (!apiKey) {
      throw new Error('GOOGLE_TRANSLATE_API_KEY is not configured.');
    }

    const response = await fetch(`${DETECT_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text }),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      throw new Error(`Google Detect API error ${response.status}: ${errBody}`);
    }

    const data = await response.json() as {
      data?: { detections?: Array<Array<{ language?: string; confidence?: number }>> };
    };

    const detection = data?.data?.detections?.[0]?.[0];

    return {
      language: detection?.language ?? 'en',
      confidence: detection?.confidence ?? 1,
    };
  }

  /**
   * Translate multiple texts in batch
   * 批量翻译多个文本
   */
  async translateBatch(
    texts: string[],
    targetLanguage: SupportedLanguage,
    sourceLanguage?: SupportedLanguage
  ): Promise<string[]> {
    if (!texts || texts.length === 0) return [];

    const results: string[] = [];
    for (const text of texts) {
      try {
        const result = await this.translateText(text, targetLanguage, sourceLanguage);
        results.push(result.translatedText);
      } catch {
        results.push(text); // Fallback to original on error / 出错时回退到原文
      }
    }
    return results;
  }

  /** Clear translation cache / 清除翻译缓存 */
  clearCache(): void {
    this.cache.clear();
  }

  /** Get cache statistics / 获取缓存统计信息 */
  getCacheStats(): { size: number; maxSize: number; maxAge: number } {
    return { size: this.cache.size, maxSize: this.cacheMaxSize, maxAge: this.cacheMaxAge };
  }
}

// Export singleton instance / 导出单例实例
export default new TranslationService();
