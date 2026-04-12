import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { UserModel } from '../models/UserModel';
import { DatabaseManager } from '../config/database';
import { generateVerificationCode, sendVerificationEmail } from '../services/emailService';
import { authenticateToken, requireActiveUser } from '../middleware/auth';

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
      // Suspended users who were previously verified can still login (with restricted access)
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
          status: user.status,
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
            bio: user.bio,
            eduVerified: !!(user.eduVerified),
            eduEmail: user.eduEmail || null,
            isVerified: !!user.isVerified,
            isAdmin: !!user.isAdmin,
            preferredLanguage: user.preferredLanguage,
            status: user.status,
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

      // Check if user already exists (only verified users block re-registration)
      const existingUser = await getUserModel().getUserByEmail(email);
      if (existingUser && existingUser.isVerified) {
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

      // If unverified user exists, delete it so they can re-register
      if (existingUser && !existingUser.isVerified) {
        const db = DatabaseManager.getInstance().getDatabase();
        await db.run('DELETE FROM User WHERE userID = ?', [existingUser.userID]);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Don't create user yet - store registration data in VerificationCode metadata
      const code = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes
      const db = DatabaseManager.getInstance().getDatabase();

      // Invalidate old codes for this email
      await db.run('UPDATE VerificationCode SET used = 1 WHERE email = ? AND used = 0', [email]);

      const metadata = JSON.stringify({ name, password: hashedPassword });
      await db.run(
        'INSERT INTO VerificationCode (email, code, metadata, expiresAt) VALUES (?, ?, ?, ?)',
        [email, code, metadata, expiresAt]
      );

      // Send verification email
      await sendVerificationEmail(email, code);

      return res.status(201).json({
        success: true,
        data: {
          email,
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

      // Check if this is a registration verification (has metadata) or other verification
      let user = await getUserModel().getUserByEmail(email);

      if (!user && record.metadata) {
        // Registration flow: create user now
        const meta = JSON.parse(record.metadata);
        const userID = `user_${Date.now()}`;
        user = await getUserModel().createUser({
          userID,
          email,
          name: meta.name,
          password: meta.password,
          isVerified: true,
          preferredLanguage: 'en',
        });
      } else if (user && !user.isVerified) {
        // Existing unverified user (legacy) - mark as verified
        await getUserModel().updateUser(user.userID, { isVerified: true } as any);
        user = { ...user, isVerified: true };
      } else if (!user) {
        return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
      }

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
          user: { userID: user.userID, email: user.email, name: user.name, profileImage: user.profileImage, bio: (user as any).bio, eduVerified: (user as any).eduVerified || false, eduEmail: (user as any).eduEmail || null, isVerified: true, isAdmin: user.isAdmin, preferredLanguage: user.preferredLanguage }
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
      const db = DatabaseManager.getInstance().getDatabase();

      // Check if there's a pending verification for this email
      const pendingCode = await db.get(
        'SELECT * FROM VerificationCode WHERE email = ? AND used = 0 ORDER BY createdAt DESC LIMIT 1',
        [email]
      );

      // Also check if user already exists and is verified
      const user = await getUserModel().getUserByEmail(email);
      if (user && user.isVerified) {
        return res.status(400).json({ success: false, error: { code: 'ALREADY_VERIFIED', message: 'Email is already verified' } });
      }

      if (!pendingCode && !user) {
        return res.status(404).json({ success: false, error: { code: 'NO_PENDING_REGISTRATION', message: 'No pending registration found for this email' } });
      }

      // Invalidate old codes but preserve metadata from the latest one
      const latestCode = await db.get(
        'SELECT metadata FROM VerificationCode WHERE email = ? AND metadata IS NOT NULL ORDER BY createdAt DESC LIMIT 1',
        [email]
      );
      await db.run('UPDATE VerificationCode SET used = 1 WHERE email = ? AND used = 0', [email]);

      // Generate new code, carry over metadata
      const code = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      await db.run(
        'INSERT INTO VerificationCode (email, code, metadata, expiresAt) VALUES (?, ?, ?, ?)',
        [email, code, latestCode?.metadata || null, expiresAt]
      );

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

/**
 * @route   POST /api/auth/delete-account/send-code
 * @desc    Send verification code for account deletion
 * @access  Private
 */
router.post('/delete-account/send-code', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    const db = DatabaseManager.getInstance().getDatabase();

    // Invalidate old codes
    await db.run('UPDATE VerificationCode SET used = 1 WHERE email = ? AND used = 0', [user.email]);

    // Generate new code
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    await db.run('INSERT INTO VerificationCode (email, code, expiresAt) VALUES (?, ?, ?)', [user.email, code, expiresAt]);

    const sent = await sendVerificationEmail(user.email, code);
    if (!sent) {
      return res.status(500).json({ success: false, error: { code: 'EMAIL_FAILED', message: 'Failed to send verification email' } });
    }

    return res.json({ success: true, message: 'Verification code sent' });
  } catch (error) {
    console.error('Delete account send code error:', error);
    return res.status(500).json({ success: false, error: { code: 'SEND_CODE_FAILED', message: 'Failed to send code' } });
  }
});

/**
 * @route   POST /api/auth/delete-account/confirm
 * @desc    Confirm account deletion with verification code
 * @access  Private
 */
router.post('/delete-account/confirm',
  authenticateToken,
  [body('code').isLength({ min: 6, max: 6 }).withMessage('6-digit code is required')],
  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid code' } });
      }

      const user = (req as any).user;
      const { code } = req.body;
      const db = DatabaseManager.getInstance().getDatabase();

      // Verify code
      const record = await db.get(
        'SELECT * FROM VerificationCode WHERE email = ? AND code = ? AND used = 0 AND expiresAt > ? ORDER BY createdAt DESC LIMIT 1',
        [user.email, code, new Date().toISOString()]
      );
      if (!record) {
        return res.status(400).json({ success: false, error: { code: 'INVALID_CODE', message: 'Invalid or expired verification code' } });
      }

      // Mark code as used
      await db.run('UPDATE VerificationCode SET used = 1 WHERE id = ?', [record.id]);

      // Delete avatar file from disk
      if (user.profileImage && user.profileImage.startsWith('/uploads/avatars/')) {
        try { fs.unlinkSync(path.join(__dirname, '../../public', user.profileImage)); } catch (_e) { /* ignore */ }
      }

      // Delete product image files from disk
      const productImages = await db.all(
        `SELECT pi.imagePath FROM ProductImage pi
         JOIN ProductListing pl ON pi.listingID = pl.listingID
         WHERE pl.sellerID = ?`, [user.userID]
      );
      for (const img of productImages) {
        if (img.imagePath) {
          try { fs.unlinkSync(path.join(__dirname, '../../public', img.imagePath)); } catch (_e) { /* ignore */ }
        }
      }

      // Hard delete user - CASCADE will handle related records
      await db.run('DELETE FROM User WHERE userID = ?', [user.userID]);

      // Also clean up verification codes
      await db.run('DELETE FROM VerificationCode WHERE email = ?', [user.email]);

      return res.json({ success: true, message: 'Account deleted successfully' });
    } catch (error) {
      console.error('Delete account confirm error:', error);
      return res.status(500).json({ success: false, error: { code: 'DELETE_FAILED', message: 'Failed to delete account' } });
    }
  }
);

/**
 * @route   POST /api/auth/edu-verify/send-code
 * @desc    Send verification code to education email
 * @access  Private
 */
router.post('/edu-verify/send-code',
  authenticateToken,
  requireActiveUser,
  [body('eduEmail').isEmail().withMessage('Valid education email is required')],
  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid email' } });
      }

      const user = (req as any).user;
      const { eduEmail } = req.body;

      // Check if already edu verified
      if (user.eduVerified) {
        return res.status(400).json({ success: false, error: { code: 'ALREADY_EDU_VERIFIED', message: 'Education already verified' } });
      }

      // Check if email domain looks like an education domain
      const domain = eduEmail.split('@')[1]?.toLowerCase() || '';
      const eduDomains = ['.edu', '.ac.', '.edu.', '.school', '.university'];
      const isEduDomain = eduDomains.some((d: string) => domain.includes(d));
      if (!isEduDomain) {
        return res.status(400).json({ success: false, error: { code: 'NOT_EDU_EMAIL', message: 'This does not appear to be an education email address' } });
      }

      const db = DatabaseManager.getInstance().getDatabase();

      // Check if this edu email is already verified by another account
      const existingEdu = await db.get(
        'SELECT userID FROM User WHERE eduEmail = ? AND eduVerified = 1 AND userID != ?',
        [eduEmail, user.userID]
      );
      if (existingEdu) {
        return res.status(400).json({ success: false, error: { code: 'EDU_EMAIL_ALREADY_USED', message: 'This education email is already verified by another account' } });
      }

      // Invalidate old codes
      await db.run('UPDATE VerificationCode SET used = 1 WHERE email = ? AND used = 0', [eduEmail]);

      // Generate and send code
      const code = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const metadata = JSON.stringify({ type: 'edu_verify', userID: user.userID });
      await db.run(
        'INSERT INTO VerificationCode (email, code, metadata, expiresAt) VALUES (?, ?, ?, ?)',
        [eduEmail, code, metadata, expiresAt]
      );

      const sent = await sendVerificationEmail(eduEmail, code);
      if (!sent) {
        return res.status(500).json({ success: false, error: { code: 'EMAIL_FAILED', message: 'Failed to send verification email' } });
      }

      return res.json({ success: true, message: 'Verification code sent to education email' });
    } catch (error) {
      console.error('Edu verify send code error:', error);
      return res.status(500).json({ success: false, error: { code: 'SEND_CODE_FAILED', message: 'Failed to send code' } });
    }
  }
);

/**
 * @route   POST /api/auth/edu-verify/confirm
 * @desc    Confirm education email verification
 * @access  Private
 */
router.post('/edu-verify/confirm',
  authenticateToken,
  requireActiveUser,
  [
    body('eduEmail').isEmail().withMessage('Valid education email is required'),
    body('code').isLength({ min: 6, max: 6 }).withMessage('6-digit code is required'),
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input' } });
      }

      const user = (req as any).user;
      const { eduEmail, code } = req.body;
      const db = DatabaseManager.getInstance().getDatabase();

      // Verify code
      const record = await db.get(
        'SELECT * FROM VerificationCode WHERE email = ? AND code = ? AND used = 0 AND expiresAt > ? ORDER BY createdAt DESC LIMIT 1',
        [eduEmail, code, new Date().toISOString()]
      );
      if (!record) {
        return res.status(400).json({ success: false, error: { code: 'INVALID_CODE', message: 'Invalid or expired verification code' } });
      }

      // Mark code as used
      await db.run('UPDATE VerificationCode SET used = 1 WHERE id = ?', [record.id]);

      // Check if this edu email is already verified by another account
      const existingEdu = await db.get(
        'SELECT userID FROM User WHERE eduEmail = ? AND eduVerified = 1 AND userID != ?',
        [eduEmail, user.userID]
      );
      if (existingEdu) {
        return res.status(400).json({ success: false, error: { code: 'EDU_EMAIL_ALREADY_USED', message: 'This education email is already verified by another account' } });
      }

      // Update user edu verification status
      await getUserModel().updateUser(user.userID, { eduVerified: true, eduEmail } as any);

      const updatedUser = await getUserModel().getUserById(user.userID);

      return res.json({
        success: true,
        data: {
          user: {
            userID: updatedUser!.userID,
            email: updatedUser!.email,
            name: updatedUser!.name,
            profileImage: updatedUser!.profileImage,
            bio: updatedUser!.bio,
            eduVerified: true,
            eduEmail,
            isVerified: updatedUser!.isVerified,
            isAdmin: updatedUser!.isAdmin,
            preferredLanguage: updatedUser!.preferredLanguage,
          }
        },
        message: 'Education email verified successfully'
      });
    } catch (error) {
      console.error('Edu verify confirm error:', error);
      return res.status(500).json({ success: false, error: { code: 'VERIFICATION_FAILED', message: 'Failed to verify education email' } });
    }
  }
);

/**
 * GET /api/auth/me
 * Get current user info (refreshes from DB)
 */
router.get('/me', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const authUser = (req as any).user;
    if (!authUser?.userID) return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });

    const user = await getUserModel().getUserById(authUser.userID);
    if (!user) return res.status(404).json({ success: false, error: { message: 'User not found' } });

    return res.json({
      success: true,
      data: {
        userID: user.userID,
        email: user.email,
        name: user.name,
        profileImage: user.profileImage,
        bio: (user as any).bio,
        eduVerified: !!(user as any).eduVerified,
        eduEmail: (user as any).eduEmail || null,
        isVerified: !!user.isVerified,
        isAdmin: !!user.isAdmin,
        preferredLanguage: user.preferredLanguage,
        status: (user as any).status,
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: { message: 'Failed to get user info' } });
  }
});

export default router;
