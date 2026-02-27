import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { body, param, validationResult } from 'express-validator';
import { UserModel } from '../models/UserModel';
import LocalizationService from '../services/LocalizationService';

const router = express.Router();

// Lazy initialization of UserModel
function getUserModel(): UserModel {
  return new UserModel();
}

/**
 * @route   GET /api/language/locales/:lang
 * @desc    Get all localized strings for a language
 * @access  Public
 */
router.get('/locales/:lang', 
  [
    param('lang').isIn(['en', 'th', 'zh']).withMessage('Invalid language code')
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid language code',
            details: errors.array(),
            timestamp: new Date().toISOString(),
            requestId: req.get('x-request-id') || 'unknown'
          }
        });
      }

      const { lang } = req.params;
      const localeData = LocalizationService.getAllStrings(lang as 'en' | 'th' | 'zh');

      if (!localeData) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'LOCALE_NOT_FOUND',
            message: `Locale data not found for language: ${lang}`,
            timestamp: new Date().toISOString(),
            requestId: req.get('x-request-id') || 'unknown'
          }
        });
      }

      return res.json({
        success: true,
        data: {
          language: lang,
          translations: localeData
        }
      });
    } catch (error) {
      console.error('Get locale error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'LOCALE_FETCH_FAILED',
          message: 'Failed to fetch locale data',
          timestamp: new Date().toISOString(),
          requestId: req.get('x-request-id') || 'unknown'
        }
      });
    }
  }
);

/**
 * @route   GET /api/language/supported
 * @desc    Get list of supported languages
 * @access  Public
 */
router.get('/supported', async (req: express.Request, res: express.Response) => {
  try {
    const supportedLanguages = LocalizationService.getSupportedLanguages();

    return res.json({
      success: true,
      data: {
        languages: supportedLanguages.map(lang => ({
          code: lang,
          name: LocalizationService.getString(lang, `language.${lang === 'en' ? 'english' : lang === 'th' ? 'thai' : 'chinese'}`)
        }))
      }
    });
  } catch (error) {
    console.error('Get supported languages error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'LANGUAGES_FETCH_FAILED',
        message: 'Failed to fetch supported languages',
        timestamp: new Date().toISOString(),
        requestId: req.get('x-request-id') || 'unknown'
      }
    });
  }
});

/**
 * @route   PUT /api/language/preference
 * @desc    Update user's language preference
 * @access  Private
 */
router.put('/preference',
  authenticateToken,
  [
    body('language').isIn(['en', 'th', 'zh']).withMessage('Invalid language code')
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid language code',
            details: errors.array(),
            timestamp: new Date().toISOString(),
            requestId: req.get('x-request-id') || 'unknown'
          }
        });
      }

      const user = req.user as any;
      const { language } = req.body;

      // Update user's preferred language
      const userModel = getUserModel();
      const updatedUser = await userModel.updateUser(user.userID, {
        preferredLanguage: language
      });

      return res.json({
        success: true,
        data: {
          user: updatedUser,
          message: LocalizationService.getString(language, 'language.languageUpdated')
        }
      });
    } catch (error) {
      console.error('Update language preference error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'LANGUAGE_UPDATE_FAILED',
          message: 'Failed to update language preference',
          timestamp: new Date().toISOString(),
          requestId: req.get('x-request-id') || 'unknown'
        }
      });
    }
  }
);

/**
 * @route   GET /api/language/preference
 * @desc    Get user's current language preference
 * @access  Private
 */
router.get('/preference',
  authenticateToken,
  async (req: express.Request, res: express.Response) => {
    try {
      const user = req.user as any;

      return res.json({
        success: true,
        data: {
          language: user.preferredLanguage,
          languageName: LocalizationService.getString(
            user.preferredLanguage, 
            `language.${user.preferredLanguage === 'en' ? 'english' : user.preferredLanguage === 'th' ? 'thai' : 'chinese'}`
          )
        }
      });
    } catch (error) {
      console.error('Get language preference error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'LANGUAGE_FETCH_FAILED',
          message: 'Failed to fetch language preference',
          timestamp: new Date().toISOString(),
          requestId: req.get('x-request-id') || 'unknown'
        }
      });
    }
  }
);

/**
 * @route   GET /api/language/string/:key
 * @desc    Get a specific localized string
 * @access  Public
 */
router.get('/string/:key',
  [
    param('key').notEmpty().withMessage('Key is required')
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid key',
            details: errors.array(),
            timestamp: new Date().toISOString(),
            requestId: req.get('x-request-id') || 'unknown'
          }
        });
      }

      const { key } = req.params;
      
      if (!key) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Key is required',
            timestamp: new Date().toISOString(),
            requestId: req.get('x-request-id') || 'unknown'
          }
        });
      }

      const lang = (req.query['lang'] as string) || 'en';

      if (!LocalizationService.isLanguageSupported(lang)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_LANGUAGE',
            message: 'Invalid language code',
            timestamp: new Date().toISOString(),
            requestId: req.get('x-request-id') || 'unknown'
          }
        });
      }

      const localizedString = LocalizationService.getString(lang, key);

      return res.json({
        success: true,
        data: {
          key,
          language: lang,
          value: localizedString
        }
      });
    } catch (error) {
      console.error('Get localized string error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'STRING_FETCH_FAILED',
          message: 'Failed to fetch localized string',
          timestamp: new Date().toISOString(),
          requestId: req.get('x-request-id') || 'unknown'
        }
      });
    }
  }
);

export default router;
