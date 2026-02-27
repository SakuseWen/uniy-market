/**
 * Translation Service Usage Examples / 翻译服务使用示例
 * 
 * This file demonstrates how to use the Translation Service
 * 本文件演示如何使用翻译服务
 * 
 * To run this example:
 * 1. Set GOOGLE_TRANSLATE_API_KEY in .env
 * 2. Run: ts-node src/examples/translation-example.ts
 */

import TranslationService from '../services/TranslationService';

async function runExamples() {
  console.log('=== Translation Service Examples ===\n');

  try {
    // Example 1: Basic Translation / 示例1：基本翻译
    console.log('1. Basic Translation (English to Chinese):');
    const result1 = await TranslationService.translateText(
      'Hello, world! Welcome to Uniy Market.',
      'zh'
    );
    console.log(`   Original: Hello, world! Welcome to Uniy Market.`);
    console.log(`   Translated: ${result1.translatedText}`);
    console.log(`   Source Language: ${result1.sourceLanguage}`);
    console.log(`   Target Language: ${result1.targetLanguage}\n`);

    // Example 2: Translation with Source Language / 示例2：指定源语言的翻译
    console.log('2. Translation with Source Language (Chinese to English):');
    const result2 = await TranslationService.translateText(
      '你好，世界！欢迎来到 Uniy Market。',
      'en',
      'zh'
    );
    console.log(`   Original: 你好，世界！欢迎来到 Uniy Market。`);
    console.log(`   Translated: ${result2.translatedText}\n`);

    // Example 3: Thai Translation / 示例3：泰语翻译
    console.log('3. Thai Translation (English to Thai):');
    const result3 = await TranslationService.translateText(
      'Good morning! How are you today?',
      'th'
    );
    console.log(`   Original: Good morning! How are you today?`);
    console.log(`   Translated: ${result3.translatedText}\n`);

    // Example 4: Language Detection / 示例4：语言检测
    console.log('4. Language Detection:');
    const texts = [
      'Hello, world!',
      '你好，世界！',
      'สวัสดีชาวโลก!',
    ];
    
    for (const text of texts) {
      const detection = await TranslationService.detectLanguage(text);
      console.log(`   Text: ${text}`);
      console.log(`   Detected Language: ${detection.language}`);
      console.log(`   Confidence: ${(detection.confidence * 100).toFixed(1)}%\n`);
    }

    // Example 5: Batch Translation / 示例5：批量翻译
    console.log('5. Batch Translation (English to Chinese):');
    const batchTexts = [
      'Hello',
      'Good morning',
      'Thank you',
      'Goodbye',
    ];
    const batchResults = await TranslationService.translateBatch(batchTexts, 'zh');
    
    batchTexts.forEach((text, index) => {
      console.log(`   ${text} → ${batchResults[index]}`);
    });
    console.log();

    // Example 6: Cache Usage / 示例6：缓存使用
    console.log('6. Cache Usage:');
    console.log('   Translating "Hello" twice to demonstrate caching...');
    
    const start1 = Date.now();
    await TranslationService.translateText('Hello', 'zh');
    const time1 = Date.now() - start1;
    console.log(`   First translation: ${time1}ms (API call)`);
    
    const start2 = Date.now();
    await TranslationService.translateText('Hello', 'zh');
    const time2 = Date.now() - start2;
    console.log(`   Second translation: ${time2}ms (from cache)`);
    console.log(`   Speed improvement: ${((time1 - time2) / time1 * 100).toFixed(1)}%\n`);

    // Example 7: Cache Statistics / 示例7：缓存统计
    console.log('7. Cache Statistics:');
    const stats = TranslationService.getCacheStats();
    console.log(`   Cache Size: ${stats.size} entries`);
    console.log(`   Max Size: ${stats.maxSize} entries`);
    console.log(`   Max Age: ${stats.maxAge / 1000 / 60 / 60} hours\n`);

    // Example 8: Product Description Translation / 示例8：商品描述翻译
    console.log('8. Product Description Translation:');
    const productDesc = 'Brand new laptop, barely used. Excellent condition with original box and accessories.';
    const descZh = await TranslationService.translateText(productDesc, 'zh');
    const descTh = await TranslationService.translateText(productDesc, 'th');
    
    console.log(`   English: ${productDesc}`);
    console.log(`   Chinese: ${descZh.translatedText}`);
    console.log(`   Thai: ${descTh.translatedText}\n`);

    // Example 9: Chat Message Translation / 示例9：聊天消息翻译
    console.log('9. Chat Message Translation (Simulating multilingual chat):');
    const chatMessages = [
      { text: 'Is this item still available?', from: 'en', to: 'zh' },
      { text: '是的，还有货', from: 'zh', to: 'en' },
      { text: 'Can you deliver to my university?', from: 'en', to: 'th' },
    ];

    for (const msg of chatMessages) {
      const translated = await TranslationService.translateText(msg.text, msg.to as any, msg.from as any);
      console.log(`   [${msg.from} → ${msg.to}] ${msg.text}`);
      console.log(`   Translation: ${translated.translatedText}\n`);
    }

    // Example 10: Error Handling / 示例10：错误处理
    console.log('10. Error Handling:');
    try {
      await TranslationService.translateText('', 'en');
    } catch (error: any) {
      console.log(`   Empty text error: ${error.message}`);
    }

    try {
      await TranslationService.detectLanguage('   ');
    } catch (error: any) {
      console.log(`   Whitespace error: ${error.message}\n`);
    }

    console.log('=== All Examples Completed Successfully! ===');

  } catch (error: any) {
    console.error('Error running examples:', error.message);
    console.error('\nMake sure GOOGLE_TRANSLATE_API_KEY is set in your .env file');
    process.exit(1);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runExamples()
    .then(() => {
      console.log('\nExamples finished. Exiting...');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export default runExamples;
