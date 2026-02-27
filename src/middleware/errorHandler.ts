import { Request, Response, NextFunction } from 'express';

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  code?: string;
  details?: any;

  constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    if (code) {
      this.code = code;
    }
    if (details) {
      this.details = details;
    }
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error types for different scenarios
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, 'CONFLICT', details);
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super('Too many requests', 429, 'RATE_LIMIT_EXCEEDED', { retryAfter });
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 500, 'DATABASE_ERROR', details);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message?: string) {
    super(message || `${service} service unavailable`, 503, 'EXTERNAL_SERVICE_ERROR', { service });
  }
}

/**
 * Logger utility for structured logging
 */
class Logger {
  private static formatLog(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(meta && { meta }),
    };
    return JSON.stringify(logEntry);
  }

  static error(message: string, error?: Error | any, meta?: any): void {
    console.error(
      this.formatLog('ERROR', message, {
        ...meta,
        error: error?.message,
        stack: error?.stack,
        code: error?.code,
      })
    );
  }

  static warn(message: string, meta?: any): void {
    console.warn(this.formatLog('WARN', message, meta));
  }

  static info(message: string, meta?: any): void {
    console.info(this.formatLog('INFO', message, meta));
  }

  static debug(message: string, meta?: any): void {
    if (process.env['NODE_ENV'] === 'development') {
      console.debug(this.formatLog('DEBUG', message, meta));
    }
  }
}

/**
 * Enhanced error handler middleware
 */
export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Default values
  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred';
  let details: any = undefined;

  // Handle AppError instances
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    code = error.code || 'APP_ERROR';
    message = error.message;
    details = error.details;
  }
  // Handle specific error types
  else if (error.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = error.message;
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    code = 'UNAUTHORIZED';
    message = 'Invalid authentication token';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Token has expired';
  } else if (error.message?.includes('SQLITE_CONSTRAINT')) {
    statusCode = 409;
    code = 'CONSTRAINT_VIOLATION';
    message = 'Database constraint violation';
    details = { constraint: error.message };
  } else if (error.message?.includes('SQLITE')) {
    statusCode = 500;
    code = 'DATABASE_ERROR';
    message = 'Database operation failed';
  }

  // Generate request ID for tracking
  const requestId = req.get('x-request-id') || `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  // Log error
  if (statusCode >= 500) {
    Logger.error('Server error', error, {
      requestId,
      method: req.method,
      path: req.path,
      statusCode,
      code,
      userId: (req as any).user?.userID,
    });
  } else if (statusCode >= 400) {
    Logger.warn('Client error', {
      requestId,
      method: req.method,
      path: req.path,
      statusCode,
      code,
      message,
      userId: (req as any).user?.userID,
    });
  }

  // Send error response
  const errorResponse: any = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
      timestamp: new Date().toISOString(),
      requestId,
    },
  };

  // Include stack trace in development
  if (process.env['NODE_ENV'] === 'development' && error.stack) {
    errorResponse.error.stack = error.stack;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Helper functions to create specific errors
 */
export const createError = (
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: any
): AppError => {
  return new AppError(message, statusCode, code, details);
};

export const createValidationError = (message: string, details?: any): ValidationError => {
  return new ValidationError(message, details);
};

export const createAuthError = (message?: string): AuthenticationError => {
  return new AuthenticationError(message);
};

export const createAuthzError = (message?: string): AuthorizationError => {
  return new AuthorizationError(message);
};

export const createNotFoundError = (resource?: string): NotFoundError => {
  return new NotFoundError(resource);
};

export const createConflictError = (message: string, details?: any): ConflictError => {
  return new ConflictError(message, details);
};

export { Logger };
