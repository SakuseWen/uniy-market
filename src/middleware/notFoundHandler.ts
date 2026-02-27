import { Request, Response } from 'express';

export const notFoundHandler = (
  req: Request,
  res: Response
): void => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.originalUrl} not found`,
      method: req.method,
      path: req.originalUrl,
    },
    timestamp: new Date().toISOString(),
  });
};
