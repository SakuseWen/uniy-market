import { LocationService } from '../../src/services/LocationService';

describe('LocationService', () => {
  let locationService: LocationService;

  beforeEach(() => {
    locationService = new LocationService();
  });

  describe('validateGeneralLocation', () => {
    it('should accept valid general area descriptions', () => {
      const validLocations = [
        'Near Mahidol University',
        'Silom Area',
        'Close to BTS Siam Station',
        'University District',
        'Downtown Bangkok'
      ];

      validLocations.forEach(location => {
        const result = locationService.validateGeneralLocation(location);
        expect(result.valid).toBe(true);
      });
    });

    it('should reject empty locations', () => {
      const result = locationService.validateGeneralLocation('');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('empty');
    });

    it('should reject locations with GPS coordinates', () => {
      const invalidLocations = [
        '13.7563, 100.5018',
        '13.7563,100.5018',
        '@13.7563,100.5018',
        'latitude: 13.7563'
      ];

      invalidLocations.forEach(location => {
        const result = locationService.validateGeneralLocation(location);
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('coordinates');
      });
    });

    it('should reject locations with specific addresses', () => {
      const invalidLocations = [
        '123/45 Rama Road',
        'Room 301, Building A',
        'Apt 5B, 789 Street',
        'Unit 12, Tower C'
      ];

      invalidLocations.forEach(location => {
        const result = locationService.validateGeneralLocation(location);
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('specific');
      });
    });

    it('should reject very long location descriptions', () => {
      const longLocation = 'A'.repeat(201);
      const result = locationService.validateGeneralLocation(longLocation);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('long');
    });
  });

  describe('sanitizeLocation', () => {
    it('should remove GPS coordinates', () => {
      const location = 'Near campus at 13.7563, 100.5018';
      const sanitized = locationService.sanitizeLocation(location);
      expect(sanitized).not.toContain('13.7563');
      expect(sanitized).toContain('[coordinates removed]');
    });

    it('should remove specific address numbers', () => {
      const location = 'Building at 123/45 Rama Road';
      const sanitized = locationService.sanitizeLocation(location);
      expect(sanitized).not.toContain('123/45');
      expect(sanitized).toContain('[address removed]');
    });

    it('should remove room numbers', () => {
      const location = 'Meet at Room 301';
      const sanitized = locationService.sanitizeLocation(location);
      expect(sanitized).not.toContain('301');
      expect(sanitized).toContain('[removed]');
    });

    it('should preserve general area names', () => {
      const location = 'Near Mahidol University';
      const sanitized = locationService.sanitizeLocation(location);
      expect(sanitized).toBe('Near Mahidol University');
    });
  });

  describe('generateLocationShareMessage', () => {
    it('should generate message with location', () => {
      const message = locationService.generateLocationShareMessage('Near Campus');
      expect(message).toContain('📍');
      expect(message).toContain('Near Campus');
      expect(message).toContain('safety');
    });

    it('should include additional info when provided', () => {
      const message = locationService.generateLocationShareMessage(
        'Near Campus',
        'Behind the library'
      );
      expect(message).toContain('Near Campus');
      expect(message).toContain('Behind the library');
    });

    it('should include safety warning', () => {
      const message = locationService.generateLocationShareMessage('Downtown');
      expect(message).toContain('public places');
      expect(message).toContain('safety');
    });
  });

  describe('validateProductLocation', () => {
    it('should validate and sanitize product location', () => {
      const result = locationService.validateProductLocation('Near University');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('Near University');
    });

    it('should reject invalid product location', () => {
      const result = locationService.validateProductLocation('13.7563, 100.5018');
      expect(result.valid).toBe(false);
      expect(result.reason).toBeDefined();
    });

    it('should reject product location with coordinates', () => {
      const result = locationService.validateProductLocation('Near campus at 13.7563, 100.5018');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('coordinates');
    });
  });

  describe('getLocationPrivacyGuidelines', () => {
    it('should return dos and donts', () => {
      const guidelines = locationService.getLocationPrivacyGuidelines();
      expect(guidelines.dos).toBeDefined();
      expect(guidelines.donts).toBeDefined();
      expect(guidelines.dos.length).toBeGreaterThan(0);
      expect(guidelines.donts.length).toBeGreaterThan(0);
    });

    it('should return good and bad examples', () => {
      const guidelines = locationService.getLocationPrivacyGuidelines();
      expect(guidelines.examples.good).toBeDefined();
      expect(guidelines.examples.bad).toBeDefined();
      expect(guidelines.examples.good.length).toBeGreaterThan(0);
      expect(guidelines.examples.bad.length).toBeGreaterThan(0);
    });
  });

  describe('canShareLocation', () => {
    it('should allow location sharing in active chats', () => {
      const result = locationService.canShareLocation('active', 'buyer');
      expect(result.allowed).toBe(true);
    });

    it('should not allow location sharing in inactive chats', () => {
      const result = locationService.canShareLocation('inactive', 'buyer');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('active');
    });

    it('should allow both buyers and sellers to share location', () => {
      const buyerResult = locationService.canShareLocation('active', 'buyer');
      const sellerResult = locationService.canShareLocation('active', 'seller');
      expect(buyerResult.allowed).toBe(true);
      expect(sellerResult.allowed).toBe(true);
    });
  });

  describe('formatLocationForDisplay', () => {
    it('should add location emoji', () => {
      const formatted = locationService.formatLocationForDisplay('Near Campus');
      expect(formatted).toContain('📍');
      expect(formatted).toContain('Near Campus');
    });

    it('should sanitize location before display', () => {
      const formatted = locationService.formatLocationForDisplay('Near 13.7563, 100.5018');
      expect(formatted).not.toContain('13.7563');
      expect(formatted).toContain('[coordinates removed]');
    });
  });

  describe('validateLocationUpdate', () => {
    it('should allow valid location updates', () => {
      const result = locationService.validateLocationUpdate(
        'Near Campus',
        'University District'
      );
      expect(result.valid).toBe(true);
    });

    it('should reject invalid new locations', () => {
      const result = locationService.validateLocationUpdate(
        'Near Campus',
        '13.7563, 100.5018'
      );
      expect(result.valid).toBe(false);
    });

    it('should reject updates that make location more specific', () => {
      const result = locationService.validateLocationUpdate(
        'Near Campus',
        'Near Campus, Building A, Room 301, Floor 3, Behind the library'
      );
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('specific');
    });

    it('should allow updates from null', () => {
      const result = locationService.validateLocationUpdate(
        null,
        'Near Campus'
      );
      expect(result.valid).toBe(true);
    });
  });

  describe('getLocationPrivacyScore', () => {
    it('should give high score to good locations', () => {
      const goodLocations = [
        'Near Mahidol University',
        'Silom Area',
        'University District'
      ];

      goodLocations.forEach(location => {
        const result = locationService.getLocationPrivacyScore(location);
        expect(result.score).toBeGreaterThanOrEqual(70);
        expect(result.issues.length).toBeLessThanOrEqual(1);
      });
    });

    it('should give low score to locations with coordinates', () => {
      const result = locationService.getLocationPrivacyScore('13.7563, 100.5018');
      expect(result.score).toBeLessThan(60);
      expect(result.issues).toContain('Contains GPS coordinates');
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should give low score to specific addresses', () => {
      const result = locationService.getLocationPrivacyScore('123/45 Rama Road');
      expect(result.score).toBeLessThan(80);
      expect(result.issues).toContain('Contains specific address number');
    });

    it('should penalize very long descriptions', () => {
      const longLocation = 'Near campus with a very long description that goes on and on and provides too much detail about the exact location';
      const result = locationService.getLocationPrivacyScore(longLocation);
      expect(result.score).toBeLessThan(100);
      expect(result.issues).toContain('Location description is long');
    });

    it('should penalize very short descriptions', () => {
      const result = locationService.getLocationPrivacyScore('Campus');
      expect(result.score).toBeLessThan(100);
      expect(result.issues).toContain('Location is very vague');
    });

    it('should provide suggestions for improvement', () => {
      const result = locationService.getLocationPrivacyScore('13.7563, 100.5018');
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions[0]).toContain('coordinates');
    });
  });

  describe('Edge Cases', () => {
    it('should handle whitespace-only locations', () => {
      const result = locationService.validateGeneralLocation('   ');
      expect(result.valid).toBe(false);
    });

    it('should handle locations with multiple coordinate patterns', () => {
      const location = '13.7563, 100.5018 and @13.7563,100.5018';
      const result = locationService.validateGeneralLocation(location);
      expect(result.valid).toBe(false);
    });

    it('should handle mixed valid and invalid content', () => {
      const location = 'Near Campus at 123/45';
      const sanitized = locationService.sanitizeLocation(location);
      expect(sanitized).toContain('Near Campus');
      expect(sanitized).not.toContain('123/45');
    });

    it('should handle unicode characters in location', () => {
      const location = 'ใกล้มหาวิทยาลัย';
      const result = locationService.validateGeneralLocation(location);
      expect(result.valid).toBe(true);
    });

    it('should handle special characters', () => {
      const location = 'Near Campus & Mall';
      const result = locationService.validateGeneralLocation(location);
      expect(result.valid).toBe(true);
    });
  });
});
