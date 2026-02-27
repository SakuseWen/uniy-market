import * as fs from 'fs';
import * as path from 'path';

/**
 * Localization Service / 本地化服务
 * 
 * Provides interface localization for English, Thai, and Chinese languages.
 * Loads translation files and provides methods to get localized strings.
 * 
 * 为英语、泰语和中文提供界面本地化。
 * 加载翻译文件并提供获取本地化字符串的方法。
 */

export type SupportedLanguage = 'en' | 'th' | 'zh';

interface LocaleData {
  [key: string]: any;
}

class LocalizationService {
  private locales: Map<SupportedLanguage, LocaleData>;
  private defaultLanguage: SupportedLanguage = 'en';

  constructor() {
    this.locales = new Map();
    this.loadLocales();
  }

  /**
   * Load all locale files / 加载所有语言文件
   */
  private loadLocales(): void {
    const languages: SupportedLanguage[] = ['en', 'th', 'zh'];
    const localesDir = path.join(__dirname, '..', 'locales');

    languages.forEach((lang) => {
      try {
        const filePath = path.join(localesDir, `${lang}.json`);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const localeData = JSON.parse(fileContent);
        this.locales.set(lang, localeData);
        console.log(`Loaded locale: ${lang}`);
      } catch (error) {
        console.error(`Failed to load locale ${lang}:`, error);
      }
    });
  }

  /**
   * Get localized string by key / 通过键获取本地化字符串
   * 
   * @param language - Target language / 目标语言
   * @param key - Translation key (e.g., 'common.welcome') / 翻译键（例如 'common.welcome'）
   * @param fallback - Fallback string if key not found / 如果未找到键则使用的后备字符串
   * @returns Localized string / 本地化字符串
   */
  getString(language: SupportedLanguage, key: string, fallback?: string): string {
    const locale = this.locales.get(language) || this.locales.get(this.defaultLanguage);
    
    if (!locale) {
      return fallback || key;
    }

    // Navigate through nested keys (e.g., 'common.welcome')
    const keys = key.split('.');
    let value: any = locale;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return fallback || key;
      }
    }

    return typeof value === 'string' ? value : fallback || key;
  }

  /**
   * Get entire locale section / 获取整个语言区域部分
   * 
   * @param language - Target language / 目标语言
   * @param section - Section name (e.g., 'common', 'product') / 部分名称（例如 'common'、'product'）
   * @returns Locale section object / 语言区域部分对象
   */
  getSection(language: SupportedLanguage, section: string): LocaleData | null {
    const locale = this.locales.get(language) || this.locales.get(this.defaultLanguage);
    
    if (!locale || !(section in locale)) {
      return null;
    }

    return locale[section];
  }

  /**
   * Get all translations for a language / 获取某种语言的所有翻译
   * 
   * @param language - Target language / 目标语言
   * @returns Complete locale data / 完整的语言数据
   */
  getAllStrings(language: SupportedLanguage): LocaleData | null {
    return this.locales.get(language) || this.locales.get(this.defaultLanguage) || null;
  }

  /**
   * Check if a language is supported / 检查是否支持某种语言
   * 
   * @param language - Language code to check / 要检查的语言代码
   * @returns True if language is supported / 如果支持该语言则返回 true
   */
  isLanguageSupported(language: string): language is SupportedLanguage {
    return language === 'en' || language === 'th' || language === 'zh';
  }

  /**
   * Get list of supported languages / 获取支持的语言列表
   * 
   * @returns Array of supported language codes / 支持的语言代码数组
   */
  getSupportedLanguages(): SupportedLanguage[] {
    return Array.from(this.locales.keys());
  }

  /**
   * Reload all locale files (useful for development) / 重新加载所有语言文件（对开发有用）
   */
  reload(): void {
    this.locales.clear();
    this.loadLocales();
  }
}

// Export singleton instance / 导出单例实例
export default new LocalizationService();
