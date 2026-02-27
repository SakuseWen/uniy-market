import fc from 'fast-check';
import { 
  isValidEmail, 
  isValidPrice, 
  isValidLanguage, 
  sanitizeString 
} from '../../src/utils/validation';

describe('Validation Utils', () => {
  describe('isValidEmail', () => {
    it('should validate correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'student@mahidol.ac.th',
        'test123@gmail.com'
      ];

      validEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user@domain',
        'user name@domain.com',
        ''
      ];

      invalidEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(false);
      });
    });

    // Property-based test for email validation
    it('should handle arbitrary email-like strings', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 10 }),
          (localPart, domain, tld) => {
            const email = `${localPart}@${domain}.${tld}`;
            const result = isValidEmail(email);
            expect(typeof result).toBe('boolean');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('isValidPrice', () => {
    it('should validate correct price ranges', () => {
      const validPrices = [0.01, 1, 100, 999.99, 999999.99];
      
      validPrices.forEach(price => {
        expect(isValidPrice(price)).toBe(true);
      });
    });

    it('should reject invalid prices', () => {
      const invalidPrices = [0, -1, -100, 1000000, Infinity, NaN];
      
      invalidPrices.forEach(price => {
        expect(isValidPrice(price)).toBe(false);
      });
    });

    // Property-based test for price validation
    it('should validate price ranges correctly', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0.01), max: Math.fround(999999.99), noNaN: true }),
          (price) => {
            // Round to 2 decimal places to avoid floating point precision issues
            const roundedPrice = Math.round(price * 100) / 100;
            if (roundedPrice >= 0.01 && roundedPrice <= 999999.99) {
              expect(isValidPrice(roundedPrice)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );

      fc.assert(
        fc.property(
          fc.oneof(
            fc.float({ max: Math.fround(0), noNaN: true }),
            fc.float({ min: Math.fround(1000000), noNaN: true })
          ),
          (price) => {
            expect(isValidPrice(price)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('isValidLanguage', () => {
    it('should validate supported languages', () => {
      const validLanguages = ['en', 'th', 'zh'];
      
      validLanguages.forEach(lang => {
        expect(isValidLanguage(lang)).toBe(true);
      });
    });

    it('should reject unsupported languages', () => {
      const invalidLanguages = ['fr', 'de', 'es', 'ja', '', 'english'];
      
      invalidLanguages.forEach(lang => {
        expect(isValidLanguage(lang)).toBe(false);
      });
    });
  });

  describe('sanitizeString', () => {
    it('should remove dangerous characters', () => {
      expect(sanitizeString('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
      expect(sanitizeString('Hello <world>')).toBe('Hello world');
      expect(sanitizeString('Normal text')).toBe('Normal text');
    });

    it('should trim whitespace', () => {
      expect(sanitizeString('  hello world  ')).toBe('hello world');
      expect(sanitizeString('\n\ttest\n\t')).toBe('test');
    });

    // Property-based test for string sanitization
    it('should always return a string without < or >', () => {
      fc.assert(
        fc.property(
          fc.string(),
          (input) => {
            const result = sanitizeString(input);
            expect(typeof result).toBe('string');
            expect(result).not.toContain('<');
            expect(result).not.toContain('>');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});