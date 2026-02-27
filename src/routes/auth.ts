import express from 'express';
import passport from 'passport';
import { AuthService } from '../services/AuthService';
import { authenticateToken } from '../middleware/auth';
import { body, validationResult } from 'express-validator';

const router = express.Router();
let authService: AuthService | null = null;

function getAuthService(): AuthService {
  if (!authService) {
    authService = new AuthService();
  }
  return authService;
}

/**
 * @route   GET /api/auth/google
 * @desc    Initiate Google OAuth authentication
 * @access  Public
 */
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

/**
 * @route   GET /api/auth/google/callback
 * @desc    Google OAuth callback
 * @access  Public
 */
router.get('/google/callback', 
  passport.authenticate('google', { session: false }),
  async (req: express.Request, res: express.Response) => {
    try {
      const user = req.user as any;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_FAILED',
            message: 'Authentication failed',
            timestamp: new Date().toISOString(),
            requestId: req.get('x-request-id') || 'unknown'
          }
        });
      }

      // Check if user has university email
      const isUniversityEmail = await getAuthService().verifyUniversityEmail(user.email);
      
      if (!isUniversityEmail) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'INVALID_EMAIL_DOMAIN',
            message: 'Please use a valid university email address',
            details: 'Only university email addresses are allowed to register',
            timestamp: new Date().toISOString(),
            requestId: req.get('x-request-id') || 'unknown'
          }
        });
      }

      // Update user verification status if they have university email
      if (!user.isVerified && isUniversityEmail) {
        await getAuthService().updateUserVerification(user.userID, true);
        user.isVerified = true;
      }

      // Create session token
      const sessionToken = await getAuthService().createSession(user);

      // Set HTTP-only cookie for security
      res.cookie('auth_token', sessionToken.token, {
        httpOnly: true,
        secure: process.env['NODE_ENV'] === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Redirect to frontend with success
      return res.redirect(`/public/app.html?auth=success`);

    } catch (error) {
      console.error('OAuth callback error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Authentication failed due to server error',
          timestamp: new Date().toISOString(),
          requestId: req.get('x-request-id') || 'unknown'
        }
      });
    }
  }
);

/**
 * @route   GET /api/auth/user
 * @desc    Get current authenticated user
 * @access  Public (checks cookie)
 */
router.get('/user', async (req, res): Promise<void> => {
  try {
    const token = req.cookies?.['auth_token'];
    
    if (!token) {
      res.json({
        success: true,
        user: null
      });
      return;
    }

    const user = await getAuthService().validateSession(token);
    
    if (!user) {
      res.clearCookie('auth_token');
      res.json({
        success: true,
        user: null
      });
      return;
    }

    res.json({
      success: true,
      user: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.json({
      success: true,
      user: null
    });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and invalidate session
 * @access  Private
 */
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const token = req.get('authorization')?.replace('Bearer ', '') || 
                  req.cookies?.['auth_token'];

    if (token) {
      await getAuthService().invalidateSession(token);
    }

    // Clear cookie
    res.clearCookie('auth_token');

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'LOGOUT_FAILED',
        message: 'Failed to logout',
        timestamp: new Date().toISOString(),
        requestId: req.get('x-request-id') || 'unknown'
      }
    });
  }
});

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = req.user as any;
    
    res.json({
      success: true,
      data: {
        user: user
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'PROFILE_FETCH_FAILED',
        message: 'Failed to fetch user profile',
        timestamp: new Date().toISOString(),
        requestId: req.get('x-request-id') || 'unknown'
      }
    });
  }
});

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', 
  authenticateToken,
  [
    body('name').optional().isLength({ min: 1, max: 100 }).trim(),
    body('phone').optional().isMobilePhone('any'),
    body('preferredLanguage').optional().isIn(['en', 'th', 'zh']),
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array(),
            timestamp: new Date().toISOString(),
            requestId: req.get('x-request-id') || 'unknown'
          }
        });
      }

      const user = req.user as any;
      const updates = req.body;

      const updatedUser = await getAuthService().updateUserProfile(user.userID, updates);

      return res.json({
        success: true,
        data: {
          user: updatedUser
        }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'PROFILE_UPDATE_FAILED',
          message: 'Failed to update user profile',
          timestamp: new Date().toISOString(),
          requestId: req.get('x-request-id') || 'unknown'
        }
      });
    }
  }
);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify university email domain
 * @access  Public
 */
router.post('/verify-email',
  [
    body('email').isEmail().normalizeEmail(),
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid email format',
            details: errors.array(),
            timestamp: new Date().toISOString(),
            requestId: req.get('x-request-id') || 'unknown'
          }
        });
      }

      const { email } = req.body;
      const isUniversityEmail = await getAuthService().verifyUniversityEmail(email);

      return res.json({
        success: true,
        data: {
          isUniversityEmail,
          email,
          message: isUniversityEmail 
            ? 'University email verified successfully' 
            : 'Email domain is not in the university whitelist'
        }
      });
    } catch (error) {
      console.error('Email verification error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'EMAIL_VERIFICATION_FAILED',
          message: 'Failed to verify email domain',
          timestamp: new Date().toISOString(),
          requestId: req.get('x-request-id') || 'unknown'
        }
      });
    }
  }
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh JWT token
 * @access  Public (requires valid token in body)
 */
router.post('/refresh',
  [
    body('token').notEmpty().withMessage('Token is required'),
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Token is required',
            details: errors.array(),
            timestamp: new Date().toISOString(),
            requestId: req.get('x-request-id') || 'unknown'
          }
        });
      }

      const { token } = req.body;
      const newToken = await getAuthService().refreshToken(token);

      if (!newToken) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'TOKEN_REFRESH_FAILED',
            message: 'Unable to refresh token',
            timestamp: new Date().toISOString(),
            requestId: req.get('x-request-id') || 'unknown'
          }
        });
      }

      // Set new HTTP-only cookie
      res.cookie('auth_token', newToken.token, {
        httpOnly: true,
        secure: process.env['NODE_ENV'] === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return res.json({
        success: true,
        data: {
          token: newToken.token,
          expiresAt: newToken.expiresAt
        }
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'TOKEN_REFRESH_ERROR',
          message: 'Failed to refresh token',
          timestamp: new Date().toISOString(),
          requestId: req.get('x-request-id') || 'unknown'
        }
      });
    }
  }
);

export default router;