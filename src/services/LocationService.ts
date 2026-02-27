/**
 * LocationService handles location privacy and validation
 * Implements Requirements 6.1, 6.2, 6.3, 6.4, 6.5
 */
export class LocationService {
  /**
   * Validate that location is a general area description, not precise coordinates
   */
  validateGeneralLocation(location: string): { valid: boolean; reason?: string } {
    if (!location || location.trim().length === 0) {
      return { valid: false, reason: 'Location cannot be empty' };
    }

    // Check if location contains coordinate patterns (latitude/longitude)
    const coordinatePatterns = [
      /\d+\.\d+\s*,\s*\d+\.\d+/, // Decimal coordinates: 13.7563, 100.5018
      /\d+°\d+'[\d."]*/,          // DMS format: 13°45'23"
      /@\d+\.\d+,\d+\.\d+/,       // Google Maps format: @13.7563,100.5018
      /lat[itude]*\s*[:=]\s*\d+/, // Explicit latitude
      /lon[gitude]*\s*[:=]\s*\d+/ // Explicit longitude
    ];

    for (const pattern of coordinatePatterns) {
      if (pattern.test(location)) {
        return {
          valid: false,
          reason: 'Location must be a general area description, not precise coordinates'
        };
      }
    }

    // Check if location is too specific (contains house/building numbers)
    const tooSpecificPatterns = [
      /\b\d+\/\d+\b/,           // Thai address format: 123/45
      /\broom\s+\d+\b/i,        // Room numbers
      /\bapt\.?\s+\d+\b/i,      // Apartment numbers
      /\bunit\s+\d+\b/i,        // Unit numbers
      /\bfloor\s+\d+\b/i,       // Floor numbers
      /\b#\d+\b/,               // Number signs
      /\b\d+[A-Z]\b/i           // Unit format like 5B
    ];

    for (const pattern of tooSpecificPatterns) {
      if (pattern.test(location)) {
        return {
          valid: false,
          reason: 'Location is too specific. Please use general area only (e.g., "Near Campus", "Downtown Area")'
        };
      }
    }

    // Location should be reasonably short (general areas don't need long descriptions)
    if (location.length > 200) {
      return {
        valid: false,
        reason: 'Location description is too long. Please use a brief general area description'
      };
    }

    return { valid: true };
  }

  /**
   * Sanitize location to remove any potentially identifying information
   */
  sanitizeLocation(location: string): string {
    let sanitized = location.trim();

    // Remove any coordinate-like patterns
    sanitized = sanitized.replace(/\d+\.\d+\s*,\s*\d+\.\d+/g, '[coordinates removed]');
    sanitized = sanitized.replace(/@\d+\.\d+,\d+\.\d+/g, '[coordinates removed]');

    // Remove specific address numbers
    sanitized = sanitized.replace(/\b\d+\/\d+\b/g, '[address removed]');
    sanitized = sanitized.replace(/\broom\s+\d+\b/gi, 'room [removed]');
    sanitized = sanitized.replace(/\bapt\.?\s+\d+\b/gi, 'apt [removed]');

    return sanitized;
  }

  /**
   * Generate location sharing message for chat
   */
  generateLocationShareMessage(generalArea: string, additionalInfo?: string): string {
    let message = `📍 Location: ${generalArea}`;
    
    if (additionalInfo) {
      message += `\n\nAdditional info: ${additionalInfo}`;
    }

    message += '\n\n⚠️ For your safety, please meet in public places and inform someone about your meetup.';

    return message;
  }

  /**
   * Validate location for product listing
   */
  validateProductLocation(location: string): { valid: boolean; sanitized?: string; reason?: string } {
    // First validate the original location
    const validation = this.validateGeneralLocation(location);
    
    if (!validation.valid) {
      return validation;
    }
    
    // Then sanitize it
    const sanitized = this.sanitizeLocation(location);

    return {
      valid: true,
      sanitized
    };
  }

  /**
   * Get location privacy guidelines
   */
  getLocationPrivacyGuidelines(): {
    dos: string[];
    donts: string[];
    examples: { good: string[]; bad: string[] };
  } {
    return {
      dos: [
        'Use general area names (e.g., "Near University Campus")',
        'Mention nearby landmarks (e.g., "Close to Central Mall")',
        'Use district or neighborhood names (e.g., "Downtown Area")',
        'Keep descriptions brief and general'
      ],
      donts: [
        'Share exact addresses or building numbers',
        'Include GPS coordinates or map links',
        'Mention specific room, apartment, or unit numbers',
        'Share personal contact information in location field'
      ],
      examples: {
        good: [
          'Near Mahidol University',
          'Silom Area',
          'Close to BTS Siam Station',
          'University District',
          'Downtown Bangkok'
        ],
        bad: [
          '123/45 Rama Road',
          'Room 301, Building A',
          '13.7563, 100.5018',
          'Apt 5B, 789 Street',
          '@13.7563,100.5018'
        ]
      }
    };
  }

  /**
   * Check if location sharing is appropriate for chat context
   */
  canShareLocation(chatStatus: string, _userRole: 'buyer' | 'seller'): {
    allowed: boolean;
    reason?: string;
  } {
    // Only allow location sharing in active chats
    if (chatStatus !== 'active') {
      return {
        allowed: false,
        reason: 'Location can only be shared in active chats'
      };
    }

    // Both buyers and sellers can share location
    return { allowed: true };
  }

  /**
   * Format location for display (ensure privacy)
   */
  formatLocationForDisplay(location: string): string {
    // Ensure no sensitive information is displayed
    const sanitized = this.sanitizeLocation(location);
    
    // Add privacy indicator
    return `📍 ${sanitized}`;
  }

  /**
   * Validate location update
   */
  validateLocationUpdate(
    oldLocation: string | null,
    newLocation: string
  ): { valid: boolean; reason?: string } {
    // Validate new location
    const validation = this.validateGeneralLocation(newLocation);
    
    if (!validation.valid) {
      return validation;
    }

    // Check if location is being made more specific (privacy concern)
    // Only check if old location exists and new location is significantly longer
    if (oldLocation && newLocation.length > oldLocation.length * 2) {
      return {
        valid: false,
        reason: 'New location appears more specific than previous. Please keep it general.'
      };
    }

    return { valid: true };
  }

  /**
   * Get location privacy score (0-100, higher is better)
   */
  getLocationPrivacyScore(location: string): {
    score: number;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // Check for coordinates
    if (/\d+\.\d+\s*,\s*\d+\.\d+/.test(location)) {
      score -= 50;
      issues.push('Contains GPS coordinates');
      suggestions.push('Remove coordinates and use general area name');
    }

    // Check for specific addresses
    if (/\b\d+\/\d+\b/.test(location)) {
      score -= 30;
      issues.push('Contains specific address number');
      suggestions.push('Remove address number, use area name only');
    }

    // Check for room/unit numbers
    if (/\b(room|apt|unit|floor)\s+\d+\b/i.test(location)) {
      score -= 20;
      issues.push('Contains room/unit number');
      suggestions.push('Remove room/unit details');
    }

    // Check length
    if (location.length > 100) {
      score -= 10;
      issues.push('Location description is long');
      suggestions.push('Keep it brief and general');
    }

    // Check if it's too vague
    if (location.length < 10) {
      score -= 15;
      issues.push('Location is very vague');
      suggestions.push('Add nearby landmark or area name');
    }

    return {
      score: Math.max(0, score),
      issues,
      suggestions
    };
  }
}

// Export singleton instance
export const locationService = new LocationService();
