import express, { Request, Response } from 'express';
import { locationService } from '../services/LocationService';
import { authenticateToken } from '../middleware/auth';
import { ApiResponse } from '../types';

const router = express.Router();

/**
 * GET /api/location/guidelines
 * Get location privacy guidelines
 */
router.get('/guidelines', authenticateToken, async (_req: Request, res: Response) => {
  try {
    const guidelines = locationService.getLocationPrivacyGuidelines();

    const response: ApiResponse = {
      success: true,
      data: guidelines,
      timestamp: new Date().toISOString()
    };

    return res.json(response);
  } catch (error) {
    console.error('Error fetching location guidelines:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch location guidelines'
      },
      timestamp: new Date().toISOString()
    };
    return res.status(500).json(response);
  }
});

/**
 * POST /api/location/validate
 * Validate a location string for privacy compliance
 */
router.post('/validate', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { location } = req.body;

    if (!location) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'location is required'
        },
        timestamp: new Date().toISOString()
      };
      return res.status(400).json(response);
    }

    const validation = locationService.validateGeneralLocation(location);
    const privacyScore = locationService.getLocationPrivacyScore(location);

    const response: ApiResponse = {
      success: true,
      data: {
        valid: validation.valid,
        reason: validation.reason,
        privacyScore: privacyScore.score,
        issues: privacyScore.issues,
        suggestions: privacyScore.suggestions,
        sanitized: validation.valid ? locationService.sanitizeLocation(location) : undefined
      },
      timestamp: new Date().toISOString()
    };

    return res.json(response);
  } catch (error) {
    console.error('Error validating location:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to validate location'
      },
      timestamp: new Date().toISOString()
    };
    return res.status(500).json(response);
  }
});

/**
 * POST /api/location/privacy-score
 * Get privacy score for a location
 */
router.post('/privacy-score', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { location } = req.body;

    if (!location) {
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'location is required'
        },
        timestamp: new Date().toISOString()
      };
      return res.status(400).json(response);
    }

    const privacyScore = locationService.getLocationPrivacyScore(location);

    const response: ApiResponse = {
      success: true,
      data: privacyScore,
      timestamp: new Date().toISOString()
    };

    return res.json(response);
  } catch (error) {
    console.error('Error calculating privacy score:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to calculate privacy score'
      },
      timestamp: new Date().toISOString()
    };
    return res.status(500).json(response);
  }
});

export default router;
