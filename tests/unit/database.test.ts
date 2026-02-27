import { DatabaseManager } from '../../src/config/database';

describe('DatabaseManager', () => {
  let dbManager: DatabaseManager;

  beforeEach(async () => {
    dbManager = DatabaseManager.getInstance();
    await dbManager.initialize();
  });

  afterEach(async () => {
    await dbManager.close();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = DatabaseManager.getInstance();
      const instance2 = DatabaseManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Database Schema Integrity', () => {
    it('should have all required tables created', async () => {
      const db = dbManager.getDatabase();
      
      // List of all expected tables
      const expectedTables = [
        'User', 'Student', 'Category', 'ProductListing', 'ProductImage',
        'Chat', 'Message', 'Review', 'Deal', 'Report', 'Favorite',
        'UniversityWhitelist', 'SensitiveWords', 'AuditLog'
      ];
      
      // Query to get all table names
      const tables = await db.all(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      );
      
      const tableNames = tables.map(table => table.name);
      
      // Verify all expected tables exist
      for (const expectedTable of expectedTables) {
        expect(tableNames).toContain(expectedTable);
      }
      
      // Allow for additional tables (like Notification) that may be created
      expect(tableNames.length).toBeGreaterThanOrEqual(expectedTables.length);
    });

    it('should have proper foreign key constraints', async () => {
      const db = dbManager.getDatabase();
      
      // Test foreign key constraint by trying to insert invalid data
      await expect(
        db.run(
          'INSERT INTO Student (studentID, userID, schoolName, studentEmail) VALUES (?, ?, ?, ?)',
          ['test-student', 'non-existent-user', 'Test School', 'test@test.com']
        )
      ).rejects.toThrow();
    });

    it('should have proper indexes created', async () => {
      const db = dbManager.getDatabase();
      
      // Query to get all indexes
      const indexes = await db.all(
        "SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'"
      );
      
      const indexNames = indexes.map(index => index.name);
      
      // Verify some key indexes exist
      expect(indexNames).toContain('idx_user_email');
      expect(indexNames).toContain('idx_product_category');
      expect(indexNames).toContain('idx_chat_buyer');
      expect(indexNames).toContain('idx_message_chat');
    });

    it('should have default sensitive words inserted', async () => {
      const db = dbManager.getDatabase();
      
      const sensitiveWords = await db.all('SELECT * FROM SensitiveWords WHERE isActive = 1');
      
      expect(sensitiveWords.length).toBeGreaterThan(0);
      
      // Check for some expected words
      const words = sensitiveWords.map(sw => sw.word);
      expect(words).toContain('spam');
      expect(words).toContain('scam');
      expect(words).toContain('fraud');
    });
  });

  describe('Database Operations', () => {
    it('should initialize database successfully', async () => {
      // Database is already initialized in beforeEach
      const db = dbManager.getDatabase();
      expect(db).toBeDefined();
    });

    it('should get database instance after initialization', async () => {
      const db = dbManager.getDatabase();
      expect(db).toBeDefined();
    });

    it('should throw error when getting database before initialization', () => {
      const freshManager = Object.create(DatabaseManager.prototype);
      expect(() => freshManager.getDatabase()).toThrow(
        'Database not initialized. Call initialize() first.'
      );
    });

    it('should verify database schema exists', async () => {
      const db = dbManager.getDatabase();
      
      // Check if User table exists
      const userTable = await db.get(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='User'"
      );
      expect(userTable).toBeDefined();
      expect(userTable.name).toBe('User');

      // Check if Category table exists
      const categoryTable = await db.get(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='Category'"
      );
      expect(categoryTable).toBeDefined();
      expect(categoryTable.name).toBe('Category');
    });

    it('should have default categories inserted', async () => {
      const db = dbManager.getDatabase();
      
      const categories = await db.all('SELECT * FROM Category');
      expect(categories.length).toBeGreaterThan(0);
      
      const electronicsCategory = categories.find(cat => cat.name === 'Electronics');
      expect(electronicsCategory).toBeDefined();
    });

    it('should have university whitelist entries', async () => {
      const db = dbManager.getDatabase();
      
      const universities = await db.all('SELECT * FROM UniversityWhitelist');
      expect(universities.length).toBeGreaterThan(0);
      
      const mahidolEntry = universities.find(uni => uni.domain === 'student.mahidol.ac.th');
      expect(mahidolEntry).toBeDefined();
    });
  });
});