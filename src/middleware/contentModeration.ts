import { Request, Response, NextFunction } from 'express';
import { contentModerationService } from '../services/ContentModerationService';

/**
 * Middleware to moderate product content
 */
export const moderateProductContent = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { title, description } = req.body;
  const user = (req as any).user;
  const language = user?.preferredLanguage as 'en' | 'th' | 'zh' | undefined;

  // Skip if no content to moderate
  if (!title && !description) {
    return next();
  }

  const result = contentModerationService.moderateProductListing(
    title || '',
    description || '',
    language
  );

  if (!result.approved) {
    res.status(400).json({
      success: false,
      error: {
        code: 'CONTENT_MODERATION_FAILED',
        message: result.reason || 'Content contains inappropriate material',
        details: {
          titleFlagged: result.titleResult.flagged,
          descriptionFlagged: result.descriptionResult.flagged,
          isSpam: result.spamCheck.isSpam,
          severity: Math.max(
            result.titleResult.severity === 'high' ? 3 :
            result.titleResult.severity === 'medium' ? 2 :
            result.titleResult.severity === 'low' ? 1 : 0,
            result.descriptionResult.severity === 'high' ? 3 :
            result.descriptionResult.severity === 'medium' ? 2 :
            result.descriptionResult.severity === 'low' ? 1 : 0
          )
        }
      },
      timestamp: new Date().toISOString()
    } as any);
    return;
  }

  // Flag for review if content is suspicious but not blocked
  if (result.titleResult.flagged || result.descriptionResult.flagged) {
    (req as any).contentFlagged = true;
    (req as any).moderationResult = result;
  }

  next();
};

/**
 * Middleware to moderate chat message content
 */
export const moderateChatMessage = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { messageText, messageType } = req.body;
  const user = (req as any).user;
  const language = user?.preferredLanguage as 'en' | 'th' | 'zh' | undefined;

  // Skip if not a text message
  if (messageType !== 'text' || !messageText) {
    return next();
  }

  const result = contentModerationService.moderateChatMessage(messageText, language);

  if (!result.approved) {
    res.status(400).json({
      success: false,
      error: {
        code: 'MESSAGE_MODERATION_FAILED',
        message: result.result.reason || 'Message contains inappropriate content',
        details: {
          severity: result.result.severity,
          categories: [...new Set(result.result.matches.map(m => m.category))]
        }
      },
      timestamp: new Date().toISOString()
    } as any);
    return;
  }

  // Store moderation result for logging
  if (result.result.flagged) {
    (req as any).contentFlagged = true;
    (req as any).moderationResult = result;
  }

  next();
};

/**
 * Middleware to moderate review content
 */
export const moderateReviewContent = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { comment } = req.body;
  const user = (req as any).user;
  const language = user?.preferredLanguage as 'en' | 'th' | 'zh' | undefined;

  // Skip if no comment
  if (!comment) {
    return next();
  }

  const result = contentModerationService.moderateReview(comment, language);

  if (!result.approved) {
    res.status(400).json({
      success: false,
      error: {
        code: 'REVIEW_MODERATION_FAILED',
        message: result.result.reason || 'Review contains inappropriate content',
        details: {
          severity: result.result.severity,
          categories: [...new Set(result.result.matches.map(m => m.category))]
        }
      },
      timestamp: new Date().toISOString()
    } as any);
    return;
  }

  // Flag for review if content is suspicious
  if (result.result.flagged) {
    (req as any).contentFlagged = true;
    (req as any).moderationResult = result;
  }

  next();
};

/**
 * Middleware to check for spam
 */
export const checkSpam = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { title, description, messageText, comment } = req.body;
  const content = [title, description, messageText, comment]
    .filter(Boolean)
    .join(' ');

  if (!content) {
    return next();
  }

  const spamCheck = contentModerationService.isSpam(content);

  if (spamCheck.isSpam) {
    res.status(400).json({
      success: false,
      error: {
        code: 'SPAM_DETECTED',
        message: spamCheck.reason || 'Content appears to be spam'
      },
      timestamp: new Date().toISOString()
    } as any);
    return;
  }

  next();
};

/**
 * Middleware to log flagged content
 */
export const logFlaggedContent = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const flagged = (req as any).contentFlagged;
  const moderationResult = (req as any).moderationResult;
  const user = (req as any).user;

  if (flagged && moderationResult) {
    // In production, this would log to a database or monitoring service
    console.warn('Flagged content detected:', {
      userId: user?.userID,
      path: req.path,
      method: req.method,
      severity: moderationResult.result?.severity || moderationResult.titleResult?.severity,
      timestamp: new Date().toISOString()
    });
  }

  next();
};
