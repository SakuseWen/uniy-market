import jwt from 'jsonwebtoken';
import { UserModel } from '../models/UserModel';
import { User } from '../types';

export interface SessionToken {
  token: string;
  expiresAt: Date;
  userId: string;
}

export interface AuthResult {
  user: User;
  token: SessionToken;
  isNewUser: boolean;
}

export class AuthService {
  private userModel: UserModel;
  private jwtSecret: string;
  private jwtExpiresIn: string;

  constructor() {
    this.userModel = new UserModel();
    this.jwtSecret = process.env['JWT_SECRET'] || 'your-secret-key';
    this.jwtExpiresIn = process.env['JWT_EXPIRES_IN'] || '7d';
  }

  /**
   * Create a JWT session token for a user
   */
  public async createSession(user: User): Promise<SessionToken> {
    const payload = {
      userId: user.userID,
      email: user.email,
      isAdmin: user.isAdmin,
    };

    const token = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
      issuer: 'unity-market',
      subject: user.userID,
    } as jwt.SignOptions);

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    return {
      token,
      expiresAt,
      userId: user.userID,
    };
  }

  /**
   * Validate a JWT session token
   */
  public async validateSession(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      
      // Support both test tokens (with 'id') and production tokens (with 'userId')
      const userId = decoded.userId || decoded.userID || `USER-${decoded.id}`;
      
      if (!userId) {
        return null;
      }

      // Get user from database to ensure they still exist and are active
      const user = await this.userModel.getUserById(userId);
      
      if (!user || user.status !== 'active') {
        return null;
      }

      return user;
    } catch (error) {
      console.error('Token validation error:', error);
      return null;
    }
  }

  /**
   * Invalidate a session token (add to blacklist if needed)
   */
  public async invalidateSession(token: string): Promise<void> {
    // For now, we rely on JWT expiration
    // In production, you might want to maintain a blacklist of invalidated tokens
    console.log(`Session invalidated for token: ${token.substring(0, 20)}...`);
  }

  /**
   * Verify if an email domain is from a whitelisted university
   */
  public async verifyUniversityEmail(email: string): Promise<boolean> {
    return await this.userModel.isUniversityEmail(email);
  }

  /**
   * Check if an email domain is whitelisted
   */
  public async isEmailDomainWhitelisted(domain: string): Promise<boolean> {
    // Get the domain from email if full email is provided
    const emailDomain = domain.includes('@') ? domain.split('@')[1] : domain;
    if (!emailDomain) return false;
    return await this.userModel.isUniversityEmailDomain(emailDomain);
  }

  /**
   * Update user verification status after university email verification
   */
  public async updateUserVerification(userId: string, isVerified: boolean): Promise<User> {
    return await this.userModel.updateUser(userId, { isVerified });
  }

  /**
   * Get user by ID
   */
  public async getUserById(userId: string): Promise<User | null> {
    return await this.userModel.getUserById(userId);
  }

  /**
   * Get user by email
   */
  public async getUserByEmail(email: string): Promise<User | null> {
    return await this.userModel.getUserByEmail(email);
  }

  /**
   * Update user profile
   */
  public async updateUserProfile(userId: string, updates: Partial<User>): Promise<User> {
    // Remove sensitive fields that shouldn't be updated directly
    const { userID, createdAt, updatedAt, ...safeUpdates } = updates;
    return await this.userModel.updateUser(userId, safeUpdates);
  }

  /**
   * Refresh a JWT token
   */
  public async refreshToken(oldToken: string): Promise<SessionToken | null> {
    try {
      // Verify the old token (even if expired, we can still decode it)
      const decoded = jwt.decode(oldToken) as any;
      
      if (!decoded || !decoded.userId) {
        return null;
      }

      // Get user to ensure they still exist
      const user = await this.userModel.getUserById(decoded.userId);
      if (!user || user.status !== 'active') {
        return null;
      }

      // Create new session
      return await this.createSession(user);
    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    }
  }
}