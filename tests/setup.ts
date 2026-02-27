import { DatabaseManager } from '../src/config/database';

// Global test setup
beforeAll(async () => {
  // Set test environment
  process.env['NODE_ENV'] = 'test';
  
  // Set mock Google OAuth credentials for testing
  process.env['GOOGLE_CLIENT_ID'] = 'test-client-id';
  process.env['GOOGLE_CLIENT_SECRET'] = 'test-client-secret';
  process.env['GOOGLE_CALLBACK_URL'] = 'http://localhost:3000/api/auth/google/callback';
  
  // Initialize test database
  const dbManager = DatabaseManager.getInstance();
  await dbManager.initialize();
});

afterAll(async () => {
  // Clean up test database
  const dbManager = DatabaseManager.getInstance();
  await dbManager.close();
});

// Global test timeout
jest.setTimeout(10000);