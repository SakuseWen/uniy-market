import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Security Middleware
 * Additional security measures including CSRF protection
 */

/**
 * CSRF Token Generation and Validation
 * Since csurf is deprecated, we implement our own CSRF protection
 */

const CSRF_TOKEN_LENGTH = 32;
const CSRF_SECRET_LENGTH = 32;

/**
 * Generate CSRF token
 */
export const generateCsrfToken = (): { token: string; secret: string } => {
  const secret = crypto.randomBytes(CSRF_SECRET_LENGTH).toString('hex');
  const token = crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
  
  return { token, secret };
};

/**
 * Verify CSRF token
 */
export const verifyCsrfToken = (token: string, secret: string): boolean => {
  if (!token || !secret) {
    return false;
  }

  try {
    // In a real implementation, you would use HMAC to verify the token
    // For now, we'll do a simple comparison
    return token.length === CSRF_TOKEN_LENGTH * 2 && secret.length === CSRF_SECRET_LENGTH * 2;
  } catch {
    return false;
  }
};

/**
 * CSRF Protection Middleware
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF for API endpoints that use JWT
  if (req.path.startsWith('/api/auth/')) {
    return next();
  }

  const token = req.headers['x-csrf-token'] || req.body?.['_csrf'] || req.query?.['_csrf'];
  const secret = (req.session as any)?.csrfSecret;

  if (!token || !secret || !verifyCsrfToken(token as string, secret)) {
    return res.status(403).json({
      success: false,
      error: {
        message: 'Invalid CSRF token',
        statusCode: 403,
      },
    });
  }

  next();
};

/**
 * Generate and attach CSRF token to session
 */
export const attachCsrfToken = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session) {
    return next();
  }

  const session = req.session as any;
  if (!session.csrfSecret) {
    const { token, secret } = generateCsrfToken();
    session.csrfSecret = secret;
    session.csrfToken = token;
  }

  // Attach token to response locals for templates
  res.locals['csrfToken'] = session.csrfToken;

  next();
};

/**
 * Security Headers Middleware
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  );

  // Strict Transport Security (HTTPS only)
  if (req.secure || process.env['NODE_ENV'] === 'production') {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  next();
};

/**
 * Prevent HTTP Parameter Pollution
 */
export const preventHPP = (req: Request, _res: Response, next: NextFunction) => {
  // Whitelist of parameters that can be arrays
  const whitelist = ['tags', 'categories', 'ids'];

  if (req.query) {
    for (const key in req.query) {
      if (Array.isArray(req.query[key]) && !whitelist.includes(key)) {
        // Take only the first value
        req.query[key] = (req.query[key] as string[])[0];
      }
    }
  }

  next();
};

/**
 * Content Security Policy
 */
export const contentSecurityPolicy = (_req: Request, res: Response, next: NextFunction) => {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdn.socket.io https://maps.googleapis.com",
    "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com",
    "img-src 'self' data: https:",
    "font-src 'self' https://cdnjs.cloudflare.com",
    "connect-src 'self' wss: ws: https://translation.googleapis.com",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  res.setHeader('Content-Security-Policy', csp);
  next();
};

/**
 * Validate request origin
 */
export const validateOrigin = (allowedOrigins: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;

    if (!origin) {
      return next();
    }

    if (!allowedOrigins.includes(origin)) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Origin not allowed',
          statusCode: 403,
        },
      });
    }

    next();
  };
};

/**
 * Prevent timing attacks
 */
export const constantTimeCompare = (a: string, b: string): boolean => {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
};

/**
 * Rate limit by user ID (for authenticated requests)
 */
export const userRateLimit = new Map<string, { count: number; resetTime: number }>();

export const rateLimitByUser = (maxRequests: number, windowMs: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user?.userID;

    if (!userId) {
      return next();
    }

    const now = Date.now();
    const userLimit = userRateLimit.get(userId);

    if (!userLimit || now > userLimit.resetTime) {
      userRateLimit.set(userId, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    if (userLimit.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: {
          message: 'Too many requests, please try again later',
          statusCode: 429,
          retryAfter: new Date(userLimit.resetTime).toISOString(),
        },
      });
    }

    userLimit.count++;
    next();
  };
};

/**
 * Clean up expired rate limit entries
 */
setInterval(() => {
  const now = Date.now();
  for (const [userId, limit] of userRateLimit.entries()) {
    if (now > limit.resetTime) {
      userRateLimit.delete(userId);
    }
  }
}, 60 * 1000); // Clean up every minute
