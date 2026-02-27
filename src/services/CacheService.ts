/**
 * Cache Service
 * Provides in-memory caching for frequently accessed data
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class CacheService {
  private static instance: CacheService;
  private cache: Map<string, CacheEntry<any>>;
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    this.cache = new Map();
    this.startCleanupInterval();
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Set a value in cache
   */
  public set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    };
    this.cache.set(key, entry);
  }

  /**
   * Get a value from cache
   */
  public get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Check if key exists in cache
   */
  public has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a value from cache
   */
  public delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  public clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  public size(): number {
    return this.cache.size;
  }

  /**
   * Get or set pattern - fetch from cache or compute and cache
   */
  public async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    const data = await fetchFn();
    this.set(key, data, ttl);
    return data;
  }

  /**
   * Invalidate cache by pattern
   */
  public invalidatePattern(pattern: string): number {
    let count = 0;
    const regex = new RegExp(pattern);
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    
    return count;
  }

  /**
   * Start cleanup interval to remove expired entries
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > entry.ttl) {
          this.cache.delete(key);
        }
      }
    }, 60 * 1000); // Run every minute
  }

  /**
   * Get cache statistics
   */
  public getStats(): {
    size: number;
    keys: string[];
    oldestEntry: number | null;
    newestEntry: number | null;
  } {
    const keys = Array.from(this.cache.keys());
    const timestamps = Array.from(this.cache.values()).map(e => e.timestamp);
    
    return {
      size: this.cache.size,
      keys,
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : null,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : null,
    };
  }
}
