/**
 * Language Switching Example / 语言切换示例
 * 
 * This file demonstrates how to use the language switching functionality
 * in the Uniy Market platform.
 * 
 * 此文件演示如何在 Uniy Market 平台中使用语言切换功能。
 */

import LocalizationService from '../services/LocalizationService';

// Example 1: Get a localized string / 示例 1：获取本地化字符串
console.log('\n=== Example 1: Get Localized Strings ===');
console.log('English welcome:', LocalizationService.getString('en', 'common.welcome'));
console.log('Thai welcome:', LocalizationService.getString('th', 'common.welcome'));
console.log('Chinese welcome:', LocalizationService.getString('zh', 'common.welcome'));

// Example 2: Get nested keys / 示例 2：获取嵌套键
console.log('\n=== Example 2: Nested Keys ===');
console.log('English product title:', LocalizationService.getString('en', 'product.title'));
console.log('Thai product title:', LocalizationService.getString('th', 'product.title'));
console.log('Chinese product title:', LocalizationService.getString('zh', 'product.title'));

// Example 3: Get entire section / 示例 3：获取整个部分
console.log('\n=== Example 3: Get Section ===');
const commonSection = LocalizationService.getSection('en', 'common');
console.log('Common section (EN):', JSON.stringify(commonSection, null, 2));

// Example 4: Get all translations for a language / 示例 4：获取某种语言的所有翻译
console.log('\n=== Example 4: Get All Translations ===');
const allEnglish = LocalizationService.getAllStrings('en');
console.log('All English translations:', Object.keys(allEnglish || {}));

// Example 5: Check supported languages / 示例 5：检查支持的语言
console.log('\n=== Example 5: Supported Languages ===');
const supportedLanguages = LocalizationService.getSupportedLanguages();
console.log('Supported languages:', supportedLanguages);

// Example 6: Validate language code / 示例 6：验证语言代码
console.log('\n=== Example 6: Validate Language Code ===');
console.log('Is "en" supported?', LocalizationService.isLanguageSupported('en'));
console.log('Is "fr" supported?', LocalizationService.isLanguageSupported('fr'));

// Example 7: Fallback for missing keys / 示例 7：缺失键的后备
console.log('\n=== Example 7: Fallback ===');
console.log('Missing key with fallback:', 
  LocalizationService.getString('en', 'nonexistent.key', 'Default Value'));
console.log('Missing key without fallback:', 
  LocalizationService.getString('en', 'nonexistent.key'));

// Example 8: Using in API context / 示例 8：在 API 上下文中使用
console.log('\n=== Example 8: API Usage Example ===');
console.log(`
// Frontend code example:

// 1. Get supported languages
fetch('/api/language/supported')
  .then(res => res.json())
  .then(data => console.log(data.data.languages));

// 2. Get all translations for a language
fetch('/api/language/locales/en')
  .then(res => res.json())
  .then(data => console.log(data.data.translations));

// 3. Update user's language preference
fetch('/api/language/preference', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({ language: 'th' })
})
  .then(res => res.json())
  .then(data => console.log('Language updated:', data));

// 4. Get current user's language preference
fetch('/api/language/preference', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
})
  .then(res => res.json())
  .then(data => console.log('Current language:', data.data.language));

// 5. Get a specific localized string
fetch('/api/language/string/common.welcome?lang=zh')
  .then(res => res.json())
  .then(data => console.log('Localized string:', data.data.value));
`);

// Example 9: Multi-language product listing / 示例 9：多语言商品列表
console.log('\n=== Example 9: Multi-language Product Listing ===');
const productData = {
  title: 'Laptop',
  price: 500,
  condition: 'used'
};

console.log('English:', {
  title: productData.title,
  priceLabel: LocalizationService.getString('en', 'product.price'),
  conditionLabel: LocalizationService.getString('en', 'product.condition'),
  conditionValue: LocalizationService.getString('en', 'product.used')
});

console.log('Thai:', {
  title: productData.title,
  priceLabel: LocalizationService.getString('th', 'product.price'),
  conditionLabel: LocalizationService.getString('th', 'product.condition'),
  conditionValue: LocalizationService.getString('th', 'product.used')
});

console.log('Chinese:', {
  title: productData.title,
  priceLabel: LocalizationService.getString('zh', 'product.price'),
  conditionLabel: LocalizationService.getString('zh', 'product.condition'),
  conditionValue: LocalizationService.getString('zh', 'product.used')
});

// Example 10: Error messages in different languages / 示例 10：不同语言的错误消息
console.log('\n=== Example 10: Error Messages ===');
const errorKey = 'errors.unauthorized';
console.log('English error:', LocalizationService.getString('en', errorKey));
console.log('Thai error:', LocalizationService.getString('th', errorKey));
console.log('Chinese error:', LocalizationService.getString('zh', errorKey));

console.log('\n=== Examples Complete ===\n');
