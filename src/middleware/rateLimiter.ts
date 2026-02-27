import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Rate Limiting Middleware
 * Protects against brute force and DDoS attacks
 */

/**
 * General API rate limiter
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many requests, please try again later.',
        statusCode: 429,
        retryAfter: undefined,
      },
    });
  },
});

/**
 * Strict rate limiter for authentication endpoints
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many login attempts, please try again after 15 minutes.',
        statusCode: 429,
        retryAfter: undefined,
      },
    });
  },
});

/**
 * Rate limiter for file uploads
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 uploads per hour
  message: 'Too many file uploads, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        message: 'Upload limit exceeded, please try again later.',
        statusCode: 429,
        retryAfter: undefined,
      },
    });
  },
});

/**
 * Rate limiter for search endpoints
 */
export const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 searches per minute
  message: 'Too many search requests, please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        message: 'Search rate limit exceeded, please try again in a moment.',
        statusCode: 429,
        retryAfter: undefined,
      },
    });
  },
});

/**
 * Rate limiter for message sending
 */
export const messageLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // Limit each IP to 20 messages per minute
  message: 'Too many messages sent, please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        message: 'Message rate limit exceeded, please wait before sending more messages.',
        statusCode: 429,
        retryAfter: undefined,
      },
    });
  },
});

/**
 * Rate limiter for admin actions
 */
export const adminLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // Limit each IP to 50 admin actions per 5 minutes
  message: 'Too many admin actions, please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        message: 'Admin action rate limit exceeded.',
        statusCode: 429,
        retryAfter: undefined,
      },
    });
  },
});

/**
 * Create custom rate limiter
 */
export const createRateLimiter = (
  windowMs: number,
  max: number,
  message: string = 'Too many requests'
) => {
  return rateLimit({
    windowMs,
    max,
    message,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        error: {
          message,
          statusCode: 429,
          retryAfter: undefined,
        },
      });
    },
  });
};
