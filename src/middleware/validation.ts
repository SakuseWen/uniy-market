import { Request, Response, NextFunction } from 'express';
import { ValidationError } from './errorHandler';

/**
 * Validation schemas
 */
export const ValidationSchemas = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[\d\s-()]+$/,
  url: /^https?:\/\/.+/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
};

/**
 * Sanitize string input
 */
export const sanitizeString = (input: string): string => {
  if (typeof input !== 'string') return '';

  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
};

/**
 * Sanitize object recursively
 */
export const sanitizeObject = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (typeof obj !== 'object') {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    }
    return obj;
  }

  const sanitized: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
  }
  return sanitized;
};

/**
 * Input sanitization middleware
 */
export const sanitizeInput = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

/**
 * Validate required fields
 */
export const validateRequired = (fields: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const missing: string[] = [];

    for (const field of fields) {
      const value = req.body[field];
      if (value === undefined || value === null || value === '') {
        missing.push(field);
      }
    }

    if (missing.length > 0) {
      throw new ValidationError('Missing required fields', { missing });
    }

    next();
  };
};

/**
 * Validate email format
 */
export const validateEmail = (field: string = 'email') => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const email = req.body[field];

    if (!email) {
      throw new ValidationError(`${field} is required`);
    }

    if (!ValidationSchemas.email.test(email)) {
      throw new ValidationError(`Invalid ${field} format`);
    }

    next();
  };
};

/**
 * Validate number range
 */
export const validateRange = (field: string, min?: number, max?: number) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const value = req.body[field];

    if (value === undefined || value === null) {
      throw new ValidationError(`${field} is required`);
    }

    const num = Number(value);

    if (isNaN(num)) {
      throw new ValidationError(`${field} must be a number`);
    }

    if (min !== undefined && num < min) {
      throw new ValidationError(`${field} must be at least ${min}`);
    }

    if (max !== undefined && num > max) {
      throw new ValidationError(`${field} must be at most ${max}`);
    }

    next();
  };
};

/**
 * Validate string length
 */
export const validateLength = (field: string, min?: number, max?: number) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const value = req.body[field];

    if (!value) {
      throw new ValidationError(`${field} is required`);
    }

    if (typeof value !== 'string') {
      throw new ValidationError(`${field} must be a string`);
    }

    const length = value.length;

    if (min !== undefined && length < min) {
      throw new ValidationError(`${field} must be at least ${min} characters`);
    }

    if (max !== undefined && length > max) {
      throw new ValidationError(`${field} must be at most ${max} characters`);
    }

    next();
  };
};

/**
 * Validate enum values
 */
export const validateEnum = (field: string, allowedValues: any[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const value = req.body[field];

    if (value === undefined || value === null) {
      throw new ValidationError(`${field} is required`);
    }

    if (!allowedValues.includes(value)) {
      throw new ValidationError(
        `${field} must be one of: ${allowedValues.join(', ')}`,
        { allowedValues }
      );
    }

    next();
  };
};

/**
 * Validate pagination parameters
 */
export const validatePagination = (req: Request, _res: Response, next: NextFunction): void => {
  const { limit, offset, page } = req.query;

  if (limit) {
    const limitNum = parseInt(limit as string);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      throw new ValidationError('limit must be between 1 and 100');
    }
  }

  if (offset) {
    const offsetNum = parseInt(offset as string);
    if (isNaN(offsetNum) || offsetNum < 0) {
      throw new ValidationError('offset must be a non-negative number');
    }
  }

  if (page) {
    const pageNum = parseInt(page as string);
    if (isNaN(pageNum) || pageNum < 1) {
      throw new ValidationError('page must be a positive number');
    }
  }

  next();
};

/**
 * Validate file upload
 */
export const validateFileUpload = (
  allowedTypes: string[],
  maxSize: number = 5 * 1024 * 1024 // 5MB default
) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.file && !req.files) {
      throw new ValidationError('No file uploaded');
    }

    const files = req.files ? (Array.isArray(req.files) ? req.files : [req.file]) : [req.file];

    for (const file of files) {
      if (!file) continue;

      // Check file type
      if (!allowedTypes.includes(file.mimetype)) {
        throw new ValidationError(
          `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
          { allowedTypes }
        );
      }

      // Check file size
      if (file.size > maxSize) {
        throw new ValidationError(
          `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`,
          { maxSize }
        );
      }
    }

    next();
  };
};
