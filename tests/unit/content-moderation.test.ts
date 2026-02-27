import { ContentModerationService } from '../../src/services/ContentModerationService';

describe('ContentModerationService', () => {
  let service: ContentModerationService;

  beforeEach(() => {
    service = new ContentModerationService();
  });

  describe('moderateContent', () => {
    it('should pass clean content', () => {
      const result = service.moderateContent('This is a nice product for sale');
      expect(result.isClean).toBe(true);
      expect(result.flagged).toBe(false);
      expect(result.shouldBlock).toBe(false);
      expect(result.matches).toHaveLength(0);
    });

    it('should flag profanity', () => {
      const result = service.moderateContent('This is fucking awesome');
      expect(result.isClean).toBe(false);
      expect(result.flagged).toBe(true);
      expect(result.matches.length).toBeGreaterThan(0);
      expect(result.matches[0]?.category).toBe('profanity');
    });

    it('should block high severity content', () => {
      const result = service.moderateContent('fuck this shit');
      expect(result.shouldBlock).toBe(true);
      expect(result.severity).toBe('high');
      expect(result.reason).toBeDefined();
    });

    it('should detect hate speech', () => {
      const result = service.moderateContent('racist comments here');
      expect(result.flagged).toBe(true);
      expect(result.matches[0]?.category).toBe('hate');
      expect(result.severity).toBe('high');
    });

    it('should detect violence keywords', () => {
      const result = service.moderateContent('I will kill you');
      expect(result.flagged).toBe(true);
      expect(result.matches[0]?.category).toBe('violence');
      expect(result.shouldBlock).toBe(true);
    });

    it('should detect fraud keywords', () => {
      const result = service.moderateContent('This is a scam product');
      expect(result.flagged).toBe(true);
      expect(result.matches[0]?.category).toBe('fraud');
    });

    it('should sanitize flagged content', () => {
      const result = service.moderateContent('This is fucking great');
      expect(result.sanitizedText).toBeDefined();
      expect(result.sanitizedText).toContain('***');
      expect(result.sanitizedText).not.toContain('fuck');
    });

    it('should handle empty content', () => {
      const result = service.moderateContent('');
      expect(result.isClean).toBe(true);
      expect(result.shouldBlock).toBe(false);
    });

    it('should be case insensitive', () => {
      const result1 = service.moderateContent('FUCK');
      const result2 = service.moderateContent('fuck');
      const result3 = service.moderateContent('FuCk');
      
      expect(result1.flagged).toBe(true);
      expect(result2.flagged).toBe(true);
      expect(result3.flagged).toBe(true);
    });

    it('should detect multiple violations', () => {
      const result = service.moderateContent('fuck this shit damn');
      expect(result.matches.length).toBeGreaterThanOrEqual(2);
      expect(result.shouldBlock).toBe(true);
    });

    it('should respect word boundaries', () => {
      const result = service.moderateContent('assassin'); // contains 'ass' but not as separate word
      expect(result.isClean).toBe(true);
    });
  });

  describe('isSpam', () => {
    it('should detect excessive capitalization', () => {
      const result = service.isSpam('BUYNOWBUYNOWBUYNOW');
      expect(result.isSpam).toBe(true);
      expect(result.reason).toContain('spam');
    });

    it('should detect excessive punctuation', () => {
      const result = service.isSpam('Buy now!!!!!!!!');
      expect(result.isSpam).toBe(true);
    });

    it('should detect repeated characters', () => {
      const result = service.isSpam('Hellooooooooooooooo');
      expect(result.isSpam).toBe(true);
    });

    it('should detect excessive length', () => {
      const longText = 'a'.repeat(5001);
      const result = service.isSpam(longText);
      expect(result.isSpam).toBe(true);
      expect(result.reason).toContain('length');
    });

    it('should pass normal content', () => {
      const result = service.isSpam('This is a normal product description');
      expect(result.isSpam).toBe(false);
    });
  });

  describe('moderateProductListing', () => {
    it('should approve clean product listing', () => {
      const result = service.moderateProductListing(
        'Used Textbook',
        'Great condition, barely used'
      );
      expect(result.approved).toBe(true);
      expect(result.titleResult.isClean).toBe(true);
      expect(result.descriptionResult.isClean).toBe(true);
    });

    it('should reject product with profanity in title', () => {
      const result = service.moderateProductListing(
        'Fucking awesome book',
        'Great condition'
      );
      expect(result.approved).toBe(false);
      expect(result.titleResult.shouldBlock).toBe(true);
      expect(result.reason).toContain('Title');
    });

    it('should reject product with profanity in description', () => {
      const result = service.moderateProductListing(
        'Used Book',
        'This shit is amazing'
      );
      expect(result.approved).toBe(false);
      expect(result.descriptionResult.flagged).toBe(true);
    });

    it('should reject spam product', () => {
      const result = service.moderateProductListing(
        'BUYNOWBUYNOWBUYNOW',
        'Click here!!!!!!'
      );
      expect(result.approved).toBe(false);
      expect(result.spamCheck.isSpam).toBe(true);
    });

    it('should detect fraud keywords', () => {
      const result = service.moderateProductListing(
        'Stolen iPhone',
        'Counterfeit designer bag'
      );
      expect(result.approved).toBe(false);
      expect(result.titleResult.flagged || result.descriptionResult.flagged).toBe(true);
    });
  });

  describe('moderateChatMessage', () => {
    it('should approve clean message', () => {
      const result = service.moderateChatMessage('Hello, is this still available?');
      expect(result.approved).toBe(true);
      expect(result.result.isClean).toBe(true);
    });

    it('should reject message with profanity', () => {
      const result = service.moderateChatMessage('fuck you');
      expect(result.approved).toBe(false);
      expect(result.result.shouldBlock).toBe(true);
    });

    it('should provide sanitized version', () => {
      const result = service.moderateChatMessage('This is fucking great');
      expect(result.sanitizedMessage).toBeDefined();
      expect(result.sanitizedMessage).toContain('***');
    });
  });

  describe('moderateReview', () => {
    it('should approve clean review', () => {
      const result = service.moderateReview('Great seller, fast delivery');
      expect(result.approved).toBe(true);
    });

    it('should reject review with profanity', () => {
      const result = service.moderateReview('This seller is a fucking scammer');
      expect(result.approved).toBe(false);
      expect(result.result.shouldBlock).toBe(true);
    });
  });

  describe('Language-specific moderation', () => {
    it('should detect Thai profanity', () => {
      const result = service.moderateContent('เหี้ย', 'th');
      expect(result.flagged).toBe(true);
      expect(result.severity).toBe('high');
    });

    it('should detect Chinese profanity', () => {
      const result = service.moderateContent('操', 'zh');
      expect(result.flagged).toBe(true);
      expect(result.severity).toBe('high');
    });

    it('should skip language-specific words for other languages', () => {
      const result = service.moderateContent('เหี้ย', 'en');
      // Should NOT flag because language doesn't match (th word with en language)
      expect(result.flagged).toBe(false);
    });
  });

  describe('getModerationStats', () => {
    it('should calculate statistics correctly', () => {
      const results = [
        service.moderateContent('Clean text'),
        service.moderateContent('fuck'),
        service.moderateContent('shit'),
        service.moderateContent('Another clean text')
      ];

      const stats = service.getModerationStats(results);
      expect(stats.total).toBe(4);
      expect(stats.clean).toBe(2);
      expect(stats.flagged).toBe(2);
      expect(stats.bySeverity['high']).toBeGreaterThan(0);
    });
  });

  describe('Admin functions', () => {
    it('should add sensitive word', () => {
      const initialCount = service.getSensitiveWords().length;
      service.addSensitiveWord({
        word: 'testword',
        language: 'en',
        severity: 'medium',
        category: 'profanity'
      });
      expect(service.getSensitiveWords().length).toBe(initialCount + 1);
    });

    it('should remove sensitive word', () => {
      service.addSensitiveWord({
        word: 'testword',
        language: 'en',
        severity: 'medium',
        category: 'profanity'
      });
      const removed = service.removeSensitiveWord('testword');
      expect(removed).toBe(true);
    });

    it('should get words by category', () => {
      const profanityWords = service.getSensitiveWordsByCategory('profanity');
      expect(profanityWords.length).toBeGreaterThan(0);
      expect(profanityWords.every(w => w.category === 'profanity')).toBe(true);
    });

    it('should get words by language', () => {
      const englishWords = service.getSensitiveWordsByLanguage('en');
      expect(englishWords.length).toBeGreaterThan(0);
      expect(englishWords.every(w => w.language === 'en' || w.language === 'all')).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle null/undefined gracefully', () => {
      const result = service.moderateContent(null as any);
      expect(result.isClean).toBe(true);
    });

    it('should handle very long text', () => {
      const longText = 'clean '.repeat(1000);
      const result = service.moderateContent(longText);
      expect(result).toBeDefined();
    });

    it('should handle special characters', () => {
      const result = service.moderateContent('Hello! @#$%^&*()');
      expect(result.isClean).toBe(true);
    });

    it('should handle unicode characters', () => {
      const result = service.moderateContent('สวัสดี 你好 Hello');
      expect(result.isClean).toBe(true);
    });

    it('should handle mixed content', () => {
      const result = service.moderateContent('This is a good product, not a scam');
      expect(result.flagged).toBe(true); // 'scam' is flagged
      expect(result.matches[0]?.word).toBe('scam');
    });
  });
});
