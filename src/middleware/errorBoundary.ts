import { Request, Response, NextFunction } from 'express';

/**
 * Error Boundary Middleware
 * Provides comprehensive error handling and recovery for the application
 */

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
}

/**
 * Create a custom application error
 */
export class ApplicationError extends Error implements AppError {
  statusCode: number;
  isOperational: boolean;
  code?: string;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (code) {
      this.code = code;
    }
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async error wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Global error boundary middleware
 */
export const errorBoundary = (err: AppError, req: Request, res: Response, _next: NextFunction) => {
  // Set default values
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  // Log error for debugging
  if (process.env['NODE_ENV'] !== 'production') {
    console.error('Error:', {
      message: err.message,
      statusCode: err.statusCode,
      stack: err.stack,
      url: req.url,
      method: req.method,
    });
  }

  // Handle specific error types
  if (err.name === 'ValidationError') {
    err.statusCode = 400;
    err.message = 'Validation Error';
  }

  if (err.name === 'UnauthorizedError' || err.message.includes('jwt')) {
    err.statusCode = 401;
    err.message = 'Unauthorized - Invalid or expired token';
  }

  if (err.name === 'CastError') {
    err.statusCode = 400;
    err.message = 'Invalid ID format';
  }

  if (err.code === 'SQLITE_CONSTRAINT') {
    err.statusCode = 409;
    err.message = 'Database constraint violation';
  }

  // Send error response
  const errorResponse: any = {
    success: false,
    error: {
      message: err.message,
      statusCode: err.statusCode,
    },
  };

  // Include stack trace in development
  if (process.env['NODE_ENV'] !== 'production') {
    errorResponse.error.stack = err.stack;
    errorResponse.error.code = err.code;
  }

  res.status(err.statusCode).json(errorResponse);
};

/**
 * Handle unhandled promise rejections
 */
export const handleUnhandledRejection = () => {
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Log to error tracking service in production
    if (process.env['NODE_ENV'] === 'production') {
      // TODO: Send to error tracking service (e.g., Sentry)
    }
  });
};

/**
 * Handle uncaught exceptions
 */
export const handleUncaughtException = () => {
  process.on('uncaughtException', (error: Error) => {
    console.error('Uncaught Exception:', error);
    // Log to error tracking service in production
    if (process.env['NODE_ENV'] === 'production') {
      // TODO: Send to error tracking service (e.g., Sentry)
    }
    // Exit process after logging
    process.exit(1);
  });
};
