import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/UserModel';

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
            message: 'Your account is not verified. Please verify your university email.',
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

      // Verify university email
      const universityDomains = ['@university.edu', '@student.edu', '@alumni.edu'];
      const isUniversityEmail = universityDomains.some(domain => email.endsWith(domain));

      if (!isUniversityEmail) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_EMAIL_DOMAIN',
            message: 'Only university email addresses are allowed',
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
        isVerified: true, // Auto-verify university email
        preferredLanguage: 'en',
      });

      // Generate JWT token
      const token = jwt.sign(
        {
          userID: newUser.userID,
          email: newUser.email,
          name: newUser.name,
          isVerified: newUser.isVerified,
          isAdmin: newUser.isAdmin,
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(201).json({
        success: true,
        data: {
          token,
          user: {
            userID: newUser.userID,
            email: newUser.email,
            name: newUser.name,
            profileImage: newUser.profileImage,
            isVerified: newUser.isVerified,
            isAdmin: newUser.isAdmin,
            preferredLanguage: newUser.preferredLanguage,
          }
        },
        message: 'Registration successful'
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

export default router;
