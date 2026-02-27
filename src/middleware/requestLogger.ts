import { Request, Response, NextFunction } from 'express';
import { logger } from '../services/LoggerService';

/**
 * Request logging middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const requestId = req.get('x-request-id') || `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  // Attach request ID to request object
  (req as any).requestId = requestId;

  // Log request start
  logger.debug('Request started', {
    requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Capture response
  const originalSend = res.send;
  res.send = function (data: any): Response {
    const duration = Date.now() - startTime;
    const userId = (req as any).user?.userID;

    // Log request completion
    logger.logRequest(req.method, req.path, res.statusCode, duration, userId, requestId);

    // Log slow requests
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        requestId,
        method: req.method,
        path: req.path,
        duration: `${duration}ms`,
        userId,
      });
    }

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Security event logging middleware
 */
export const securityLogger = (req: Request, res: Response, next: NextFunction): void => {
  const userId = (req as any).user?.userID;
  const requestId = (req as any).requestId;

  // Log authentication attempts
  if (req.path.includes('/auth/')) {
    logger.logSecurityEvent('authentication_attempt', userId, {
      requestId,
      path: req.path,
      ip: req.ip,
    });
  }

  // Log admin actions
  if (req.path.includes('/admin/') && userId) {
    logger.logSecurityEvent('admin_action', userId, {
      requestId,
      method: req.method,
      path: req.path,
      ip: req.ip,
    }, 'high');
  }

  next();
};
