import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Rate Limiting Middleware
 * Protects against brute force and DDoS attacks
 *
 * keyGenerator 显式从 X-Forwarded-For 读取真实 IP，兼容 Nginx 反向代理
 * keyGenerator explicitly reads real IP from X-Forwarded-For for Nginx reverse proxy
 */

/** 获取客户端真实 IP / Get client real IP */
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  if (Array.isArray(forwarded)) return forwarded[0];
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

/**
 * General API rate limiter
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  keyGenerator: getClientIp,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: { message: 'Too many requests, please try again later.', statusCode: 429 },
    });
  },
});

/**
 * Strict rate limiter for authentication endpoints
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyGenerator: getClientIp,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: { message: 'Too many login attempts, please try again after 15 minutes.', statusCode: 429 },
    });
  },
});

/**
 * Rate limiter for file uploads
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: getClientIp,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: { message: 'Upload limit exceeded, please try again later.', statusCode: 429 },
    });
  },
});

/**
 * Rate limiter for search endpoints
 */
export const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  keyGenerator: getClientIp,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: { message: 'Search rate limit exceeded, please try again in a moment.', statusCode: 429 },
    });
  },
});

/**
 * Rate limiter for message sending
 */
export const messageLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,
  keyGenerator: getClientIp,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: { message: 'Message rate limit exceeded, please wait before sending more messages.', statusCode: 429 },
    });
  },
});

/**
 * Rate limiter for admin actions
 */
export const adminLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 50,
  keyGenerator: getClientIp,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: { message: 'Admin action rate limit exceeded.', statusCode: 429 },
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
    keyGenerator: getClientIp,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        error: { message, statusCode: 429 },
      });
    },
  });
};
