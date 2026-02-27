import { Request, Response, NextFunction } from 'express';
import { UniversityEmailService } from '../services/UniversityEmailService';

const universityEmailService = new UniversityEmailService();

/**
 * Middleware to validate university email domain
 */
export const validateUniversityEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const email = req.body.email || req.query['email'];

    if (!email) {
      res.status(400).json({
        success: false,
        error: {
          code: 'EMAIL_REQUIRED',
          message: 'Email address is required',
          field: 'email',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
      return;
    }

    // Validate email format first
    if (!universityEmailService.isValidEmailFormat(email)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_EMAIL_FORMAT',
          message: 'Invalid email format',
          field: 'email',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
      return;
    }

    // Validate university domain
    const validationResult = await universityEmailService.validateEmailDomain(email);

    if (!validationResult.isValid) {
      res.status(403).json({
        success: false,
        error: {
          code: 'INVALID_UNIVERSITY_EMAIL',
          message: validationResult.message,
          details: {
            domain: validationResult.domain,
            universityName: validationResult.universityName,
            country: validationResult.country
          },
          field: 'email',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
      return;
    }

    // Attach validation result to request for use in route handlers
    req.emailValidation = validationResult;
    next();
  } catch (error) {
    console.error('Email validation middleware error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'EMAIL_VALIDATION_ERROR',
        message: 'Failed to validate email domain',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      }
    });
  }
};

export const requireVerifiedUniversityEmail = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const user = (req as any).user;
  
  if (!user) {
    res.status(401).json({
      success: false,
      error: {
        code: 'NOT_AUTHENTICATED',
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
        requestId: req.get('x-request-id') || 'unknown'
      }
    });
    return;
  }

  if (!user.isVerified) {
    res.status(403).json({
      success: false,
      error: {
        code: 'UNIVERSITY_EMAIL_NOT_VERIFIED',
        message: 'University email verification required',
        details: 'Please verify your university email address to access this feature',
        timestamp: new Date().toISOString(),
        requestId: req.get('x-request-id') || 'unknown'
      }
    });
    return;
  }

  next();
};

// Extend Express Request interface to include email validation result
declare global {
  namespace Express {
    interface Request {
      emailValidation?: {
        isValid: boolean;
        domain: string;
        universityName?: string;
        country?: string;
        message: string;
      };
    }
  }
}