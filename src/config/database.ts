import sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';
import path from 'path';

export class DatabaseManager {
  private static instance: DatabaseManager;
  private db: Database | null = null;

  private constructor() {}

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public async initialize(): Promise<void> {
    try {
      const dbPath =
        process.env['NODE_ENV'] === 'test'
          ? ':memory:'
          : process.env['DATABASE_URL'] || path.join(process.cwd(), 'data', 'uniy_market.db');

      this.db = await open({
        filename: dbPath,
        driver: sqlite3.Database,
      });

      // Enable foreign keys
      await this.db.exec('PRAGMA foreign_keys = ON');

      // Production optimizations
      if (process.env['NODE_ENV'] === 'production') {
        await this.db.exec('PRAGMA journal_mode = WAL');
        await this.db.exec('PRAGMA synchronous = NORMAL');
        await this.db.exec('PRAGMA cache_size = -64000'); // 64MB cache
        await this.db.exec('PRAGMA temp_store = MEMORY');
        await this.db.exec('PRAGMA mmap_size = 30000000000'); // 30GB mmap
      }

      console.log(`Database connected: ${dbPath}`);

      // Initialize database schema
      await this.initializeSchema();
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  public getDatabase(): Database {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  public async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      console.log('Database connection closed');
    }
  }

  private async initializeSchema(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // Create tables based on the design document schema
    const schema = `
      -- User table
      CREATE TABLE IF NOT EXISTS User (
        userID TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        profileImage TEXT,
        isVerified BOOLEAN DEFAULT FALSE,
        preferredLanguage TEXT DEFAULT 'en',
        isAdmin BOOLEAN DEFAULT FALSE,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Student table
      CREATE TABLE IF NOT EXISTS Student (
        studentID TEXT PRIMARY KEY,
        userID TEXT NOT NULL,
        schoolName TEXT NOT NULL,
        grade TEXT,
        studentEmail TEXT UNIQUE NOT NULL,
        verificationDate DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userID) REFERENCES User(userID) ON DELETE CASCADE
      );

      -- Category table
      CREATE TABLE IF NOT EXISTS Category (
        catID INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        nameEn TEXT,
        nameTh TEXT,
        nameZh TEXT,
        description TEXT,
        isActive BOOLEAN DEFAULT TRUE
      );

      -- ProductListing table
      CREATE TABLE IF NOT EXISTS ProductListing (
        listingID TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        stock INTEGER DEFAULT 1,
        condition TEXT DEFAULT 'used' CHECK (condition IN ('new', 'used', 'like_new')),
        location TEXT,
        categoryID INTEGER NOT NULL,
        sellerID TEXT NOT NULL,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'inactive', 'reported')),
        views INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (categoryID) REFERENCES Category(catID),
        FOREIGN KEY (sellerID) REFERENCES User(userID) ON DELETE CASCADE
      );

      -- ProductImage table
      CREATE TABLE IF NOT EXISTS ProductImage (
        imageID TEXT PRIMARY KEY,
        listingID TEXT NOT NULL,
        imagePath TEXT NOT NULL,
        isPrimary BOOLEAN DEFAULT FALSE,
        uploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (listingID) REFERENCES ProductListing(listingID) ON DELETE CASCADE
      );

      -- Chat table
      CREATE TABLE IF NOT EXISTS Chat (
        chatID TEXT PRIMARY KEY,
        buyerID TEXT NOT NULL,
        sellerID TEXT NOT NULL,
        listingID TEXT NOT NULL,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'deleted')),
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        lastMessageAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (buyerID) REFERENCES User(userID) ON DELETE CASCADE,
        FOREIGN KEY (sellerID) REFERENCES User(userID) ON DELETE CASCADE,
        FOREIGN KEY (listingID) REFERENCES ProductListing(listingID) ON DELETE CASCADE
      );

      -- Message table
      CREATE TABLE IF NOT EXISTS Message (
        messageID TEXT PRIMARY KEY,
        chatID TEXT NOT NULL,
        senderID TEXT NOT NULL,
        messageText TEXT NOT NULL,
        messageType TEXT DEFAULT 'text' CHECK (messageType IN ('text', 'image')),
        isTranslated BOOLEAN DEFAULT FALSE,
        originalLanguage TEXT,
        translatedText TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        isRead BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (chatID) REFERENCES Chat(chatID) ON DELETE CASCADE,
        FOREIGN KEY (senderID) REFERENCES User(userID) ON DELETE CASCADE
      );

      -- Review table
      CREATE TABLE IF NOT EXISTS Review (
        reviewID TEXT PRIMARY KEY,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        reviewerID TEXT NOT NULL,
        targetUserID TEXT NOT NULL,
        dealID TEXT,
        reviewType TEXT NOT NULL CHECK (reviewType IN ('buyer_to_seller', 'seller_to_buyer')),
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (reviewerID) REFERENCES User(userID) ON DELETE CASCADE,
        FOREIGN KEY (targetUserID) REFERENCES User(userID) ON DELETE CASCADE,
        FOREIGN KEY (dealID) REFERENCES Deal(dealID) ON DELETE SET NULL
      );

      -- Deal table
      CREATE TABLE IF NOT EXISTS Deal (
        dealID TEXT PRIMARY KEY,
        listingID TEXT NOT NULL,
        buyerID TEXT NOT NULL,
        sellerID TEXT NOT NULL,
        transactionDate DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
        finalPrice DECIMAL(10,2),
        notes TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (listingID) REFERENCES ProductListing(listingID) ON DELETE CASCADE,
        FOREIGN KEY (buyerID) REFERENCES User(userID) ON DELETE CASCADE,
        FOREIGN KEY (sellerID) REFERENCES User(userID) ON DELETE CASCADE
      );

      -- Report table
      CREATE TABLE IF NOT EXISTS Report (
        reportID TEXT PRIMARY KEY,
        reporterID TEXT NOT NULL,
        targetItemID TEXT,
        targetUserID TEXT,
        reason TEXT NOT NULL CHECK (reason IN ('inappropriate_content', 'spam', 'fraud', 'harassment', 'other')),
        description TEXT,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
        adminNotes TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        reviewedAt DATETIME NULL,
        reviewedBy TEXT,
        FOREIGN KEY (reporterID) REFERENCES User(userID) ON DELETE CASCADE,
        FOREIGN KEY (targetItemID) REFERENCES ProductListing(listingID) ON DELETE SET NULL,
        FOREIGN KEY (targetUserID) REFERENCES User(userID) ON DELETE SET NULL,
        FOREIGN KEY (reviewedBy) REFERENCES User(userID) ON DELETE SET NULL
      );

      -- Favorite table
      CREATE TABLE IF NOT EXISTS Favorite (
        favID TEXT PRIMARY KEY,
        userID TEXT NOT NULL,
        listingID TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userID) REFERENCES User(userID) ON DELETE CASCADE,
        FOREIGN KEY (listingID) REFERENCES ProductListing(listingID) ON DELETE CASCADE,
        UNIQUE(userID, listingID)
      );

      -- UniversityWhitelist table
      CREATE TABLE IF NOT EXISTS UniversityWhitelist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        domain TEXT UNIQUE NOT NULL,
        universityName TEXT NOT NULL,
        country TEXT,
        isActive BOOLEAN DEFAULT TRUE,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- SensitiveWords table
      CREATE TABLE IF NOT EXISTS SensitiveWords (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word TEXT NOT NULL,
        language TEXT DEFAULT 'all',
        severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
        isActive BOOLEAN DEFAULT TRUE,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- AuditLog table
      CREATE TABLE IF NOT EXISTS AuditLog (
        logID TEXT PRIMARY KEY,
        adminID TEXT NOT NULL,
        action TEXT NOT NULL,
        targetType TEXT NOT NULL CHECK (targetType IN ('user', 'product', 'report', 'system')),
        targetID TEXT,
        details TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (adminID) REFERENCES User(userID) ON DELETE CASCADE
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_user_email ON User(email);
      CREATE INDEX IF NOT EXISTS idx_user_status ON User(status);
      CREATE INDEX IF NOT EXISTS idx_product_category ON ProductListing(categoryID);
      CREATE INDEX IF NOT EXISTS idx_product_seller ON ProductListing(sellerID);
      CREATE INDEX IF NOT EXISTS idx_product_status ON ProductListing(status);

      -- New reports table (lowercase, INTEGER ID) for reporting system
      CREATE TABLE IF NOT EXISTS reports (
        report_id INTEGER PRIMARY KEY AUTOINCREMENT,
        reporter_id INTEGER NOT NULL,
        reported_user_id INTEGER,
        product_id INTEGER,
        chat_id INTEGER,
        message_id INTEGER,
        report_type TEXT NOT NULL CHECK (report_type IN ('user', 'product', 'chat', 'message')),
        category TEXT NOT NULL CHECK (category IN ('inappropriate_content', 'spam', 'fraud', 'harassment', 'fake_product', 'other')),
        reason TEXT NOT NULL,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed')),
        admin_notes TEXT,
        reviewed_by INTEGER,
        reviewed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
      CREATE INDEX IF NOT EXISTS idx_reports_reported_user ON reports(reported_user_id);
      CREATE INDEX IF NOT EXISTS idx_reports_product ON reports(product_id);
      CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
      CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);

      CREATE INDEX IF NOT EXISTS idx_product_price ON ProductListing(price);
      CREATE INDEX IF NOT EXISTS idx_product_created ON ProductListing(createdAt);
      CREATE INDEX IF NOT EXISTS idx_product_image_listing ON ProductImage(listingID);
      CREATE INDEX IF NOT EXISTS idx_chat_buyer ON Chat(buyerID);
      CREATE INDEX IF NOT EXISTS idx_chat_seller ON Chat(sellerID);
      CREATE INDEX IF NOT EXISTS idx_chat_listing ON Chat(listingID);
      CREATE INDEX IF NOT EXISTS idx_message_chat ON Message(chatID);
      CREATE INDEX IF NOT EXISTS idx_message_timestamp ON Message(timestamp);
      CREATE INDEX IF NOT EXISTS idx_review_target_user ON Review(targetUserID);
      CREATE INDEX IF NOT EXISTS idx_review_type ON Review(reviewType);
      CREATE INDEX IF NOT EXISTS idx_deal_buyer ON Deal(buyerID);
      CREATE INDEX IF NOT EXISTS idx_deal_seller ON Deal(sellerID);
      CREATE INDEX IF NOT EXISTS idx_deal_listing ON Deal(listingID);
      CREATE INDEX IF NOT EXISTS idx_deal_status ON Deal(status);
      CREATE INDEX IF NOT EXISTS idx_report_status ON Report(status);
      CREATE INDEX IF NOT EXISTS idx_report_reporter ON Report(reporterID);
      CREATE INDEX IF NOT EXISTS idx_favorite_user ON Favorite(userID);
      CREATE INDEX IF NOT EXISTS idx_favorite_listing ON Favorite(listingID);
      CREATE INDEX IF NOT EXISTS idx_sensitive_word ON SensitiveWords(word);
      CREATE INDEX IF NOT EXISTS idx_sensitive_language ON SensitiveWords(language);
      CREATE INDEX IF NOT EXISTS idx_audit_admin ON AuditLog(adminID);
      CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON AuditLog(timestamp);
      CREATE INDEX IF NOT EXISTS idx_audit_target ON AuditLog(targetType, targetID);
    `;

    await this.db.exec(schema);

    // Insert default data
    await this.insertDefaultData();

    console.log('Database schema initialized successfully');
  }

  private async insertDefaultData(): Promise<void> {
    if (!this.db) return;

    // Insert default categories
    const categories = [
      {
        name: 'Electronics',
        nameEn: 'Electronics',
        nameTh: 'อิเล็กทรอนิกส์',
        nameZh: '电子产品',
      },
      { name: 'Books', nameEn: 'Books', nameTh: 'หนังสือ', nameZh: '书籍' },
      {
        name: 'Clothing',
        nameEn: 'Clothing',
        nameTh: 'เสื้อผ้า',
        nameZh: '服装',
      },
      {
        name: 'Furniture',
        nameEn: 'Furniture',
        nameTh: 'เฟอร์นิเจอร์',
        nameZh: '家具',
      },
      { name: 'Sports', nameEn: 'Sports', nameTh: 'กีฬา', nameZh: '体育用品' },
      { name: 'Other', nameEn: 'Other', nameTh: 'อื่นๆ', nameZh: '其他' },
    ];

    for (const category of categories) {
      await this.db.run(
        `INSERT OR IGNORE INTO Category (name, nameEn, nameTh, nameZh) 
         VALUES (?, ?, ?, ?)`,
        [category.name, category.nameEn, category.nameTh, category.nameZh]
      );
    }

    // Insert default university whitelist
    const universities = [
      {
        domain: 'student.mahidol.ac.th',
        universityName: 'Mahidol University',
        country: 'Thailand',
      },
      {
        domain: 'mahidol.ac.th',
        universityName: 'Mahidol University',
        country: 'Thailand',
      },
      { domain: 'gmail.com', universityName: 'Test Domain', country: 'Global' }, // For testing
    ];

    for (const university of universities) {
      await this.db.run(
        `INSERT OR IGNORE INTO UniversityWhitelist (domain, universityName, country) 
         VALUES (?, ?, ?)`,
        [university.domain, university.universityName, university.country]
      );
    }

    // Insert default sensitive words
    const sensitiveWords = [
      { word: 'spam', language: 'en', severity: 'medium' },
      { word: 'scam', language: 'en', severity: 'high' },
      { word: 'fraud', language: 'en', severity: 'high' },
      { word: 'fake', language: 'en', severity: 'medium' },
      { word: '诈骗', language: 'zh', severity: 'high' },
      { word: '假货', language: 'zh', severity: 'medium' },
      { word: 'โกง', language: 'th', severity: 'high' },
      { word: 'ปลอม', language: 'th', severity: 'medium' },
    ];

    for (const word of sensitiveWords) {
      await this.db.run(
        `INSERT OR IGNORE INTO SensitiveWords (word, language, severity) 
         VALUES (?, ?, ?)`,
        [word.word, word.language, word.severity]
      );
    }

    console.log('Default data inserted successfully');
  }
}
