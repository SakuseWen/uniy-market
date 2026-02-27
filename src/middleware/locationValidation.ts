import { Request, Response, NextFunction } from 'express';
import { locationService } from '../services/LocationService';
import { ApiResponse } from '../types';

/**
 * Middleware to validate location privacy
 * Ensures no precise coordinates or specific addresses are stored
 */
export const validateLocationPrivacy = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const location = req.body.location;

  // If no location provided, skip validation
  if (!location) {
    return next();
  }

  // Validate location
  const validation = locationService.validateGeneralLocation(location);

  if (!validation.valid) {
    res.status(400).json({
      success: false,
      error: {
        message: validation.reason || 'Invalid location format',
        field: 'location',
        guidelines: locationService.getLocationPrivacyGuidelines()
      },
      timestamp: new Date().toISOString()
    } as ApiResponse);
    return;
  }

  // Sanitize location
  req.body.location = locationService.sanitizeLocation(location);

  next();
};

/**
 * Middleware to validate location update
 */
export const validateLocationUpdate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const newLocation = req.body.location;
  const oldLocation = (req as any).oldLocation; // Should be set by route handler

  if (!newLocation) {
    return next();
  }

  const validation = locationService.validateLocationUpdate(oldLocation, newLocation);

  if (!validation.valid) {
    res.status(400).json({
      success: false,
      error: {
        message: validation.reason || 'Invalid location update',
        field: 'location'
      },
      timestamp: new Date().toISOString()
    } as ApiResponse);
    return;
  }

  // Sanitize location
  req.body.location = locationService.sanitizeLocation(newLocation);

  next();
};

/**
 * Middleware to add location privacy score to response
 */
export const addLocationPrivacyScore = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const location = req.body.location;

  if (location) {
    const privacyScore = locationService.getLocationPrivacyScore(location);
    (req as any).locationPrivacyScore = privacyScore;
  }

  next();
};
