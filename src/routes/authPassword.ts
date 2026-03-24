import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/UserModel';
import { DatabaseManager } from '../config/database';
import { generateVerificationCode, sendVerificationEmail } from '../services/emailService';

const router = express.Router();
let userModel: UserModel | null = null;

function getUserModel(): UserModel {
  if (!userModel) {
    userModel = new UserModel();
  }
  return userModel;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

/**
 * @route   POST /api/auth/login
 * @desc    Login with email and password
 * @access  Public
 */
router.post('/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      // Validate input
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

      const { email, password } = req.body;

      // Find user by email
      const user = await getUserModel().getUserByEmail(email);

      if (!user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
            timestamp: new Date().toISOString(),
            requestId: req.get('x-request-id') || 'unknown'
          }
        });
      }

      // Check if user has password set
      if (!user.password) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'NO_PASSWORD_SET',
            message: 'This account does not have a password. Please use Google OAuth to login.',
            timestamp: new Date().toISOString(),
            requestId: req.get('x-request-id') || 'unknown'
          }
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
            timestamp: new Date().toISOString(),
            requestId: req.get('x-request-id') || 'unknown'
          }
        });
      }

      // Check if user is verified
      if (!user.isVerified) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'USER_NOT_VERIFIED',
            message: 'Your account is not verified. Please verify your email.',
            email: user.email,
            timestamp: new Date().toISOString(),
            requestId: req.get('x-request-id') || 'unknown'
          }
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          userID: user.userID,
          email: user.email,
          name: user.name,
          isVerified: user.isVerified,
          isAdmin: user.isAdmin,
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        success: true,
        data: {
          token,
          user: {
            userID: user.userID,
            email: user.email,
            name: user.name,
            profileImage: user.profileImage,
            isVerified: user.isVerified,
            isAdmin: user.isAdmin,
            preferredLanguage: user.preferredLanguage,
          }
        },
        message: 'Login successful'
      });

    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'LOGIN_FAILED',
          message: 'Failed to login',
          timestamp: new Date().toISOString(),
          requestId: req.get('x-request-id') || 'unknown'
        }
      });
    }
  }
);

/**
 * @route   POST /api/auth/register
 * @desc    Register with email and password
 * @access  Public
 */
router.post('/register',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('name').notEmpty().trim().withMessage('Name is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      // Validate input
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

      const { email, name, password } = req.body;

      // Check if user already exists
      const existingUser = await getUserModel().getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'USER_EXISTS',
            message: 'User with this email already exists',
            timestamp: new Date().toISOString(),
            requestId: req.get('x-request-id') || 'unknown'
          }
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const userID = `user_${Date.now()}`;
      const newUser = await getUserModel().createUser({
        userID,
        email,
        name,
        password: hashedPassword,
        isVerified: false, // Require email verification
        preferredLanguage: 'en',
      });

      // Generate and store verification code
      const code = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes
      const db = DatabaseManager.getInstance().getDatabase();
      await db.run(
        'INSERT INTO VerificationCode (email, code, expiresAt) VALUES (?, ?, ?)',
        [email, code, expiresAt]
      );

      // Send verification email
      await sendVerificationEmail(email, code);

      return res.status(201).json({
        success: true,
        data: {
          email: newUser.email,
          requiresVerification: true,
        },
        message: 'Registration successful. Please check your email for verification code.'
      });

    } catch (error) {
      console.error('Register error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'REGISTRATION_FAILED',
          message: 'Failed to register',
          timestamp: new Date().toISOString(),
          requestId: req.get('x-request-id') || 'unknown'
        }
      });
    }
  }
);

/**
 * @route   POST /api/auth/verify-code
 * @desc    Verify email with 6-digit code
 * @access  Public
 */
router.post('/verify-code',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('code').isLength({ min: 6, max: 6 }).withMessage('6-digit code is required'),
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input data', details: errors.array() } });
      }

      const { email, code } = req.body;
      const db = DatabaseManager.getInstance().getDatabase();

      // Find valid code
      const record = await db.get(
        'SELECT * FROM VerificationCode WHERE email = ? AND code = ? AND used = 0 AND expiresAt > ? ORDER BY createdAt DESC LIMIT 1',
        [email, code, new Date().toISOString()]
      );

      if (!record) {
        return res.status(400).json({ success: false, error: { code: 'INVALID_CODE', message: 'Invalid or expired verification code' } });
      }

      // Mark code as used
      await db.run('UPDATE VerificationCode SET used = 1 WHERE id = ?', [record.id]);

      // Mark user as verified
      const user = await getUserModel().getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
      }

      await getUserModel().updateUser(user.userID, { isVerified: true } as any);

      // Generate JWT token for auto-login
      const token = jwt.sign(
        { userID: user.userID, email: user.email, name: user.name, isVerified: true, isAdmin: user.isAdmin },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        success: true,
        data: {
          token,
          user: { userID: user.userID, email: user.email, name: user.name, profileImage: user.profileImage, isVerified: true, isAdmin: user.isAdmin, preferredLanguage: user.preferredLanguage }
        },
        message: 'Email verified successfully'
      });
    } catch (error) {
      console.error('Verify code error:', error);
      return res.status(500).json({ success: false, error: { code: 'VERIFICATION_FAILED', message: 'Failed to verify code' } });
    }
  }
);

/**
 * @route   POST /api/auth/resend-code
 * @desc    Resend verification code
 * @access  Public
 */
router.post('/resend-code',
  [body('email').isEmail().withMessage('Valid email is required')],
  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input data' } });
      }

      const { email } = req.body;
      const user = await getUserModel().getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
      }

      if (user.isVerified) {
        return res.status(400).json({ success: false, error: { code: 'ALREADY_VERIFIED', message: 'Email is already verified' } });
      }

      // Invalidate old codes
      const db = DatabaseManager.getInstance().getDatabase();
      await db.run('UPDATE VerificationCode SET used = 1 WHERE email = ? AND used = 0', [email]);

      // Generate new code
      const code = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      await db.run('INSERT INTO VerificationCode (email, code, expiresAt) VALUES (?, ?, ?)', [email, code, expiresAt]);

      const sent = await sendVerificationEmail(email, code);
      if (!sent) {
        return res.status(500).json({ success: false, error: { code: 'EMAIL_FAILED', message: 'Failed to send verification email' } });
      }

      return res.json({ success: true, message: 'Verification code sent' });
    } catch (error) {
      console.error('Resend code error:', error);
      return res.status(500).json({ success: false, error: { code: 'RESEND_FAILED', message: 'Failed to resend code' } });
    }
  }
);

export default router;
