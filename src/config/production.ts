/**
 * Production Configuration
 * Handles production-specific settings and environment validation
 */

export interface ProductionConfig {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  sessionSecret: string;
  googleClientId: string;
  googleClientSecret: string;
  googleCallbackUrl: string;
  frontendUrl: string;
  googleTranslateApiKey: string;
  googleMapsApiKey: string;
  maxFileSize: number;
  uploadPath: string;
  corsOrigin: string[];
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
}

/**
 * Validate required environment variables
 */
export const validateEnvironment = (): void => {
  const requiredVars = [
    'JWT_SECRET',
    'SESSION_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
  ];

  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }

  // Validate JWT secret strength in production
  if (process.env['NODE_ENV'] === 'production') {
    const jwtSecret = process.env['JWT_SECRET'] || '';
    if (jwtSecret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters in production');
    }

    const sessionSecret = process.env['SESSION_SECRET'] || '';
    if (sessionSecret.length < 32) {
      throw new Error('SESSION_SECRET must be at least 32 characters in production');
    }
  }
};

/**
 * Get production configuration
 */
export const getProductionConfig = (): ProductionConfig => {
  validateEnvironment();

  return {
    port: parseInt(process.env['PORT'] || '3000', 10),
    nodeEnv: process.env['NODE_ENV'] || 'development',
    databaseUrl: process.env['DATABASE_URL'] || './data/unity_market.db',
    jwtSecret: process.env['JWT_SECRET'] || '',
    jwtExpiresIn: process.env['JWT_EXPIRES_IN'] || '7d',
    sessionSecret: process.env['SESSION_SECRET'] || '',
    googleClientId: process.env['GOOGLE_CLIENT_ID'] || '',
    googleClientSecret: process.env['GOOGLE_CLIENT_SECRET'] || '',
    googleCallbackUrl: process.env['GOOGLE_CALLBACK_URL'] || 'http://localhost:3000/api/auth/google/callback',
    frontendUrl: process.env['FRONTEND_URL'] || 'http://localhost:3000',
    googleTranslateApiKey: process.env['GOOGLE_TRANSLATE_API_KEY'] || '',
    googleMapsApiKey: process.env['GOOGLE_MAPS_API_KEY'] || '',
    maxFileSize: parseInt(process.env['MAX_FILE_SIZE'] || '10485760', 10),
    uploadPath: process.env['UPLOAD_PATH'] || './public/uploads',
    corsOrigin: process.env['CORS_ORIGIN']?.split(',') || ['http://localhost:3000'],
    rateLimitWindowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000', 10), // 15 minutes
    rateLimitMaxRequests: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100', 10),
  };
};

/**
 * Get database configuration for production
 */
export const getDatabaseConfig = () => {
  const config = getProductionConfig();
  
  return {
    url: config.databaseUrl,
    options: {
      // Enable WAL mode for better concurrency
      pragma: {
        journal_mode: 'WAL',
        synchronous: 'NORMAL',
        cache_size: -64000, // 64MB cache
        temp_store: 'MEMORY',
        mmap_size: 30000000000, // 30GB mmap
      },
    },
  };
};

/**
 * Production-specific logging configuration
 */
export const getLoggingConfig = () => {
  const isProduction = process.env['NODE_ENV'] === 'production';
  
  return {
    level: isProduction ? 'info' : 'debug',
    format: isProduction ? 'json' : 'combined',
    silent: process.env['NODE_ENV'] === 'test',
  };
};
