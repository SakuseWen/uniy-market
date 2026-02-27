import { Database } from 'sqlite';
import { DatabaseManager } from '../config/database';

export abstract class BaseModel {
  protected db: Database;

  constructor() {
    // Lazy initialization - get database when first accessed
    const dbManager = DatabaseManager.getInstance();
    try {
      this.db = dbManager.getDatabase();
    } catch (error) {
      // Database not initialized yet - will be set later
      this.db = null as any;
    }
  }

  /**
   * Get database instance (lazy initialization)
   */
  protected getDb(): Database {
    if (!this.db) {
      this.db = DatabaseManager.getInstance().getDatabase();
    }
    return this.db;
  }

  /**
   * Generate a unique ID for database records
   */
  protected generateId(prefix: string = ''): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}${timestamp}${random}`;
  }

  /**
   * Execute a query with parameters
   */
  protected async query(sql: string, params: any[] = []): Promise<any[]> {
    return await this.getDb().all(sql, params);
  }

  /**
   * Execute a single query and return first result
   */
  protected async queryOne(sql: string, params: any[] = []): Promise<any> {
    return await this.getDb().get(sql, params);
  }

  /**
   * Execute an insert/update/delete query
   */
  protected async execute(sql: string, params: any[] = []): Promise<any> {
    return await this.getDb().run(sql, params);
  }

  /**
   * Begin a database transaction
   */
  protected async beginTransaction(): Promise<void> {
    await this.getDb().exec('BEGIN TRANSACTION');
  }

  /**
   * Commit a database transaction
   */
  protected async commitTransaction(): Promise<void> {
    await this.getDb().exec('COMMIT');
  }

  /**
   * Rollback a database transaction
   */
  protected async rollbackTransaction(): Promise<void> {
    await this.getDb().exec('ROLLBACK');
  }

  /**
   * Execute multiple operations in a transaction
   */
  protected async withTransaction<T>(operation: () => Promise<T>): Promise<T> {
    await this.beginTransaction();
    try {
      const result = await operation();
      await this.commitTransaction();
      return result;
    } catch (error) {
      await this.rollbackTransaction();
      throw error;
    }
  }
}