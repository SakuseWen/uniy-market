import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { Request, Response, NextFunction } from 'express';

/**
 * Image processing configuration
 */
const IMAGE_CONFIG = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 85,
  thumbnailWidth: 400,
  thumbnailHeight: 400,
  formats: ['jpeg', 'png', 'webp'] as const
};

/**
 * Validate image dimensions
 */
async function validateImageDimensions(filePath: string): Promise<{ width: number; height: number; isValid: boolean; error?: string }> {
  try {
    const metadata = await sharp(filePath).metadata();
    
    if (!metadata.width || !metadata.height) {
      return {
        width: 0,
        height: 0,
        isValid: false,
        error: 'Unable to read image dimensions'
      };
    }

    // Check minimum dimensions (at least 200x200)
    if (metadata.width < 200 || metadata.height < 200) {
      return {
        width: metadata.width,
        height: metadata.height,
        isValid: false,
        error: 'Image dimensions too small. Minimum size is 200x200 pixels'
      };
    }

    // Check maximum dimensions (max 5000x5000)
    if (metadata.width > 5000 || metadata.height > 5000) {
      return {
        width: metadata.width,
        height: metadata.height,
        isValid: false,
        error: 'Image dimensions too large. Maximum size is 5000x5000 pixels'
      };
    }

    return {
      width: metadata.width,
      height: metadata.height,
      isValid: true
    };
  } catch (error) {
    return {
      width: 0,
      height: 0,
      isValid: false,
      error: 'Failed to process image file'
    };
  }
}

/**
 * Optimize and resize image
 */
async function optimizeImage(filePath: string): Promise<void> {
  try {
    const image = sharp(filePath);
    const metadata = await image.metadata();

    // Resize if image is larger than max dimensions
    let processedImage = image;
    if (metadata.width && metadata.height) {
      if (metadata.width > IMAGE_CONFIG.maxWidth || metadata.height > IMAGE_CONFIG.maxHeight) {
        processedImage = image.resize(IMAGE_CONFIG.maxWidth, IMAGE_CONFIG.maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }
    }

    // Optimize based on format
    if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
      await processedImage
        .jpeg({ quality: IMAGE_CONFIG.quality, progressive: true })
        .toFile(filePath + '.tmp');
    } else if (metadata.format === 'png') {
      await processedImage
        .png({ quality: IMAGE_CONFIG.quality, compressionLevel: 9 })
        .toFile(filePath + '.tmp');
    } else if (metadata.format === 'webp') {
      await processedImage
        .webp({ quality: IMAGE_CONFIG.quality })
        .toFile(filePath + '.tmp');
    } else {
      // Convert unsupported formats to JPEG
      await processedImage
        .jpeg({ quality: IMAGE_CONFIG.quality, progressive: true })
        .toFile(filePath + '.tmp');
    }

    // Replace original with optimized version
    await fs.unlink(filePath);
    await fs.rename(filePath + '.tmp', filePath);
  } catch (error) {
    // Clean up temp file if it exists
    try {
      await fs.unlink(filePath + '.tmp');
    } catch (e) {
      // Ignore cleanup errors
    }
    throw error;
  }
}

/**
 * Middleware to process uploaded images
 */
export async function processUploadedImages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Check if files were uploaded
    if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
      return next();
    }

    const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
    const validationErrors: string[] = [];
    const filesToDelete: string[] = [];

    // Validate and process each image
    for (const file of files) {
      try {
        // Validate dimensions
        const validation = await validateImageDimensions(file.path);
        
        if (!validation.isValid) {
          validationErrors.push(`${file.originalname}: ${validation.error}`);
          filesToDelete.push(file.path);
          continue;
        }

        // Optimize image
        await optimizeImage(file.path);
      } catch (error) {
        console.error(`Error processing image ${file.originalname}:`, error);
        validationErrors.push(`${file.originalname}: Failed to process image`);
        filesToDelete.push(file.path);
      }
    }

    // Delete invalid files
    for (const filePath of filesToDelete) {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.error(`Failed to delete invalid file ${filePath}:`, error);
      }
    }

    // If there were validation errors, return error response
    if (validationErrors.length > 0) {
      // Delete all uploaded files if any validation failed
      for (const file of files) {
        try {
          await fs.unlink(file.path);
        } catch (error) {
          // Ignore deletion errors
        }
      }

      return res.status(400).json({
        success: false,
        error: {
          code: 'IMAGE_VALIDATION_FAILED',
          message: 'One or more images failed validation',
          details: validationErrors,
          timestamp: new Date().toISOString(),
          requestId: req.get('x-request-id') || 'unknown'
        }
      }) as any;
    }

    // Filter out invalid files from req.files
    if (Array.isArray(req.files)) {
      req.files = req.files.filter(file => !filesToDelete.includes(file.path));
    }

    next();
  } catch (error) {
    console.error('Image processing middleware error:', error);
    
    // Clean up any uploaded files on error
    if (req.files) {
      const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
      for (const file of files) {
        try {
          await fs.unlink(file.path);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    }

    return res.status(500).json({
      success: false,
      error: {
        code: 'IMAGE_PROCESSING_FAILED',
        message: 'Failed to process uploaded images',
        timestamp: new Date().toISOString(),
        requestId: req.get('x-request-id') || 'unknown'
      }
    }) as any;
  }
}

/**
 * Delete image file from disk
 */
export async function deleteImageFile(imagePath: string): Promise<boolean> {
  try {
    const fullPath = path.join(__dirname, '../../public', imagePath);
    await fs.unlink(fullPath);
    return true;
  } catch (error) {
    console.error(`Failed to delete image file ${imagePath}:`, error);
    return false;
  }
}
