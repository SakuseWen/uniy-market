import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';

let authService: AuthService | null = null;

function getAuthService(): AuthService {
  if (!authService) {
    authService = new AuthService();
  }
  return authService;
}

/**
 * Middleware to authenticate JWT tokens
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header or cookie
    let token = req.get('authorization')?.replace('Bearer ', '');
    
    if (!token && req.cookies?.['auth_token']) {
      token = req.cookies['auth_token'];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'Access token is required',
          timestamp: new Date().toISOString(),
          requestId: req.get('x-request-id') || 'unknown'
        }
      });
      return;
    }

    // Validate token and get user
    const user = await getAuthService().validateSession(token);

    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token',
          timestamp: new Date().toISOString(),
          requestId: req.get('x-request-id') || 'unknown'
        }
      });
      return;
    }

    // Attach user to request
    (req as any).user = user;
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication failed',
        timestamp: new Date().toISOString(),
        requestId: req.get('x-request-id') || 'unknown'
      }
    });
  }
};

/**
 * Middleware to require verified university email
 */
export const requireVerifiedUser = (
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
        code: 'EMAIL_NOT_VERIFIED',
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

/**
 * Middleware to require admin privileges
 */
export const requireAdmin = (
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

  if (!user.isAdmin) {
    res.status(403).json({
      success: false,
      error: {
        code: 'INSUFFICIENT_PRIVILEGES',
        message: 'Administrator privileges required',
        timestamp: new Date().toISOString(),
        requestId: req.get('x-request-id') || 'unknown'
      }
    });
    return;
  }

  next();
};

/**
 * Middleware to check if user is active
 */
export const requireActiveUser = (
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

  if (user.status !== 'active') {
    res.status(403).json({
      success: false,
      error: {
        code: 'ACCOUNT_INACTIVE',
        message: 'Account is not active',
        details: `Account status: ${user.status}`,
        timestamp: new Date().toISOString(),
        requestId: req.get('x-request-id') || 'unknown'
      }
    });
    return;
  }

  next();
};

/**
 * Middleware to check resource ownership
 */
export const requireOwnership = (resourceUserIdField: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
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

    // Get resource user ID from params, body, or query
    const resourceUserId = req.params[resourceUserIdField] || 
                          req.body[resourceUserIdField] || 
                          req.query[resourceUserIdField];

    if (!resourceUserId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_RESOURCE_ID',
          message: 'Resource user ID is required',
          field: resourceUserIdField,
          timestamp: new Date().toISOString(),
          requestId: req.get('x-request-id') || 'unknown'
        }
      });
      return;
    }

    // Allow access if user is admin or owns the resource
    if (user.isAdmin || user.userID === resourceUserId) {
      next();
      return;
    }

    res.status(403).json({
      success: false,
      error: {
        code: 'ACCESS_DENIED',
        message: 'You can only access your own resources',
        timestamp: new Date().toISOString(),
        requestId: req.get('x-request-id') || 'unknown'
      }
    });
  };
};

/**
 * Optional authentication middleware - doesn't fail if no token
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header or cookie
    let token = req.get('authorization')?.replace('Bearer ', '');
    
    if (!token && req.cookies?.['auth_token']) {
      token = req.cookies['auth_token'];
    }

    if (token) {
      // Validate token and get user if token exists
      const user = await getAuthService().validateSession(token);
      if (user) {
        (req as any).user = user;
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    // Continue without authentication on error
    next();
  }
};

/**
 * Rate limiting middleware for authentication endpoints
 */
export const authRateLimit = (maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) => {
  const attempts = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const clientId = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();

    // Clean up expired entries
    for (const [key, value] of attempts.entries()) {
      if (now > value.resetTime) {
        attempts.delete(key);
      }
    }

    const clientAttempts = attempts.get(clientId);

    if (!clientAttempts) {
      attempts.set(clientId, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }

    if (now > clientAttempts.resetTime) {
      attempts.set(clientId, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }

    if (clientAttempts.count >= maxAttempts) {
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many authentication attempts',
          details: `Maximum ${maxAttempts} attempts allowed per ${windowMs / 1000 / 60} minutes`,
          retryAfter: Math.ceil((clientAttempts.resetTime - now) / 1000),
          timestamp: new Date().toISOString(),
          requestId: req.get('x-request-id') || 'unknown'
        }
      });
      return;
    }

    clientAttempts.count++;
    next();
  };
};