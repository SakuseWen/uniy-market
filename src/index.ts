import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';

import { DatabaseManager } from './config/database';
import { AuthConfig } from './config/auth';
import { getProductionConfig, validateEnvironment, getLoggingConfig } from './config/production';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { errorBoundary, handleUnhandledRejection, handleUncaughtException } from './middleware/errorBoundary';
import { WebSocketService } from './services/WebSocketService';
import { apiLimiter, authLimiter, adminLimiter } from './middleware/rateLimiter';
import { sanitizeAll, preventParameterPollution } from './middleware/sanitization';
import { securityHeaders, contentSecurityPolicy, attachCsrfToken } from './middleware/security';

// Import routes
import authRoutes from './routes/auth';
import testAuthRoutes from './routes/testAuth';
// import universityRoutes from './routes/university'; // Temporarily disabled due to TS errors
import productRoutes from './routes/product';
import languageRoutes from './routes/language';
import chatRoutes from './routes/chat';
import reviewRoutes from './routes/review';
import reputationRoutes from './routes/reputation';
import dealRoutes from './routes/deal';
import locationRoutes from './routes/location';
import reportRoutes from './routes/report';
import favoriteRoutes from './routes/favorite';
import adminRoutes from './routes/admin';

// Load environment variables
dotenv.config();

// Validate environment variables
try {
  validateEnvironment();
} catch (error) {
  console.error('Environment validation failed:', error);
  if (process.env['NODE_ENV'] === 'production') {
    process.exit(1);
  }
}

// Setup global error handlers
handleUnhandledRejection();
handleUncaughtException();

const app = express();
const httpServer = createServer(app);
const config = getProductionConfig();
const loggingConfig = getLoggingConfig();
const PORT = config.port;

// Initialize WebSocket service
let webSocketService: WebSocketService;

// Initialize authentication configuration
const authConfig = new AuthConfig();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: process.env['NODE_ENV'] === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://maps.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "ws:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  } : false,
  crossOriginEmbedderPolicy: false,
}));

// Additional security headers
app.use(securityHeaders);

// Content Security Policy
if (config.nodeEnv === 'production') {
  app.use(contentSecurityPolicy);
}

app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Session middleware for Passport
app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.nodeEnv === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: config.nodeEnv === 'production' ? 'strict' : 'lax',
  }
}));

// Cookie parser middleware
app.use(cookieParser());

// Passport middleware
app.use(authConfig.getPassport().initialize());
app.use(authConfig.getPassport().session());

// Logging middleware
if (!loggingConfig.silent) {
  app.use(morgan(loggingConfig.format));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization
app.use(sanitizeAll);

// Prevent parameter pollution
app.use(preventParameterPollution);

// CSRF token attachment
app.use(attachCsrfToken);

// Static files
app.use('/public', express.static(path.join(__dirname, '../public')));

// Serve app.html as the main application
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/app.html'));
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Uniy Market API',
  });
});

// API routes will be added here
app.get('/api', (_req, res) => {
  res.json({
    message: 'Uniy Market API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
      auth: '/api/auth',
      university: '/api/university',
      products: '/api/products',
      language: '/api/language',
      chats: '/api/chats',
      reviews: '/api/reviews',
      reputation: '/api/reputation',
      deals: '/api/deals',
      location: '/api/location',
      reports: '/api/reports',
      favorites: '/api/favorites',
      admin: '/api/admin'
    },
  });
});

// Mount API routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/test-auth', testAuthRoutes); // Test authentication routes (development only)
// app.use('/api/university', universityRoutes); // Temporarily disabled due to TS errors
app.use('/api/products', apiLimiter, productRoutes);
app.use('/api/language', apiLimiter, languageRoutes);
app.use('/api/chats', apiLimiter, chatRoutes);
app.use('/api/reviews', apiLimiter, reviewRoutes);
app.use('/api/reputation', apiLimiter, reputationRoutes);
app.use('/api/deals', apiLimiter, dealRoutes);
app.use('/api/location', apiLimiter, locationRoutes);
app.use('/api/reports', apiLimiter, reportRoutes);
app.use('/api/favorites', apiLimiter, favoriteRoutes);
app.use('/api/admin', adminLimiter, adminRoutes);

// Error handling middleware
app.use(notFoundHandler);
app.use(errorBoundary);
app.use(errorHandler);

// Initialize database and start server
async function startServer(): Promise<void> {
  try {
    // Initialize database
    const dbManager = DatabaseManager.getInstance();
    await dbManager.initialize();
    
    console.log('Database initialized successfully');

    // Initialize WebSocket service
    webSocketService = new WebSocketService(httpServer);
    console.log('WebSocket service initialized successfully');

    // Start server
    httpServer.listen(PORT, () => {
      console.log(`🚀 Uniy Market server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API endpoint: http://localhost:${PORT}/api`);
      console.log(`🔌 WebSocket server ready`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  if (webSocketService) {
    await webSocketService.shutdown();
  }
  const dbManager = DatabaseManager.getInstance();
  await dbManager.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  if (webSocketService) {
    await webSocketService.shutdown();
  }
  const dbManager = DatabaseManager.getInstance();
  await dbManager.close();
  process.exit(0);
});

// Start the server
if (require.main === module) {
  startServer();
}

export { app, httpServer, webSocketService };