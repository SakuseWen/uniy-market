/**
 * ContentModerationService handles content filtering and moderation
 * Implements Requirements 10.1, 10.2
 */

interface SensitiveWord {
  word: string;
  language: 'en' | 'th' | 'zh' | 'all';
  severity: 'low' | 'medium' | 'high';
  category: 'profanity' | 'hate' | 'violence' | 'spam' | 'fraud' | 'sexual' | 'other';
}

interface ModerationResult {
  isClean: boolean;
  flagged: boolean;
  severity: 'none' | 'low' | 'medium' | 'high';
  matches: Array<{
    word: string;
    category: string;
    severity: string;
    position: number;
  }>;
  sanitizedText?: string;
  shouldBlock: boolean;
  reason?: string;
}

export class ContentModerationService {
  private sensitiveWords: Map<string, SensitiveWord>;

  constructor() {
    this.sensitiveWords = new Map();
    this.initializeSensitiveWords();
  }

  /**
   * Initialize sensitive words database
   * In production, this would be loaded from a database
   */
  private initializeSensitiveWords(): void {
    const words: SensitiveWord[] = [
      // English profanity
      { word: 'fuck', language: 'en', severity: 'high', category: 'profanity' },
      { word: 'shit', language: 'en', severity: 'medium', category: 'profanity' },
      { word: 'damn', language: 'en', severity: 'low', category: 'profanity' },
      { word: 'ass', language: 'en', severity: 'medium', category: 'profanity' },
      { word: 'bitch', language: 'en', severity: 'high', category: 'profanity' },
      
      // Hate speech
      { word: 'racist', language: 'all', severity: 'high', category: 'hate' },
      { word: 'nazi', language: 'all', severity: 'high', category: 'hate' },
      { word: 'terrorist', language: 'all', severity: 'high', category: 'hate' },
      
      // Violence
      { word: 'kill', language: 'all', severity: 'high', category: 'violence' },
      { word: 'murder', language: 'all', severity: 'high', category: 'violence' },
      { word: 'weapon', language: 'all', severity: 'medium', category: 'violence' },
      { word: 'gun', language: 'all', severity: 'medium', category: 'violence' },
      { word: 'knife', language: 'all', severity: 'medium', category: 'violence' },
      
      // Fraud/Spam
      { word: 'scam', language: 'all', severity: 'high', category: 'fraud' },
      { word: 'fake', language: 'all', severity: 'medium', category: 'fraud' },
      { word: 'counterfeit', language: 'all', severity: 'high', category: 'fraud' },
      { word: 'stolen', language: 'all', severity: 'high', category: 'fraud' },
      { word: 'click here', language: 'en', severity: 'medium', category: 'spam' },
      { word: 'buy now', language: 'en', severity: 'low', category: 'spam' },
      { word: 'limited time', language: 'en', severity: 'low', category: 'spam' },
      
      // Sexual content
      { word: 'porn', language: 'all', severity: 'high', category: 'sexual' },
      { word: 'sex', language: 'all', severity: 'medium', category: 'sexual' },
      { word: 'nude', language: 'all', severity: 'high', category: 'sexual' },
      
      // Thai sensitive words (examples)
      { word: 'ไอ้', language: 'th', severity: 'medium', category: 'profanity' },
      { word: 'เหี้ย', language: 'th', severity: 'high', category: 'profanity' },
      { word: 'สัส', language: 'th', severity: 'high', category: 'profanity' },
      
      // Chinese sensitive words (examples)
      { word: '操', language: 'zh', severity: 'high', category: 'profanity' },
      { word: '妈的', language: 'zh', severity: 'high', category: 'profanity' },
      { word: '傻逼', language: 'zh', severity: 'high', category: 'profanity' }
    ];

    words.forEach(word => {
      this.sensitiveWords.set(word.word.toLowerCase(), word);
    });
  }

  /**
   * Moderate content text
   */
  moderateContent(text: string, language?: 'en' | 'th' | 'zh'): ModerationResult {
    if (!text || text.trim().length === 0) {
      return {
        isClean: true,
        flagged: false,
        severity: 'none',
        matches: [],
        shouldBlock: false
      };
    }

    const lowerText = text.toLowerCase();
    const matches: ModerationResult['matches'] = [];
    let highestSeverity: 'none' | 'low' | 'medium' | 'high' = 'none';

    // Check for sensitive words
    this.sensitiveWords.forEach((wordData, word) => {
      // Skip if language doesn't match (unless word is for all languages)
      if (language && wordData.language !== 'all' && wordData.language !== language) {
        return;
      }

      // For English short words (3 chars or less), use word boundary to avoid false positives
      // For longer words and non-English, match as substring to catch variations
      const isEnglish = /^[a-zA-Z]+$/.test(word);
      const useWordBoundary = isEnglish && word.length <= 3;
      const pattern = useWordBoundary 
        ? `\\b${this.escapeRegex(word)}\\b`
        : this.escapeRegex(word);
      const regex = new RegExp(pattern, 'gi');
      let match;
      
      while ((match = regex.exec(lowerText)) !== null) {
        matches.push({
          word: word,
          category: wordData.category,
          severity: wordData.severity,
          position: match.index
        });

        // Update highest severity
        if (this.compareSeverity(wordData.severity, highestSeverity) > 0) {
          highestSeverity = wordData.severity;
        }
      }
    });

    // Determine if content should be blocked
    // Block if: 
    // - high severity
    // - medium severity profanity/hate/violence (even single occurrence)
    // - multiple medium severity matches
    // - 3+ matches of any severity
    const hasMediumProfanity = matches.some(m => 
      m.severity === 'medium' && 
      (m.category === 'profanity' || m.category === 'hate' || m.category === 'violence')
    );
    const shouldBlock = (highestSeverity as string) === 'high' || 
                       hasMediumProfanity ||
                       ((highestSeverity as string) === 'medium' && matches.length >= 2) ||
                       matches.length >= 3;

    // Generate sanitized text if needed
    let sanitizedText: string | undefined = undefined;
    if (matches.length > 0) {
      sanitizedText = this.sanitizeText(text, matches);
    }

    const result: ModerationResult = {
      isClean: matches.length === 0,
      flagged: matches.length > 0,
      severity: highestSeverity,
      matches,
      shouldBlock
    };

    if (sanitizedText !== undefined) {
      result.sanitizedText = sanitizedText;
    }

    if (shouldBlock) {
      result.reason = this.generateBlockReason(matches);
    }

    return result;
  }

  /**
   * Sanitize text by replacing sensitive words
   */
  private sanitizeText(text: string, matches: ModerationResult['matches']): string {
    let sanitized = text;
    
    // Sort matches by position (descending) to avoid index shifting
    const sortedMatches = [...matches].sort((a, b) => b.position - a.position);
    
    sortedMatches.forEach(match => {
      const word = match.word;
      const replacement = '*'.repeat(word.length);
      const regex = new RegExp(this.escapeRegex(word), 'gi');
      sanitized = sanitized.replace(regex, replacement);
    });

    return sanitized;
  }

  /**
   * Generate block reason based on matches
   */
  private generateBlockReason(matches: ModerationResult['matches']): string {
    const categories = new Set(matches.map(m => m.category));
    const categoryList = Array.from(categories).join(', ');
    
    return `Content contains inappropriate material (${categoryList}). Please review our community guidelines.`;
  }

  /**
   * Compare severity levels
   */
  private compareSeverity(
    a: 'none' | 'low' | 'medium' | 'high',
    b: 'none' | 'low' | 'medium' | 'high'
  ): number {
    const levels = { none: 0, low: 1, medium: 2, high: 3 };
    return levels[a] - levels[b];
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Check if content is spam
   */
  isSpam(text: string): { isSpam: boolean; reason?: string } {
    // Check for excessive length first
    if (text.length > 5000) {
      return {
        isSpam: true,
        reason: 'Content exceeds maximum length'
      };
    }

    const spamPatterns = [
      // Excessive capitalization
      /[A-Z]{10,}/,
      // Excessive punctuation
      /[!?]{5,}/,
      // Excessive emojis
      /([\u{1F600}-\u{1F64F}]){10,}/u,
      // Repeated characters
      /(.)\1{10,}/,
      // Multiple URLs
      /(https?:\/\/[^\s]+.*){3,}/gi,
      // Phone numbers pattern (multiple)
      /(\d{3}[-.\s]?\d{3}[-.\s]?\d{4}.*){2,}/g
    ];

    for (const pattern of spamPatterns) {
      if (pattern.test(text)) {
        return {
          isSpam: true,
          reason: 'Content appears to be spam (excessive formatting or repetition)'
        };
      }
    }

    return { isSpam: false };
  }

  /**
   * Moderate product listing
   */
  moderateProductListing(title: string, description: string, language?: 'en' | 'th' | 'zh'): {
    approved: boolean;
    titleResult: ModerationResult;
    descriptionResult: ModerationResult;
    spamCheck: { isSpam: boolean; reason?: string };
    reason?: string;
  } {
    const titleResult = this.moderateContent(title, language);
    const descriptionResult = this.moderateContent(description, language);
    const spamCheck = this.isSpam(title + ' ' + description);

    const approved = 
      !titleResult.shouldBlock && 
      !descriptionResult.shouldBlock && 
      !spamCheck.isSpam;

    const result: {
      approved: boolean;
      titleResult: ModerationResult;
      descriptionResult: ModerationResult;
      spamCheck: { isSpam: boolean; reason?: string };
      reason?: string;
    } = {
      approved,
      titleResult,
      descriptionResult,
      spamCheck
    };

    if (!approved) {
      if (titleResult.shouldBlock && titleResult.reason) {
        result.reason = `Title: ${titleResult.reason}`;
      } else if (descriptionResult.shouldBlock && descriptionResult.reason) {
        result.reason = `Description: ${descriptionResult.reason}`;
      } else if (spamCheck.isSpam && spamCheck.reason) {
        result.reason = spamCheck.reason;
      }
    }

    return result;
  }

  /**
   * Moderate chat message
   */
  moderateChatMessage(message: string, language?: 'en' | 'th' | 'zh'): {
    approved: boolean;
    result: ModerationResult;
    sanitizedMessage?: string;
  } {
    const result = this.moderateContent(message, language);
    
    const response: {
      approved: boolean;
      result: ModerationResult;
      sanitizedMessage?: string;
    } = {
      approved: !result.shouldBlock,
      result
    };

    if (result.sanitizedText) {
      response.sanitizedMessage = result.sanitizedText;
    }

    return response;
  }

  /**
   * Moderate review comment
   */
  moderateReview(comment: string, language?: 'en' | 'th' | 'zh'): {
    approved: boolean;
    result: ModerationResult;
  } {
    const result = this.moderateContent(comment, language);
    
    return {
      approved: !result.shouldBlock,
      result
    };
  }

  /**
   * Get moderation statistics
   */
  getModerationStats(results: ModerationResult[]): {
    total: number;
    clean: number;
    flagged: number;
    blocked: number;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
  } {
    const stats = {
      total: results.length,
      clean: 0,
      flagged: 0,
      blocked: 0,
      byCategory: {} as Record<string, number>,
      bySeverity: { none: 0, low: 0, medium: 0, high: 0 }
    };

    results.forEach(result => {
      if (result.isClean) stats.clean++;
      if (result.flagged) stats.flagged++;
      if (result.shouldBlock) stats.blocked++;

      stats.bySeverity[result.severity]++;

      result.matches.forEach(match => {
        stats.byCategory[match.category] = (stats.byCategory[match.category] || 0) + 1;
      });
    });

    return stats;
  }

  /**
   * Add sensitive word (for admin use)
   */
  addSensitiveWord(word: SensitiveWord): void {
    this.sensitiveWords.set(word.word.toLowerCase(), word);
  }

  /**
   * Remove sensitive word (for admin use)
   */
  removeSensitiveWord(word: string): boolean {
    return this.sensitiveWords.delete(word.toLowerCase());
  }

  /**
   * Get all sensitive words (for admin use)
   */
  getSensitiveWords(): SensitiveWord[] {
    return Array.from(this.sensitiveWords.values());
  }

  /**
   * Get sensitive words by category
   */
  getSensitiveWordsByCategory(category: string): SensitiveWord[] {
    return Array.from(this.sensitiveWords.values())
      .filter(word => word.category === category);
  }

  /**
   * Get sensitive words by language
   */
  getSensitiveWordsByLanguage(language: 'en' | 'th' | 'zh' | 'all'): SensitiveWord[] {
    return Array.from(this.sensitiveWords.values())
      .filter(word => word.language === language || word.language === 'all');
  }
}

// Export singleton instance
export const contentModerationService = new ContentModerationService();
