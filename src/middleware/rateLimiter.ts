import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Rate Limiting Middleware — 基于真实客户端 IP
 *
 * 通过 X-Forwarded-For 获取 Nginx 反向代理后的真实 IP
 * Uses X-Forwarded-For to get real client IP behind Nginx reverse proxy
 */

/** 获取客户端真实 IP / Get client real IP */
function getClientIp(req: Request): string {
  // X-Forwarded-For 可能是逗号分隔的多个 IP，第一个是真实客户端 IP
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  if (Array.isArray(forwarded) && forwarded.length > 0) return forwarded[0].split(',')[0].trim();
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

/**
 * General API rate limiter — 宽松限制，适用于大部分路由
 * 每个 IP 15 分钟内最多 2000 次请求（SPA 应用每次页面切换约 5-10 个请求）
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  keyGenerator: getClientIp,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later.', statusCode: 429 },
    });
  },
});

/**
 * Strict rate limiter for authentication endpoints — 严格限制防暴力破解
 * 每个 IP 15 分钟内最多 30 次失败的登录/注册尝试
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyGenerator: getClientIp,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: { code: 'RATE_LIMITED', message: 'Too many login attempts, please try again after 15 minutes.', statusCode: 429 },
    });
  },
});

/**
 * Rate limiter for file uploads
 * 每个 IP 每小时最多 50 次上传
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  keyGenerator: getClientIp,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: { code: 'RATE_LIMITED', message: 'Upload limit exceeded, please try again later.', statusCode: 429 },
    });
  },
});

/**
 * Rate limiter for search endpoints
 * 每个 IP 每分钟最多 60 次搜索
 */
export const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  keyGenerator: getClientIp,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: { code: 'RATE_LIMITED', message: 'Search rate limit exceeded, please try again in a moment.', statusCode: 429 },
    });
  },
});

/**
 * Rate limiter for message sending
 * 每个 IP 每分钟最多 40 条消息
 */
export const messageLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 40,
  keyGenerator: getClientIp,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: { code: 'RATE_LIMITED', message: 'Message rate limit exceeded, please wait before sending more messages.', statusCode: 429 },
    });
  },
});

/**
 * Rate limiter for admin actions
 * 每个 IP 5 分钟内最多 100 次管理操作
 */
export const adminLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 100,
  keyGenerator: getClientIp,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: { code: 'RATE_LIMITED', message: 'Admin action rate limit exceeded.', statusCode: 429 },
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
        error: { code: 'RATE_LIMITED', message, statusCode: 429 },
      });
    },
  });
};
