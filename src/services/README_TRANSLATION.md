# Translation Service / 翻译服务

## Overview / 概述

The Translation Service provides automatic translation using Google Cloud Translation API with intelligent caching to reduce API calls and costs.

翻译服务使用 Google 云翻译 API 提供自动翻译，带有智能缓存以减少 API 调用和成本。

## Features / 功能

- **Multi-language Support / 多语言支持**: English (EN), Thai (TH), Chinese (ZH)
- **Automatic Language Detection / 自动语言检测**: Detects source language when not specified
- **Intelligent Caching / 智能缓存**: Reduces API calls with 24-hour cache
- **Batch Translation / 批量翻译**: Translate multiple texts efficiently
- **Type Safety / 类型安全**: Full TypeScript support

## Setup / 设置

### 1. Get Google Cloud Translation API Key / 获取 Google 云翻译 API 密钥

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Cloud Translation API
4. Create credentials (API Key)
5. Copy the API key

### 2. Configure Environment Variables / 配置环境变量

Add the API key to your `.env` file:

```bash
GOOGLE_TRANSLATE_API_KEY=your-api-key-here
```

## Usage / 使用方法

### Basic Translation / 基本翻译

```typescript
import TranslationService from './services/TranslationService';

// Translate text / 翻译文本
const result = await TranslationService.translateText(
  'Hello, world!',
  'zh' // Target language / 目标语言
);

console.log(result.translatedText); // 你好，世界！
console.log(result.sourceLanguage); // en
console.log(result.targetLanguage); // zh-CN
```

### With Source Language / 指定源语言

```typescript
const result = await TranslationService.translateText(
  '你好，世界！',
  'en', // Target language / 目标语言
  'zh'  // Source language / 源语言
);

console.log(result.translatedText); // Hello, world!
```

### Language Detection / 语言检测

```typescript
const detection = await TranslationService.detectLanguage('สวัสดี');

console.log(detection.language);   // th
console.log(detection.confidence); // 0.95
```

### Batch Translation / 批量翻译

```typescript
const texts = ['Hello', 'Good morning', 'Thank you'];
const translations = await TranslationService.translateBatch(texts, 'zh');

console.log(translations);
// ['你好', '早上好', '谢谢']
```

### Cache Management / 缓存管理

```typescript
// Get cache statistics / 获取缓存统计
const stats = TranslationService.getCacheStats();
console.log(stats);
// { size: 10, maxSize: 1000, maxAge: 86400000 }

// Clear cache / 清除缓存
TranslationService.clearCache();
```

## Supported Languages / 支持的语言

- `en` - English / 英语
- `th` - Thai / 泰语
- `zh` or `zh-CN` - Chinese (Simplified) / 中文（简体）

## Caching Strategy / 缓存策略

The service implements an intelligent caching system:

服务实现了智能缓存系统：

- **Cache Duration / 缓存时长**: 24 hours
- **Cache Size / 缓存大小**: Maximum 1000 entries
- **Cache Key / 缓存键**: Based on source language, target language, and text
- **Automatic Cleanup / 自动清理**: Removes oldest entries when cache is full

## Testing / 测试

### Unit Tests (No API Key Required) / 单元测试（无需 API 密钥）

```bash
npm test -- tests/unit/translation-unit.test.ts
```

These tests verify:
- Input validation
- Cache management
- Service initialization
- Type safety

### Integration Tests (API Key Required) / 集成测试（需要 API 密钥）

```bash
# Set API key in .env first / 首先在 .env 中设置 API 密钥
npm test -- tests/unit/translation.test.ts
```

These tests verify:
- Actual translation functionality
- Language detection
- Batch translation
- Cache effectiveness

## Error Handling / 错误处理

The service handles various error scenarios:

```typescript
try {
  const result = await TranslationService.translateText('', 'en');
} catch (error) {
  console.error(error.message); // "Text to translate cannot be empty"
}

try {
  const result = await TranslationService.translateText('Hello', 'en');
} catch (error) {
  console.error(error.message); // "Failed to translate text" (if API error)
}
```

## Performance Considerations / 性能考虑

1. **Use Caching / 使用缓存**: The service automatically caches translations
2. **Batch Operations / 批量操作**: Use `translateBatch` for multiple texts
3. **Specify Source Language / 指定源语言**: Improves accuracy and speed
4. **Monitor API Usage / 监控 API 使用**: Check Google Cloud Console for usage

## Cost Optimization / 成本优化

- **Caching / 缓存**: Reduces API calls by up to 90%
- **Batch Translation / 批量翻译**: More efficient than individual calls
- **24-hour Cache / 24小时缓存**: Balances freshness and cost
- **1000 Entry Limit / 1000条目限制**: Prevents excessive memory usage

## API Limits / API 限制

Google Cloud Translation API has the following limits:

- **Free Tier / 免费层**: 500,000 characters per month
- **Rate Limit / 速率限制**: Varies by project
- **Character Limit / 字符限制**: 30,000 characters per request

See [Google Cloud Translation Pricing](https://cloud.google.com/translate/pricing) for details.

## Troubleshooting / 故障排除

### API Key Not Working / API 密钥不工作

1. Verify the API key is correct in `.env`
2. Check that Cloud Translation API is enabled in Google Cloud Console
3. Verify billing is enabled for your project
4. Check API key restrictions (if any)

### Translation Errors / 翻译错误

1. Check internet connectivity
2. Verify API quota is not exceeded
3. Check error logs for specific error messages
4. Ensure text is not empty or too long

### Cache Issues / 缓存问题

1. Clear cache: `TranslationService.clearCache()`
2. Check cache stats: `TranslationService.getCacheStats()`
3. Restart the service if needed

## Integration with Chat System / 与聊天系统集成

The Translation Service is designed to integrate with the real-time chat system:

```typescript
// In chat message handler / 在聊天消息处理器中
async function handleChatMessage(message: string, senderLang: string, recipientLang: string) {
  if (senderLang !== recipientLang) {
    const translated = await TranslationService.translateText(
      message,
      recipientLang,
      senderLang
    );
    
    return {
      original: message,
      translated: translated.translatedText,
      sourceLanguage: senderLang,
      targetLanguage: recipientLang,
    };
  }
  
  return { original: message };
}
```

## Future Enhancements / 未来增强

- [ ] Support for more languages
- [ ] Redis-based distributed caching
- [ ] Translation quality scoring
- [ ] Offline translation fallback
- [ ] Custom translation models
- [ ] Translation history tracking

## References / 参考

- [Google Cloud Translation API Documentation](https://cloud.google.com/translate/docs)
- [Node.js Client Library](https://github.com/googleapis/nodejs-translate)
- [API Reference](https://cloud.google.com/translate/docs/reference/rest)
