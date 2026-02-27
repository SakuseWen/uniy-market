import { Request, Response, NextFunction } from 'express';

/**
 * Input Sanitization Middleware
 * Sanitizes user input to prevent XSS and injection attacks
 */

/**
 * Sanitize string input
 */
export const sanitizeString = (input: string): string => {
  if (typeof input !== 'string') {
    return input;
  }

  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');

  // Escape special characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  return sanitized.trim();
};

/**
 * Sanitize object recursively
 */
export const sanitizeObject = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  return obj;
};

/**
 * Middleware to sanitize request body
 */
export const sanitizeBody = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  next();
};

/**
 * Middleware to sanitize query parameters
 */
export const sanitizeQuery = (req: Request, _res: Response, next: NextFunction) => {
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  next();
};

/**
 * Middleware to sanitize URL parameters
 */
export const sanitizeParams = (req: Request, _res: Response, next: NextFunction) => {
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  next();
};

/**
 * Combined sanitization middleware
 */
export const sanitizeAll = (req: Request, res: Response, next: NextFunction) => {
  sanitizeBody(req, res, () => {
    sanitizeQuery(req, res, () => {
      sanitizeParams(req, res, next);
    });
  });
};

/**
 * Validate and sanitize email
 */
export const sanitizeEmail = (email: string): string | null => {
  if (!email || typeof email !== 'string') {
    return null;
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const trimmed = email.trim().toLowerCase();

  if (!emailRegex.test(trimmed)) {
    return null;
  }

  return trimmed;
};

/**
 * Validate and sanitize URL
 */
export const sanitizeUrl = (url: string): string | null => {
  if (!url || typeof url !== 'string') {
    return null;
  }

  try {
    const parsed = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
};

/**
 * Sanitize filename
 */
export const sanitizeFilename = (filename: string): string => {
  if (!filename || typeof filename !== 'string') {
    return 'file';
  }

  // Remove path traversal attempts
  let sanitized = filename.replace(/\.\./g, '');
  
  // Remove special characters except dots, dashes, and underscores
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.split('.').pop();
    sanitized = sanitized.substring(0, 250) + '.' + ext;
  }

  return sanitized;
};

/**
 * Prevent parameter pollution
 */
export const preventParameterPollution = (req: Request, _res: Response, next: NextFunction) => {
  // Convert array parameters to single values (take first value)
  if (req.query) {
    for (const key in req.query) {
      if (Array.isArray(req.query[key])) {
        req.query[key] = (req.query[key] as string[])[0];
      }
    }
  }
  next();
};

/**
 * SQL injection prevention (for raw queries)
 */
export const escapeSqlString = (input: string): string => {
  if (typeof input !== 'string') {
    return input;
  }

  return input
    .replace(/'/g, "''")
    .replace(/\\/g, '\\\\')
    .replace(/\0/g, '\\0')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\x1a/g, '\\Z');
};

/**
 * NoSQL injection prevention
 */
export const sanitizeNoSqlInput = (input: any): any => {
  if (typeof input === 'object' && input !== null) {
    // Remove MongoDB operators
    const sanitized: any = {};
    for (const key in input) {
      if (!key.startsWith('$')) {
        sanitized[key] = sanitizeNoSqlInput(input[key]);
      }
    }
    return sanitized;
  }
  return input;
};
