import { Request, Response, NextFunction } from 'express';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

/**
 * Image Optimization Middleware
 * Optimizes images for web delivery with caching
 */

interface ImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export class ImageOptimizationService {
  private cacheDir: string;
  private maxWidth: number = 1920;
  private maxHeight: number = 1080;
  private defaultQuality: number = 80;

  constructor(cacheDir: string = './public/uploads/cache') {
    this.cacheDir = cacheDir;
    this.ensureCacheDir();
  }

  /**
   * Ensure cache directory exists
   */
  private async ensureCacheDir(): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create cache directory:', error);
    }
  }

  /**
   * Generate cache key for image
   */
  private getCacheKey(imagePath: string, options: ImageOptions): string {
    const { width, height, quality, format } = options;
    return `${path.basename(imagePath)}_${width || 'auto'}_${height || 'auto'}_${quality || this.defaultQuality}_${format || 'original'}`;
  }

  /**
   * Get cached image path
   */
  private getCachedImagePath(cacheKey: string): string {
    return path.join(this.cacheDir, cacheKey);
  }

  /**
   * Check if cached image exists and is fresh
   */
  private async isCacheFresh(cachedPath: string, originalPath: string): Promise<boolean> {
    try {
      const [cachedStats, originalStats] = await Promise.all([
        fs.stat(cachedPath),
        fs.stat(originalPath),
      ]);

      // Cache is fresh if it's newer than the original
      return cachedStats.mtime >= originalStats.mtime;
    } catch {
      return false;
    }
  }

  /**
   * Optimize image
   */
  public async optimizeImage(
    imagePath: string,
    options: ImageOptions = {}
  ): Promise<string> {
    const cacheKey = this.getCacheKey(imagePath, options);
    const cachedPath = this.getCachedImagePath(cacheKey);

    // Check if cached version exists and is fresh
    if (await this.isCacheFresh(cachedPath, imagePath)) {
      return cachedPath;
    }

    // Process image
    let image = sharp(imagePath);

    // Get image metadata
    const metadata = await image.metadata();

    // Resize if needed
    const width = options.width || (metadata.width && metadata.width > this.maxWidth ? this.maxWidth : undefined);
    const height = options.height || (metadata.height && metadata.height > this.maxHeight ? this.maxHeight : undefined);

    if (width || height) {
      image = image.resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Set quality
    const quality = options.quality || this.defaultQuality;

    // Convert format if specified
    if (options.format === 'webp') {
      image = image.webp({ quality });
    } else if (options.format === 'jpeg' || metadata.format === 'jpeg') {
      image = image.jpeg({ quality, progressive: true });
    } else if (options.format === 'png' || metadata.format === 'png') {
      image = image.png({ quality, progressive: true });
    }

    // Save optimized image
    await image.toFile(cachedPath);

    return cachedPath;
  }

  /**
   * Generate responsive image sizes
   */
  public async generateResponsiveSizes(
    imagePath: string,
    sizes: number[] = [320, 640, 1024, 1920]
  ): Promise<{ [key: string]: string }> {
    const results: { [key: string]: string } = {};

    for (const size of sizes) {
      const optimizedPath = await this.optimizeImage(imagePath, {
        width: size,
        quality: 80,
        format: 'webp',
      });
      results[`${size}w`] = optimizedPath;
    }

    return results;
  }

  /**
   * Clear cache
   */
  public async clearCache(): Promise<void> {
    try {
      const files = await fs.readdir(this.cacheDir);
      await Promise.all(
        files.map(file => fs.unlink(path.join(this.cacheDir, file)))
      );
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  /**
   * Get cache size
   */
  public async getCacheSize(): Promise<number> {
    try {
      const files = await fs.readdir(this.cacheDir);
      const stats = await Promise.all(
        files.map(file => fs.stat(path.join(this.cacheDir, file)))
      );
      return stats.reduce((total, stat) => total + stat.size, 0);
    } catch {
      return 0;
    }
  }
}

/**
 * Express middleware for image optimization
 */
export const imageOptimizationMiddleware = (service: ImageOptimizationService) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only process image requests
    if (!req.path.match(/\.(jpg|jpeg|png|webp)$/i)) {
      return next();
    }

    try {
      const imagePath = path.join(process.cwd(), 'public', req.path);
      
      // Check if image exists
      try {
        await fs.access(imagePath);
      } catch {
        return next();
      }

      // Parse query parameters for optimization options
      const options: ImageOptions = {
        width: req.query['w'] ? parseInt(req.query['w'] as string) : undefined,
        height: req.query['h'] ? parseInt(req.query['h'] as string) : undefined,
        quality: req.query['q'] ? parseInt(req.query['q'] as string) : undefined,
        format: (req.query['f'] as 'jpeg' | 'png' | 'webp') || undefined,
      };

      // Optimize image
      const optimizedPath = await service.optimizeImage(imagePath, options);

      // Send optimized image
      res.sendFile(path.resolve(optimizedPath));
    } catch (error) {
      console.error('Image optimization error:', error);
      next();
    }
  };
};

// Export singleton instance
export const imageOptimizationService = new ImageOptimizationService();
