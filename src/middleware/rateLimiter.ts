import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Rate Limiting Middleware — 基于真实客户端 IP
 * 通过 X-Real-IP / X-Forwarded-For 获取 Nginx 反向代理后的真实 IP
 */

/** 获取客户端真实 IP / Get client real IP */
function getClientIp(req: Request): string {
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp) return realIp;

  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded) return forwarded.split(',')[0].trim();
  if (Array.isArray(forwarded) && forwarded.length > 0) return forwarded[0].split(',')[0].trim();

  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  return ip.replace(/^::ffff:/, '');
}

/** 公共配置：禁用 express-rate-limit v7 的 X-Forwarded-For 校验（我们自己处理） */
const commonOpts = {
  keyGenerator: getClientIp,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false } as any,
};

export const apiLimiter = rateLimit({
  ...commonOpts,
  windowMs: 15 * 60 * 1000,
  max: 2000,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({ success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later.', statusCode: 429 } });
  },
});

export const authLimiter = rateLimit({
  ...commonOpts,
  windowMs: 15 * 60 * 1000,
  max: 30,
  skipSuccessfulRequests: true,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({ success: false, error: { code: 'RATE_LIMITED', message: 'Too many login attempts, please try again after 15 minutes.', statusCode: 429 } });
  },
});

export const uploadLimiter = rateLimit({
  ...commonOpts,
  windowMs: 60 * 60 * 1000,
  max: 50,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({ success: false, error: { code: 'RATE_LIMITED', message: 'Upload limit exceeded, please try again later.', statusCode: 429 } });
  },
});

export const searchLimiter = rateLimit({
  ...commonOpts,
  windowMs: 1 * 60 * 1000,
  max: 60,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({ success: false, error: { code: 'RATE_LIMITED', message: 'Search rate limit exceeded.', statusCode: 429 } });
  },
});

export const messageLimiter = rateLimit({
  ...commonOpts,
  windowMs: 1 * 60 * 1000,
  max: 40,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({ success: false, error: { code: 'RATE_LIMITED', message: 'Message rate limit exceeded.', statusCode: 429 } });
  },
});

export const adminLimiter = rateLimit({
  ...commonOpts,
  windowMs: 5 * 60 * 1000,
  max: 100,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({ success: false, error: { code: 'RATE_LIMITED', message: 'Admin action rate limit exceeded.', statusCode: 429 } });
  },
});

export const createRateLimiter = (windowMs: number, max: number, message: string = 'Too many requests') => {
  return rateLimit({
    ...commonOpts,
    windowMs,
    max,
    handler: (_req: Request, res: Response) => {
      res.status(429).json({ success: false, error: { code: 'RATE_LIMITED', message, statusCode: 429 } });
    },
  });
};
