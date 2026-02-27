import passport from 'passport';
import { Strategy as GoogleStrategy, StrategyOptions } from 'passport-google-oauth20';
import { UserModel } from '../models/UserModel';

export interface GoogleProfile {
  id: string;
  emails: Array<{ value: string; verified: boolean }>;
  name: {
    givenName: string;
    familyName: string;
  };
  photos: Array<{ value: string }>;
}

export interface AuthUser {
  userID: string;
  email: string;
  name: string;
  profileImage?: string;
  isVerified: boolean;
  preferredLanguage: string;
  isAdmin: boolean;
}

export class AuthConfig {
  private userModel: UserModel | null = null;

  constructor() {
    this.initializePassport();
  }

  private getUserModel(): UserModel {
    if (!this.userModel) {
      this.userModel = new UserModel();
    }
    return this.userModel;
  }

  private initializePassport(): void {
    // Google OAuth Strategy
    const strategyOptions: StrategyOptions = {
      clientID: process.env['GOOGLE_CLIENT_ID'] || '',
      clientSecret: process.env['GOOGLE_CLIENT_SECRET'] || '',
      callbackURL: process.env['GOOGLE_CALLBACK_URL'] || '/api/auth/google/callback',
    };

    passport.use(
      new GoogleStrategy(
        strategyOptions,
        async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
          try {
            const email = profile.emails[0]?.value;
            if (!email) {
              return done(new Error('No email found in Google profile'), false);
            }

            // Check if user already exists
            let user = await this.getUserModel().getUserByEmail(email);

            if (user) {
              // Update existing user's profile information
              const updatedUser = await this.getUserModel().updateUser(user.userID, {
                name: `${profile.name.givenName} ${profile.name.familyName}`,
                ...(profile.photos[0]?.value && { profileImage: profile.photos[0].value }),
              });
              return done(null, updatedUser);
            } else {
              // Create new user
              const newUser = await this.getUserModel().createUser({
                email,
                name: `${profile.name.givenName} ${profile.name.familyName}`,
                ...(profile.photos[0]?.value && { profileImage: profile.photos[0].value }),
                phone: '',
                isVerified: false, // Will be verified after university email check
                preferredLanguage: 'en',
                isAdmin: false,
                status: 'active',
              });
              return done(null, newUser);
            }
          } catch (error) {
            console.error('Google OAuth error:', error);
            return done(error, false);
          }
        }
      )
    );

    // Serialize user for session
    passport.serializeUser((user: any, done) => {
      done(null, user.userID);
    });

    // Deserialize user from session
    passport.deserializeUser(async (userID: string, done) => {
      try {
        const user = await this.getUserModel().getUserById(userID);
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    });
  }

  public getPassport() {
    return passport;
  }
}